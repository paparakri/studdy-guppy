"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, X, Shuffle, Loader2, FileText } from 'lucide-react'

// Enhanced flashcard interface
interface Flashcard {
  id: number;
  question: string;
  answer: string;
  difficulty: string;
  category: string;
}

interface FileStatus {
  id: string
  status: 'uploaded' | 'processed' | 'transcribing' | 'transcription_error' | 'pdf_error'
  isTranscribing: boolean
  name: string
}

interface FlashcardViewProps {
  selectedDocuments: string[]
  fileStatuses: Record<string, FileStatus>
}

export function FlashcardView({ selectedDocuments, fileStatuses }: FlashcardViewProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [completedCards, setCompletedCards] = useState<number[]>([])
  const [studySession, setStudySession] = useState({ correct: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentCard = flashcards[currentCardIndex]
  const progress = flashcards.length > 0 ? ((currentCardIndex + 1) / flashcards.length) * 100 : 0

  // Check if any selected files are still transcribing
  const hasTranscribingFiles = selectedDocuments.some(docId => {
    const fileStatus = fileStatuses[docId]
    return fileStatus?.status === 'transcribing' || fileStatus?.isTranscribing
  })

  // Get list of transcribing file names for display
  const transcribingFileNames = selectedDocuments
    .filter(docId => {
      const fileStatus = fileStatuses[docId]
      return fileStatus?.status === 'transcribing' || fileStatus?.isTranscribing
    })
    .map(docId => fileStatuses[docId]?.name)
    .filter(Boolean)

  // Generate flashcards when selectedDocuments change (but only if no files are transcribing)
  useEffect(() => {
    if (selectedDocuments.length > 0 && !hasTranscribingFiles) {
      generateFlashcards()
    } else {
      setFlashcards([])
      setError(null)
    }
  }, [selectedDocuments, hasTranscribingFiles])

  const generateFlashcards = async (cardCount = 10) => {
    if (selectedDocuments.length === 0) return

    // Don't generate if files are still transcribing
    if (hasTranscribingFiles) {
      setError(`Please wait for transcription to complete: ${transcribingFileNames.join(', ')}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          cardCount
        })
      })

      const data = await response.json()

      if (response.ok) {
        setFlashcards(data.flashcards || [])
        setCurrentCardIndex(0)
        setIsFlipped(false)
        setCompletedCards([])
        setStudySession({ correct: 0, total: 0 })
      } else {
        setError(data.error || 'Failed to generate flashcards')
      }
    } catch (error) {
      console.error('Flashcard generation error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced navigation with automatic flip reset
  const prevCard = () => {
    setIsFlipped(false)
    setCurrentCardIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1))
  }

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentCardIndex((prev) => (prev === flashcards.length - 1 ? 0 : prev + 1))
  }

  // Enhanced card flip with smooth animation
  const flipCard = () => {
    setIsFlipped((prev) => !prev)
  }

  // Mark card as correct and move to next
  const markCorrect = () => {
    if (currentCard && !completedCards.includes(currentCard.id)) {
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

  // Shuffle flashcards
  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "hard":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  // Show message when no documents are selected
  if (selectedDocuments.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
            <FileText className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 gradient-text">No Documents Selected</h3>
          <p className="text-sm text-gray-400 mb-4">
            Select study materials from the left panel to generate flashcards
          </p>
        </div>
      </div>
    )
  }

  // Show transcription waiting message
  if (hasTranscribingFiles) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/20">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
          <h3 className="text-lg font-bold mb-2 gradient-text">Transcription in Progress</h3>
          <p className="text-sm text-gray-400 mb-4">
            Please wait for transcription to complete before generating flashcards
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 max-w-sm">
            <p className="text-xs text-blue-300 font-medium mb-1">Files being transcribed:</p>
            <div className="space-y-1">
              {transcribingFileNames.map((name, index) => (
                <div key={index} className="text-xs text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="truncate max-w-[200px]" title={name}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2 gradient-text">Generating Flashcards</h3>
          <p className="text-sm text-gray-400">
            Creating flashcards from {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-red-400">Error</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <Button 
            onClick={() => generateFlashcards()}
            disabled={hasTranscribingFiles}
            className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-4 py-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Show empty state when no flashcards were generated
  if (flashcards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
            <FileText className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 gradient-text">Generate Flashcards</h3>
          <p className="text-sm text-gray-400 mb-4">
            Create flashcards from your selected documents
          </p>
          <Button 
            onClick={() => generateFlashcards()}
            disabled={hasTranscribingFiles}
            className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-4 py-2"
          >
            Generate Flashcards
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Responsive header with progress and session stats */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">
              {currentCardIndex + 1}/{flashcards.length}
            </span>
            {currentCard && (
              <span className={`text-xs px-2 py-1 rounded-md border ${getDifficultyColor(currentCard.difficulty)}`}>
                {currentCard.difficulty}
              </span>
            )}
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
                    <h3 className="text-base font-semibold text-gray-100 leading-relaxed">{currentCard?.question}</h3>
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
                    <p className="text-sm text-gray-200 leading-relaxed">{currentCard?.answer}</p>
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
              onClick={shuffleCards}
              className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-3 py-2 text-gray-300 transition-all duration-300 text-xs"
            >
              <Shuffle className="h-3 w-3 mr-1" />
              Mix
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => generateFlashcards(20)}
              disabled={hasTranscribingFiles}
              className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-3 py-2 text-gray-300 transition-all duration-300 text-xs"
            >
              More Cards
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
            {completedCards.length} completed • {flashcards.length - completedCards.length} remaining
          </p>
        </div>
      </div>
    </div>
  )
}