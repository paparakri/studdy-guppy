"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle } from "lucide-react"

interface QuizModalProps {
  onClose: () => void
}

// Mock quiz data
const mockQuiz = {
  title: "Machine Learning Basics Quiz",
  questions: [
    {
      id: 1,
      question: "Which of the following is NOT a type of machine learning?",
      options: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Prescriptive Learning"],
      correctAnswer: 3,
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
    },
    {
      id: 3,
      question: "Deep learning is a subset of which field?",
      options: ["Reinforcement Learning", "Supervised Learning", "Machine Learning", "Data Mining"],
      correctAnswer: 2,
    },
  ],
}

export function QuizModal({ onClose }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(mockQuiz.questions.length).fill(null))
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const currentQuestion = mockQuiz.questions[currentQuestionIndex]

  // Calculate progress percentage
  const progress = ((currentQuestionIndex + 1) / mockQuiz.questions.length) * 100

  // Handle option selection
  const handleOptionSelect = (value: string) => {
    setSelectedOption(Number.parseInt(value))
  }

  // Move to next question
  const nextQuestion = () => {
    // Save the answer
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = selectedOption
    setAnswers(newAnswers)

    // Check if answer is correct
    setShowResult(true)

    // Wait before moving to next question
    setTimeout(() => {
      setShowResult(false)

      if (currentQuestionIndex < mockQuiz.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setSelectedOption(null)
      } else {
        setQuizCompleted(true)
      }
    }, 1500)
  }

  // Calculate quiz score
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

  // Restart quiz
  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setAnswers(Array(mockQuiz.questions.length).fill(null))
    setShowResult(false)
    setQuizCompleted(false)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mockQuiz.title}</DialogTitle>
        </DialogHeader>

        {!quizCompleted ? (
          <>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>
                  Question {currentQuestionIndex + 1} of {mockQuiz.questions.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="py-4">
              <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>

              <RadioGroup value={selectedOption?.toString()} onValueChange={handleOptionSelect} className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-3 rounded-md border ${
                      showResult
                        ? index === currentQuestion.correctAnswer
                          ? "border-green-500 bg-green-500/10"
                          : selectedOption === index
                            ? "border-red-500 bg-red-500/10"
                            : "border-gray-700"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={showResult} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>

                    {showResult && index === currentQuestion.correctAnswer && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}

                    {showResult && selectedOption === index && index !== currentQuestion.correctAnswer && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button
                onClick={nextQuestion}
                disabled={selectedOption === null || showResult}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {currentQuestionIndex === mockQuiz.questions.length - 1 ? "Finish" : "Next"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>

              {(() => {
                const result = calculateScore()
                return (
                  <>
                    <div className="text-5xl font-bold my-6 text-cyan-400">{result.percentage}%</div>
                    <p className="text-gray-300 mb-6">
                      You got {result.score} out of {result.total} questions correct.
                    </p>
                  </>
                )
              })()}

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={restartQuiz} className="bg-cyan-600 hover:bg-cyan-700">
                  Restart Quiz
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
