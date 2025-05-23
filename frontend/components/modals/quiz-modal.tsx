"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Trophy, Clock } from "lucide-react"

interface QuizModalProps {
  onClose: () => void
}

// Enhanced mock quiz data with better structure and metadata
const mockQuiz = {
  title: "Machine Learning Basics Quiz",
  description: "Test your understanding of fundamental ML concepts",
  timeLimit: 300, // 5 minutes
  questions: [
    {
      id: 1,
      question: "Which of the following is NOT a type of machine learning?",
      options: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Prescriptive Learning"],
      correctAnswer: 3,
      explanation:
        "Prescriptive Learning is not a recognized type of machine learning. The three main types are Supervised, Unsupervised, and Reinforcement Learning.",
    },
    {
      id: 2,
      question: "What is the main characteristic of supervised learning?",
      options: [
        "Learning from unlabeled data",
        "Learning from labeled data",
        "Learning through trial and error",
        "Learning without any data",
      ],
      correctAnswer: 1,
      explanation: "Supervised learning uses labeled training data to learn the mapping between inputs and outputs.",
    },
    {
      id: 3,
      question: "Deep learning is a subset of which field?",
      options: ["Reinforcement Learning", "Supervised Learning", "Machine Learning", "Data Mining"],
      correctAnswer: 2,
      explanation: "Deep learning is a subset of machine learning that uses neural networks with multiple layers.",
    },
  ],
}

export function QuizModal({ onClose }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(mockQuiz.questions.length).fill(null))
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(mockQuiz.timeLimit)

  const currentQuestion = mockQuiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / mockQuiz.questions.length) * 100

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

      if (currentQuestionIndex < mockQuiz.questions.length - 1) {
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
      if (answer === mockQuiz.questions[index].correctAnswer) {
        correctCount++
      }
    })
    return {
      score: correctCount,
      total: mockQuiz.questions.length,
      percentage: Math.round((correctCount / mockQuiz.questions.length) * 100),
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
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setAnswers(Array(mockQuiz.questions.length).fill(null))
    setShowResult(false)
    setQuizCompleted(false)
    setTimeRemaining(mockQuiz.timeLimit)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
        <DialogHeader className="pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold gradient-text">{mockQuiz.title}</DialogTitle>
              <p className="text-sm text-gray-400 mt-1">{mockQuiz.description}</p>
            </div>
            {!quizCompleted && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {!quizCompleted ? (
          <>
            {/* Enhanced progress section */}
            <div className="py-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Question {currentQuestionIndex + 1} of {mockQuiz.questions.length}
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
                <h3 className="text-xl font-semibold text-gray-100 leading-relaxed mb-4">{currentQuestion.question}</h3>

                <RadioGroup value={selectedOption?.toString()} onValueChange={handleOptionSelect} className="space-y-4">
                  {currentQuestion.options.map((option, index) => (
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
                    <p className="text-sm text-gray-300 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={nextQuestion}
                disabled={selectedOption === null || showResult}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-8 py-3 shadow-modern transition-all duration-300 hover:shadow-modern-lg disabled:opacity-50"
              >
                {currentQuestionIndex === mockQuiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Enhanced results section */
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

                    <div className="flex gap-4 justify-center">
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
                        Retake Quiz
                      </Button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
