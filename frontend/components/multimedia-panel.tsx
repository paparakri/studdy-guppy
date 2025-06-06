"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BrainCircuit, FileQuestion, FlaskConical, BarChart, BookOpen, Zap, Radio } from 'lucide-react'
import { FlashcardView } from "@/components/multimedia/flashcard-view"
import { SummaryView } from "@/components/multimedia/summary-view"
import type { ModalType } from "@/components/main-layout"

interface FileStatus {
  id: string
  status: 'uploaded' | 'processed' | 'transcribing' | 'transcription_error' | 'pdf_error'
  isTranscribing: boolean
  name: string
}

interface MultimediaPanelProps {
  className?: string
  openModal: (modal: ModalType) => void
  selectedDocuments: string[]
  fileStatuses: Record<string, FileStatus>
}

export function MultimediaPanel({ className, openModal, selectedDocuments, fileStatuses }: MultimediaPanelProps) {
  const [activeTab, setActiveTab] = useState("summary")

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

  const generateQuiz = async () => {
    // TODO: Call /api/generate-quiz
  };

  const generateFlashcards = async () => {
    // TODO: Call /api/generate-flashcards  
  };

  return (
    <div className={`flex flex-col ${className} overflow-hidden`}>
      {/* Responsive header */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-modern flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold gradient-text truncate">Learning Tools</h2>
            <p className="text-xs text-gray-400 truncate">Interactive features</p>
          </div>
        </div>
      </div>

      {/* Responsive tabs - FIXED: Added proper height constraints */}
      <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-white/10 px-4 py-2 flex-shrink-0">
          <TabsList className="bg-transparent w-full justify-start gap-1 pt-3 pb-2">
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-400/30 rounded-xl px-3 py-2 transition-all duration-300 text-sm"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger
              value="flashcards"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-400/30 rounded-xl px-3 py-2 transition-all duration-300 text-sm"
            >
              <Zap className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Cards</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab content - FIXED: Added proper height constraints and overflow handling */}
        <TabsContent value="summary" className="flex-1 m-0 overflow-hidden">
          <SummaryView selectedDocuments={selectedDocuments} fileStatuses={fileStatuses} />
        </TabsContent>

        <TabsContent value="flashcards" className="flex-1 m-0 overflow-hidden">
          <FlashcardView selectedDocuments={selectedDocuments} fileStatuses={fileStatuses} />
        </TabsContent>

        <TabsContent value="quizzes" className="flex-1 m-0 overflow-hidden p-4">
          {/* Responsive quiz tab content */}
          <div className="flex flex-col items-center justify-center h-full">
            <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center shadow-modern w-full max-w-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
                <FileQuestion className="h-6 w-6 text-cyan-400" />
              </div>

              <h3 className="text-lg font-bold mb-3 gradient-text">Ready for a Quiz?</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                {selectedDocuments.length > 0 
                  ? `Generate a quiz from ${selectedDocuments.length} selected document${selectedDocuments.length > 1 ? 's' : ''}.`
                  : 'Select study materials from the left panel to generate a quiz.'
                }
              </p>

              <Button
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 shadow-modern transition-all duration-300 hover:shadow-modern-lg w-full"
                onClick={() => openModal("quiz")}
                disabled={selectedDocuments.length === 0}
              >
                <FileQuestion className="h-4 w-4 mr-2" />
                Start Quiz
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Responsive quick access buttons - Updated with transcription status checks */}
      <div className="p-3 border-t border-white/10 bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
        <div className="grid grid-cols-4 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="btn-modern flex flex-col items-center h-auto py-2 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-teal-500/10 rounded-xl transition-all duration-300 group"
            onClick={() => openModal("mindmap")}
            disabled={selectedDocuments.length === 0 || hasTranscribingFiles}
            title={
              selectedDocuments.length === 0 
                ? "Select documents to generate mind map" 
                : hasTranscribingFiles
                ? `Waiting for transcription: ${transcribingFileNames.join(', ')}`
                : "Generate mind map"
            }
          >
            <div className="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-1 group-hover:bg-cyan-500/30 transition-all duration-300">
              <BrainCircuit className="h-3 w-3 text-cyan-400" />
            </div>
            <span className="text-xs font-medium">
              {selectedDocuments.length > 0 ? `Mind (${selectedDocuments.length})` : 'Mind'}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="btn-modern flex flex-col items-center h-auto py-2 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-teal-500/10 rounded-xl transition-all duration-300 group"
            onClick={() => openModal("quiz")}
          >
            <div className="w-6 h-6 bg-teal-500/20 rounded-lg flex items-center justify-center mb-1 group-hover:bg-teal-500/30 transition-all duration-300">
              <FileQuestion className="h-3 w-3 text-teal-400" />
            </div>
            <span className="text-xs font-medium">Quiz</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="btn-modern flex flex-col items-center h-auto py-2 hover:bg-gradient-to-br hover:from-purple-500/10 hover:to-pink-500/10 rounded-xl transition-all duration-300 group"
            onClick={() => openModal("podcast")}
            disabled={selectedDocuments.length === 0 || hasTranscribingFiles}
            title={
              selectedDocuments.length === 0 
                ? "Select documents to generate AI podcast" 
                : hasTranscribingFiles
                ? `Waiting for transcription: ${transcribingFileNames.join(', ')}`
                : "Generate AI podcast"
            }
          >
            <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center mb-1 group-hover:bg-purple-500/30 transition-all duration-300">
              <Radio className="h-3 w-3 text-purple-400" />
            </div>
            <span className="text-xs font-medium">
              {selectedDocuments.length > 0 ? `Cast (${selectedDocuments.length})` : 'Cast'}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="btn-modern flex flex-col items-center h-auto py-2 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-teal-500/10 rounded-xl transition-all duration-300 group"
            onClick={() => openModal("progress")}
          >
            <div className="w-6 h-6 bg-teal-500/20 rounded-lg flex items-center justify-center mb-1 group-hover:bg-teal-500/30 transition-all duration-300">
              <BarChart className="h-3 w-3 text-teal-400" />
            </div>
            <span className="text-xs font-medium">Stats</span>
          </Button>
        </div>
      </div>
    </div>
  )
}