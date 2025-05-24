"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, Trophy, Clock, Loader2, FileText, Settings } from "lucide-react"

interface QuizModalProps {
  onClose: () => void
  selectedDocuments: string[]
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export function QuizModal({ onClose, selectedDocuments }: QuizModalProps) {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(true)
  
  // Quiz settings
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState(10)

  const currentQuestion = quizQuestions[currentQuestionIndex]
  const progress = quizQuestions.length > 0 ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100 : 0

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

  const generateQuiz = async () => {
    if (selectedDocuments.length === 0) {
      setError('Please select documents to generate a quiz')
      return
    }

    setIsLoading(true)
    setError(null)
    setShowSettings(false)

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          difficulty,
          questionCount
        })
      })

      const data = await response.json()

      if (response.ok) {
        setQuizQuestions(data.questions || [])
        setAnswers(Array(data.questions?.length || 0).fill(null))
        setCurrentQuestionIndex(0)
        setSelectedOption(null)
        setShowResult(false)
        setQuizCompleted(false)
        setTimeRemaining(questionCount * 30) // 30 seconds per question
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

  // Enhanced next question logic with better UX
  const nextQuestion = () => {
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
        setQuizCompleted(true)
      }
    }, 2000)
  }

  // Enhanced score calculation with detailed analytics
  const calculateScore = () => {
    let correctCount = 0
    answers.forEach((answer, index) => {
      if (answer === quizQuestions[index]?.correctAnswer) {
        correctCount++
      }
    })
    return {
      score: correctCount,
      total: quizQuestions.length,
      percentage: Math.round((correctCount / quizQuestions.length) * 100),
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
    setShowResult(false)
    setQuizCompleted(false)
    setTimeRemaining(300)
    setError(null)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
        <DialogHeader className="pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold gradient-text">
                {showSettings ? 'Quiz Settings' : 'Interactive Quiz'}
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                {showSettings 
                  ? `Generate a quiz from ${selectedDocuments.length} selected document${selectedDocuments.length > 1 ? 's' : ''}`
                  : 'Test your knowledge'
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

        {/* Show settings screen */}
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

        {/* Show loading state */}
        {isLoading && (
          <div className="py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2 gradient-text">Generating Quiz</h3>
              <p className="text-sm text-gray-400">
                Creating {questionCount} {difficulty} questions from your documents...
              </p>
            </div>
          </div>
        )}

        {/* Show quiz questions */}
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

        {/* Show results */}
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