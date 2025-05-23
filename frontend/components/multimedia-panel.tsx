"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BrainCircuit, FileQuestion, FlaskConical, BarChart } from "lucide-react"
import { FlashcardView } from "@/components/multimedia/flashcard-view"
import { SummaryView } from "@/components/multimedia/summary-view"
import type { ModalType } from "@/components/main-layout"

interface MultimediaPanelProps {
  className?: string
  openModal: (modal: ModalType) => void
}

export function MultimediaPanel({ className, openModal }: MultimediaPanelProps) {
  const [activeTab, setActiveTab] = useState("summary")

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Learning Tools</h2>
      </div>

      <Tabs defaultValue="summary" className="flex-1 flex flex-col" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-800">
          <TabsList className="bg-transparent w-full justify-start px-4 pt-2">
            <TabsTrigger value="summary" className="data-[state=active]:bg-gray-800 data-[state=active]:text-cyan-400">
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="flashcards"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-cyan-400"
            >
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="data-[state=active]:bg-gray-800 data-[state=active]:text-cyan-400">
              Quizzes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="summary" className="flex-1 m-0">
          <SummaryView />
        </TabsContent>

        <TabsContent value="flashcards" className="flex-1 m-0">
          <FlashcardView />
        </TabsContent>

        <TabsContent value="quizzes" className="flex-1 m-0 p-4">
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <FileQuestion className="h-16 w-16 text-gray-600" />
            <h3 className="text-lg font-medium">Ready for a Quiz?</h3>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Test your knowledge with interactive quizzes generated from your study materials.
            </p>
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={() => openModal("quiz")}>
              Start Quiz
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick access buttons */}
      <div className="p-3 border-t border-gray-800 bg-gray-900 flex justify-around">
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center h-auto py-2 hover:bg-gray-800"
          onClick={() => openModal("mindmap")}
        >
          <BrainCircuit className="h-5 w-5 mb-1 text-cyan-400" />
          <span className="text-xs">Mind Map</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center h-auto py-2 hover:bg-gray-800"
          onClick={() => openModal("quiz")}
        >
          <FileQuestion className="h-5 w-5 mb-1 text-cyan-400" />
          <span className="text-xs">Quiz</span>
        </Button>

        <Button variant="ghost" size="sm" className="flex flex-col items-center h-auto py-2 hover:bg-gray-800">
          <FlaskConical className="h-5 w-5 mb-1 text-cyan-400" />
          <span className="text-xs">Practice</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center h-auto py-2 hover:bg-gray-800"
          onClick={() => openModal("progress")}
        >
          <BarChart className="h-5 w-5 mb-1 text-cyan-400" />
          <span className="text-xs">Progress</span>
        </Button>
      </div>
    </div>
  )
}
