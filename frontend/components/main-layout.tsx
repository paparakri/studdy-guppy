"use client"

import { useState } from "react"
import { FilePanel } from "@/components/file-panel"
import { ChatPanel } from "@/components/chat-panel"
import { MultimediaPanel } from "@/components/multimedia-panel"
import { QuizModal } from "@/components/modals/quiz-modal"
import { ProgressModal } from "@/components/modals/progress-modal"
import { MindMapModal } from "@/components/modals/mind-map-modal"
import { Header } from "@/components/header"

// Define modal types for type safety
export type ModalType = "quiz" | "progress" | "mindmap" | null

export function MainLayout() {
  // State for controlling which modal is open
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  // Function to open a specific modal
  const openModal = (modal: ModalType) => {
    setActiveModal(modal)
  }

  // Function to close the active modal
  const closeModal = () => {
    setActiveModal(null)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <Header />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel - Files */}
        <FilePanel className="w-1/4 min-w-[250px] border-r border-gray-800" />

        {/* Middle Panel - Chat */}
        <ChatPanel className="flex-1" />

        {/* Right Panel - Multimedia */}
        <MultimediaPanel className="w-1/3 min-w-[300px] border-l border-gray-800" openModal={openModal} />
      </main>

      {/* Modals */}
      {activeModal === "quiz" && <QuizModal onClose={closeModal} />}
      {activeModal === "progress" && <ProgressModal onClose={closeModal} />}
      {activeModal === "mindmap" && <MindMapModal onClose={closeModal} />}
    </div>
  )
}
