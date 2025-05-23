"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

// Mock flashcard data
const mockFlashcards = [
  {
    id: 1,
    question: "What is Supervised Learning?",
    answer:
      "A type of machine learning where the model is trained on labeled data, learning to map inputs to known outputs.",
  },
  {
    id: 2,
    question: "What is a Neural Network?",
    answer:
      "A computational model inspired by the human brain, consisting of layers of interconnected nodes (neurons) that process information.",
  },
  {
    id: 3,
    question: "What is Reinforcement Learning?",
    answer:
      "A type of machine learning where an agent learns to make decisions by taking actions in an environment to maximize rewards.",
  },
]

export function FlashcardView() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [completedCards, setCompletedCards] = useState<number[]>([])

  const currentCard = mockFlashcards[currentCardIndex]

  // Navigate to previous card
  const prevCard = () => {
    setIsFlipped(false)
    setCurrentCardIndex((prev) => (prev === 0 ? mockFlashcards.length - 1 : prev - 1))
  }

  // Navigate to next card
  const nextCard = () => {
    setIsFlipped(false)
    setCurrentCardIndex((prev) => (prev === mockFlashcards.length - 1 ? 0 : prev + 1))
  }

  // Toggle card flip
  const flipCard = () => {
    setIsFlipped((prev) => !prev)
  }

  // Mark current card as completed
  const markCompleted = () => {
    if (!completedCards.includes(currentCard.id)) {
      setCompletedCards((prev) => [...prev, currentCard.id])
    }
    nextCard()
  }

  // Reset completed cards
  const resetProgress = () => {
    setCompletedCards([])
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          Card {currentCardIndex + 1} of {mockFlashcards.length}
        </div>
        <div className="text-sm text-gray-400">{completedCards.length} completed</div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center">
        <Card
          className={`w-full max-w-md h-64 cursor-pointer transition-all duration-500 ${
            isFlipped ? "bg-gray-800" : "bg-gray-900"
          }`}
          onClick={flipCard}
        >
          <div className="h-full flex items-center justify-center p-6 text-center">
            <div className="text-lg">{isFlipped ? currentCard.answer : currentCard.question}</div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" size="icon" onClick={prevCard}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetProgress} className="text-gray-400">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>

          <Button
            size="sm"
            onClick={markCompleted}
            className={`${
              completedCards.includes(currentCard.id)
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-cyan-600 hover:bg-cyan-700"
            }`}
          >
            {completedCards.includes(currentCard.id) ? "Completed" : "Mark as Completed"}
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={nextCard}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
