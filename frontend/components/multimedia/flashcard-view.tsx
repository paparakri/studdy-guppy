"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, X, Shuffle } from 'lucide-react'

// Enhanced mock flashcard data with difficulty levels and categories
const mockFlashcards = [
  {
    id: 1,
    question: "What is Supervised Learning?",
    answer:
      "A type of machine learning where the model is trained on labeled data, learning to map inputs to known outputs. Examples include classification and regression tasks.",
    difficulty: "Easy",
    category: "Fundamentals",
  },
  {
    id: 2,
    question: "What is a Neural Network?",
    answer:
      "A computational model inspired by the human brain, consisting of layers of interconnected nodes (neurons) that process information. Each connection has a weight that adjusts as learning proceeds.",
    difficulty: "Medium",
    category: "Deep Learning",
  },
  {
    id: 3,
    question: "What is Reinforcement Learning?",
    answer:
      "A type of machine learning where an agent learns to make decisions by taking actions in an environment to maximize cumulative rewards. It learns through trial and error.",
    difficulty: "Hard",
    category: "Advanced",
  },
]

export function FlashcardView() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [completedCards, setCompletedCards] = useState<number[]>([])
  const [studySession, setStudySession] = useState({ correct: 0, total: 0 })

  const currentCard = mockFlashcards[currentCardIndex]
  const progress = ((currentCardIndex + 1) / mockFlashcards.length) * 100

  // Enhanced navigation with automatic flip reset
  const prevCard = () => {
    setIsFlipped(false)
    setCurrentCardIndex((prev) => (prev === 0 ? mockFlashcards.length - 1 : prev - 1))
  }

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentCardIndex((prev) => (prev === mockFlashcards.length - 1 ? 0 : prev + 1))
  }

  // Enhanced card flip with smooth animation
  const flipCard = () => {
    setIsFlipped((prev) => !prev)
  }

  // Mark card as correct and move to next
  const markCorrect = () => {
    if (!completedCards.includes(currentCard.id)) {
      setCompletedCards((prev) => [...prev, currentCard.id])
      setStudySession((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }))
    }
    setTimeout(nextCard, 300)
  }

  // Mark card as incorrect and move to next
  const markIncorrect = () => {
    setStudySession((prev) => ({ total: prev.total + 1, correct: prev.correct }))
    setTimeout(nextCard, 300)
  }

  // Reset study session
  const resetSession = () => {
    setCompletedCards([])
    setStudySession({ correct: 0, total: 0 })
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "Hard":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Responsive header with progress and session stats */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">
              {currentCardIndex + 1}/{mockFlashcards.length}
            </span>
            <span className={`text-xs px-2 py-1 rounded-md border ${getDifficultyColor(currentCard.difficulty)}`}>
              {currentCard.difficulty}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {studySession.correct}/{studySession.total}
          </div>
        </div>

        <Progress value={progress} className="h-2 bg-gray-800 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </Progress>
      </div>

      {/* Responsive flashcard with 3D flip effect */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative w-full max-w-sm h-64">
          <Card
            className={`card-modern absolute inset-0 cursor-pointer transition-all duration-700 preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            } ${
              isFlipped
                ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-cyan-400/30"
                : "bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/20"
            } backdrop-blur-sm shadow-modern-xl hover:shadow-modern-xl`}
            onClick={flipCard}
          >
            {/* Front of card (Question) */}
            <div
              className={`absolute inset-0 backface-hidden ${isFlipped ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
            >
              <div className="h-full flex flex-col justify-between p-6">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-cyan-400/20">
                      <span className="text-xl">🤔</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-100 leading-relaxed">{currentCard.question}</h3>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-2">Tap to reveal</p>
                  <div className="w-6 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Back of card (Answer) */}
            <div
              className={`absolute inset-0 backface-hidden rotate-y-180 ${isFlipped ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
            >
              <div className="h-full flex flex-col justify-between p-6">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-teal-400/20">
                      <span className="text-xl">💡</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{currentCard.answer}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-2">Did you get it right?</p>
                  <div className="w-6 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mx-auto"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Responsive controls */}
      <div className="mt-4 space-y-3 flex-shrink-0">
        {/* Navigation controls */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={prevCard}
            className="btn-modern border-white/20 hover:bg-white/10 rounded-xl w-10 h-10 transition-all duration-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSession}
              className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-3 py-2 text-gray-300 transition-all duration-300 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-3 py-2 text-gray-300 transition-all duration-300 text-xs"
            >
              <Shuffle className="h-3 w-3 mr-1" />
              Mix
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextCard}
            className="btn-modern border-white/20 hover:bg-white/10 rounded-xl w-10 h-10 transition-all duration-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Answer feedback controls (only show when card is flipped) */}
        {isFlipped && (
          <div className="flex gap-2">
            <Button
              onClick={markIncorrect}
              className="flex-1 btn-modern bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-xl py-2 transition-all duration-300 text-sm"
            >
              <X className="h-3 w-3 mr-1" />
              Wrong
            </Button>

            <Button
              onClick={markCorrect}
              className="flex-1 btn-modern bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 rounded-xl py-2 transition-all duration-300 text-sm"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Right
            </Button>
          </div>
        )}

        {/* Study progress indicator */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            {completedCards.length} completed • {mockFlashcards.length - completedCards.length} remaining
          </p>
        </div>
      </div>
    </div>
  )
}
