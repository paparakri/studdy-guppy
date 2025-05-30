// components/modals/quiz-modal.tsx - COMPLETE FILE
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, Trophy, Clock, Loader2, FileText, Settings, Brain } from "lucide-react"
import type { EnhancedQuizQuestion, StudySessionResult, QuestionResult } from '@/types/progress'

interface QuizModalProps {
  onClose: () => void
  selectedDocuments: string[]
}

export function QuizModal({ onClose, selectedDocuments }: QuizModalProps) {
  const [quizQuestions, setQuizQuestions] = useState<EnhancedQuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]) // NEW: Track detailed results
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [questionStartTime, setQuestionStartTime] = useState<number>(0) // NEW: Track time per question
  const [sessionStartTime, setSessionStartTime] = useState<number>(0) // NEW: Track session time
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(true)
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false) // NEW: Track progress submission
  
  // Quiz settings
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState(10)
  const [useAdaptiveLearning, setUseAdaptiveLearning] = useState(true) // NEW: Adaptive learning toggle

  const currentQuestion = quizQuestions[currentQuestionIndex]
  const progress = quizQuestions.length > 0 ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100 : 0
  const userId = 'default-user' // For hackathon - in real app, get from auth

  // Timer effect
  useEffect(() => {
    if (quizQuestions.length > 0 && !quizCompleted && !showSettings) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setQuizCompleted(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quizQuestions.length, quizCompleted, showSettings])

  // Track question start time when question changes
  useEffect(() => {
    if (!showSettings && !showResult && currentQuestion) {
      setQuestionStartTime(Date.now())
    }
  }, [currentQuestionIndex, showSettings, showResult, currentQuestion])

  const generateQuiz = async () => {
    if (selectedDocuments.length === 0) {
      setError('Please select documents to generate a quiz')
      return
    }

    setIsLoading(true)
    setError(null)
    setShowSettings(false)
    setSessionStartTime(Date.now()) // Start tracking session time

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          difficulty,
          questionCount,
          userId, // NEW: Pass user ID for adaptive learning
          useAdaptiveLearning // NEW: Enable adaptive learning
        })
      })

      const data = await response.json()

      if (response.ok) {
        setQuizQuestions(data.questions || [])
        setAnswers(Array(data.questions?.length || 0).fill(null))
        setQuestionResults([]) // Reset question results
        setCurrentQuestionIndex(0)
        setSelectedOption(null)
        setShowResult(false)
        setQuizCompleted(false)
        setTimeRemaining(questionCount * 30) // 30 seconds per question
        setQuestionStartTime(Date.now())
      } else {
        setError(data.error || 'Failed to generate quiz')
        setShowSettings(true)
      }
    } catch (error) {
      console.error('Quiz generation error:', error)
      setError('Network error. Please try again.')
      setShowSettings(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle option selection with visual feedback
  const handleOptionSelect = (value: string) => {
    setSelectedOption(Number.parseInt(value))
  }

  // Enhanced next question logic with progress tracking
  const nextQuestion = () => {
    if (!currentQuestion || selectedOption === null) return

    // Calculate time spent on this question
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    
    // Create question result for progress tracking
    const questionResult: QuestionResult = {
      questionId: currentQuestion.id.toString(),
      question: currentQuestion.question,
      userAnswer: selectedOption,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: selectedOption === currentQuestion.correctAnswer,
      chapterId: currentQuestion.chapterId,
      chapterTitle: currentQuestion.chapterTitle,
      topicName: currentQuestion.topicName,
      difficulty: currentQuestion.difficulty,
      timeSpent,
      timestamp: new Date().toISOString()
    }

    // Add to question results
    setQuestionResults(prev => [...prev, questionResult])

    // Update answers array
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = selectedOption
    setAnswers(newAnswers)

    setShowResult(true)

    setTimeout(() => {
      setShowResult(false)

      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setSelectedOption(null)
      } else {
        completeQuiz()
      }
    }, 2000)
  }

  // NEW: Complete quiz and submit progress
// NEW: Complete quiz and submit progress
const completeQuiz = async () => {
  setQuizCompleted(true)
  setIsSubmittingProgress(true)

  try {
    // Calculate session metrics
    const totalSessionTime = Math.round((Date.now() - sessionStartTime) / 1000)
    const correctAnswers = questionResults.filter(result => result.isCorrect).length

    // Create session result for progress tracking
    const sessionResult: StudySessionResult = {
      sessionId: `quiz_${Date.now()}`,
      userId,
      sessionType: 'quiz',
      documentIds: selectedDocuments,
      questionResults,
      totalQuestions: quizQuestions.length,
      correctAnswers,
      accuracy: (correctAnswers / quizQuestions.length) * 100,
      timeSpent: totalSessionTime,
      completedAt: new Date().toISOString(),
      difficulty
    }

    // Submit progress to API
    const progressResponse = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessionResult
      })
    })

    if (progressResponse.ok) {
      const progressData = await progressResponse.json()
      console.log('Progress updated successfully:', progressData)
      
      // Show achievements if any
      if (progressData.newAchievements?.length > 0) {
        console.log('New achievements unlocked:', progressData.newAchievements)
      }

      // NEW: Check if guppies were earned and trigger notification
      try {
        const guppyResponse = await fetch(`/api/guppies?userId=${userId}`);
        if (guppyResponse.ok) {
          const guppyData = await guppyResponse.json();
          if (guppyData.success && guppyData.data.fish.length > 0) {
            // Find recently earned guppies (earned in the last minute)
            const recentGuppies = guppyData.data.fish.filter((fish: any) => {
              const earnedTime = new Date(fish.earnedAt).getTime();
              const nowTime = Date.now();
              return (nowTime - earnedTime) < 60000; // Last minute
            });

            if (recentGuppies.length > 0) {
              // Dispatch event for aquarium widget
              window.dispatchEvent(new CustomEvent('newGuppiesEarned', { 
                detail: { 
                  guppies: recentGuppies, 
                  studyMinutes: Math.round(totalSessionTime / 60)
                } 
              }));
            }
          }
        }
      } catch (guppyError) {
        console.log('Could not check for new guppies:', guppyError);
      }
    } else {
      console.error('Failed to update progress')
    }
  } catch (error) {
    console.error('Failed to submit progress:', error)
  } finally {
    setIsSubmittingProgress(false)
  }
}

  // Enhanced score calculation with detailed analytics
  const calculateScore = () => {
    let correctCount = 0
    const chapterBreakdown: Record<string, { correct: number, total: number }> = {}
    
    questionResults.forEach((result) => {
      if (result.isCorrect) {
        correctCount++
      }
      
      // Track by chapter
      if (result.chapterId) {
        if (!chapterBreakdown[result.chapterId]) {
          chapterBreakdown[result.chapterId] = { correct: 0, total: 0 }
        }
        chapterBreakdown[result.chapterId].total++
        if (result.isCorrect) {
          chapterBreakdown[result.chapterId].correct++
        }
      }
    })

    return {
      score: correctCount,
      total: quizQuestions.length,
      percentage: Math.round((correctCount / quizQuestions.length) * 100),
      chapterBreakdown
    }
  }

  // Get performance message based on score
  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90)
      return { message: "Excellent! You've mastered this topic!", color: "text-green-400", icon: "🏆" }
    if (percentage >= 70)
      return { message: "Great job! You have a solid understanding.", color: "text-cyan-400", icon: "🎯" }
    if (percentage >= 50)
      return { message: "Good effort! Review the concepts and try again.", color: "text-yellow-400", icon: "📚" }
    return { message: "Keep studying! Practice makes perfect.", color: "text-red-400", icon: "💪" }
  }

  // Restart quiz with reset state
  const restartQuiz = () => {
    setShowSettings(true)
    setQuizQuestions([])
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setAnswers([])
    setQuestionResults([])
    setShowResult(false)
    setQuizCompleted(false)
    setTimeRemaining(300)
    setError(null)
    setIsSubmittingProgress(false)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
        <DialogHeader className="pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
                {useAdaptiveLearning && <Brain className="h-6 w-6 text-cyan-400" />}
                {showSettings ? 'Smart Quiz Settings' : 'Interactive Quiz'}
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                {showSettings 
                  ? `Generate an ${useAdaptiveLearning ? 'adaptive' : 'standard'} quiz from ${selectedDocuments.length} selected document${selectedDocuments.length > 1 ? 's' : ''}`
                  : useAdaptiveLearning ? 'AI-powered adaptive learning quiz' : 'Test your knowledge'
                }
              </p>
            </div>
            {!quizCompleted && !showSettings && quizQuestions.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Enhanced settings screen with adaptive learning toggle */}
        {showSettings && (
          <div className="py-6">
            {selectedDocuments.length === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
                  <FileText className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold mb-2 gradient-text">No Documents Selected</h3>
                <p className="text-sm text-gray-400">
                  Please select study materials from the left panel to generate a quiz
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Adaptive Learning Toggle */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl p-4 border border-cyan-400/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-cyan-300 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Adaptive Learning
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        AI personalizes questions based on your progress and weak areas
                      </p>
                    </div>
                    <Button
                      onClick={() => setUseAdaptiveLearning(!useAdaptiveLearning)}
                      variant={useAdaptiveLearning ? "default" : "outline"}
                      size="sm"
                      className={useAdaptiveLearning 
                        ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white" 
                        : "border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
                      }
                    >
                      {useAdaptiveLearning ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Difficulty Level</label>
                    <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                      <SelectTrigger className="bg-gray-800/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Number of Questions</label>
                    <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(Number(value))}>
                      <SelectTrigger className="bg-gray-800/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="15">15 Questions</SelectItem>
                        <SelectItem value="20">20 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Documents:</h4>
                  <p className="text-xs text-gray-400">
                    {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected for quiz generation
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show loading state with progress indicator */}
        {isLoading && (
          <div className="py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                {useAdaptiveLearning && <Brain className="h-8 w-8 text-teal-400 animate-pulse" />}
              </div>
              <h3 className="text-lg font-bold mb-2 gradient-text">
                {useAdaptiveLearning ? 'Creating Adaptive Quiz' : 'Generating Quiz'}
              </h3>
              <p className="text-sm text-gray-400">
                {useAdaptiveLearning 
                  ? `AI is analyzing your progress and creating personalized ${questionCount} ${difficulty} questions...`
                  : `Creating ${questionCount} ${difficulty} questions from your documents...`
                }
              </p>
            </div>
          </div>
        )}

        {/* Show quiz questions - THIS WAS MISSING! */}
        {!quizCompleted && !showSettings && !isLoading && quizQuestions.length > 0 && (
          <>
            {/* Enhanced progress section */}
            <div className="py-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span className="text-sm text-gray-400">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-3 bg-gray-800 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </Progress>
            </div>

            {/* Enhanced question section */}
            <div className="py-6">
              <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-100 leading-relaxed mb-4">{currentQuestion?.question}</h3>

                <RadioGroup value={selectedOption?.toString()} onValueChange={handleOptionSelect} className="space-y-4">
                  {currentQuestion?.options.map((option, index) => (
                    <div
                      key={index}
                      className={`card-modern group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        showResult
                          ? index === currentQuestion.correctAnswer
                            ? "border-green-500/50 bg-green-500/10 shadow-modern"
                            : selectedOption === index
                              ? "border-red-500/50 bg-red-500/10 shadow-modern"
                              : "border-white/10 bg-gray-800/20"
                          : selectedOption === index
                            ? "border-cyan-400/50 bg-cyan-500/10 shadow-modern"
                            : "border-white/10 bg-gray-800/20 hover:bg-gray-800/40 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <RadioGroupItem
                          value={index.toString()}
                          id={`option-${index}`}
                          disabled={showResult}
                          className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer text-gray-200 group-hover:text-white transition-colors duration-300"
                        >
                          {option}
                        </Label>

                        {/* Result indicators */}
                        {showResult && index === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="h-6 w-6 text-green-400" />
                        )}

                        {showResult && selectedOption === index && index !== currentQuestion.correctAnswer && (
                          <XCircle className="h-6 w-6 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                {/* Show explanation when result is displayed */}
                {showResult && (
                  <div className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-white/10">
                    <h4 className="text-sm font-medium text-cyan-400 mb-2">Explanation:</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{currentQuestion?.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Enhanced results with chapter breakdown */}
        {quizCompleted && quizQuestions.length > 0 && (
          <div className="py-8">
            <div className="text-center">
              {(() => {
                const result = calculateScore()
                const performance = getPerformanceMessage(result.percentage)
                return (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-400/20">
                      <span className="text-4xl">{performance.icon}</span>
                    </div>

                    <h3 className="text-3xl font-bold mb-2 gradient-text">Quiz Completed!</h3>

                    <div className="text-6xl font-bold my-8">
                      <span className="gradient-text">{result.percentage}%</span>
                    </div>

                    <p className={`text-lg mb-2 ${performance.color} font-medium`}>{performance.message}</p>

                    <p className="text-gray-400 mb-8">
                      You got {result.score} out of {result.total} questions correct.
                    </p>

                    {/* Progress submission indicator */}
                    {isSubmittingProgress && (
                      <div className="mb-6 text-sm text-cyan-400 flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating your progress...
                      </div>
                    )}

                    {/* Chapter breakdown if available */}
                    {Object.keys(result.chapterBreakdown).length > 0 && (
                      <div className="bg-gray-800/30 rounded-xl p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Performance by Chapter:</h4>
                        <div className="space-y-2">
                          {Object.entries(result.chapterBreakdown).map(([chapterId, data]) => (
                            <div key={chapterId} className="flex justify-between text-xs">
                              <span className="text-gray-400">{chapterId}</span>
                              <span className={data.correct / data.total >= 0.7 ? 'text-green-400' : 'text-yellow-400'}>
                                {data.correct}/{data.total} ({Math.round((data.correct / data.total) * 100)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed breakdown */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                        <div className="text-2xl font-bold text-cyan-400 mb-1">{result.score}</div>
                        <div className="text-xs text-gray-400">Correct</div>
                      </div>
                      <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                        <div className="text-2xl font-bold text-red-400 mb-1">{result.total - result.score}</div>
                        <div className="text-xs text-gray-400">Incorrect</div>
                      </div>
                      <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                        <div className="text-2xl font-bold text-teal-400 mb-1">{result.total}</div>
                        <div className="text-xs text-gray-400">Total</div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        <DialogFooter>
          {showSettings ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={onClose}
                className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-6 py-3 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button
                onClick={generateQuiz}
                disabled={selectedDocuments.length === 0}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 shadow-modern transition-all duration-300 hover:shadow-modern-lg"
              >
                {useAdaptiveLearning && <Brain className="h-4 w-4 mr-2" />}
                <Settings className="h-4 w-4 mr-2" />
                Generate Quiz
              </Button>
            </div>
          ) : quizCompleted ? (
            <div className="flex gap-4 justify-center w-full">
              <Button
                variant="outline"
                onClick={onClose}
                className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-6 py-3 transition-all duration-300"
              >
                Close
              </Button>
              <Button
                onClick={restartQuiz}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 shadow-modern transition-all duration-300 hover:shadow-modern-lg"
              >
                <Trophy className="h-4 w-4 mr-2" />
                New Quiz
              </Button>
            </div>
          ) : !isLoading && quizQuestions.length > 0 ? (
            <Button
              onClick={nextQuestion}
              disabled={selectedOption === null || showResult}
              className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-8 py-3 shadow-modern transition-all duration-300 hover:shadow-modern-lg disabled:opacity-50"
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}