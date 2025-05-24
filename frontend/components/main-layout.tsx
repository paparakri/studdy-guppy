"use client"

import { useState, useCallback } from "react"
import { FilePanel } from "@/components/file-panel"
import { ChatPanel } from "@/components/chat-panel"
import { MultimediaPanel } from "@/components/multimedia-panel"
import { QuizModal } from "@/components/modals/quiz-modal"
import { ProgressModal } from "@/components/modals/progress-modal"
import { MindMapModal } from "@/components/modals/mind-map-modal"
import { Header } from "@/components/header"

// Define modal types for type safety and better code organization
export type ModalType = "quiz" | "progress" | "mindmap" | null

// Resizer component for panel width adjustment
const PanelResizer = ({ onResize, isResizing }: { onResize: (e: MouseEvent) => void; isResizing: boolean }) => {
  return (
    <div
      className={`w-1 bg-white/10 hover:bg-cyan-400/50 cursor-col-resize transition-all duration-200 relative group ${
        isResizing ? "bg-cyan-400/70" : ""
      }`}
      onMouseDown={(e) => {
        e.preventDefault()
        document.addEventListener("mousemove", onResize)
        document.addEventListener("mouseup", () => {
          document.removeEventListener("mousemove", onResize)
        })
      }}
    >
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-cyan-400/20 transition-colors duration-200" />
    </div>
  )
}

export function MainLayout() {
  // State management for modal visibility with TypeScript safety
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  
  // Panel width state with responsive defaults
  const [leftPanelWidth, setLeftPanelWidth] = useState(25) // percentage
  const [rightPanelWidth, setRightPanelWidth] = useState(30) // percentage
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])

  const handleSelectedDocumentsChange = useCallback((selectedDocs: string[]) => {
    setSelectedDocuments(selectedDocs)
  }, [])

  // Modal control functions with proper typing
  const openModal = (modal: ModalType) => {
    setActiveModal(modal)
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  // Left panel resizer handler
  const handleLeftResize = useCallback((e: MouseEvent) => {
    setIsResizingLeft(true)
    const containerWidth = window.innerWidth
    const newWidth = Math.max(15, Math.min(40, (e.clientX / containerWidth) * 100))
    setLeftPanelWidth(newWidth)
    
    // Cleanup function
    const cleanup = () => {
      setIsResizingLeft(false)
      document.removeEventListener("mouseup", cleanup)
    }
    document.addEventListener("mouseup", cleanup)
  }, [])

  // Right panel resizer handler
  const handleRightResize = useCallback((e: MouseEvent) => {
    setIsResizingRight(true)
    const containerWidth = window.innerWidth
    const newWidth = Math.max(20, Math.min(45, ((containerWidth - e.clientX) / containerWidth) * 100))
    setRightPanelWidth(newWidth)
    
    // Cleanup function
    const cleanup = () => {
      setIsResizingRight(false)
      document.removeEventListener("mouseup", cleanup)
    }
    document.addEventListener("mouseup", cleanup)
  }, [])

  // Calculate middle panel width
  const middlePanelWidth = 100 - leftPanelWidth - rightPanelWidth

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 overflow-hidden">
      {/* Enhanced header with modern styling */}
      <Header />

      {/* Main content area with resizable panels */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel - File Management with adjustable width */}
        <div 
          className="flex-shrink-0 min-w-[200px] max-w-[500px]"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="h-full p-1 pl-1 pr-0">
            <FilePanel 
            className="h-full bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-modern overflow-hidden"
              onSelectedDocumentsChange={handleSelectedDocumentsChange}
            />
          </div>
        </div>

        {/* Left resizer */}
        <PanelResizer onResize={handleLeftResize} isResizing={isResizingLeft} />

        {/* Middle Panel - Chat Interface with flexible width */}
        <div 
          className="flex-1 min-w-[300px]"
          style={{ width: `${middlePanelWidth}%` }}
        >
          <div className="h-full p-1 px-0">
            <ChatPanel
              className="h-full bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-modern overflow-hidden"
              selectedDocuments={selectedDocuments}
            />
          </div>
        </div>

        {/* Right resizer */}
        <PanelResizer onResize={handleRightResize} isResizing={isResizingRight} />

        {/* Right Panel - Multimedia Tools with adjustable width */}
        <div 
          className="flex-shrink-0 min-w-[250px] max-w-[600px]"
          style={{ width: `${rightPanelWidth}%` }}
        >
          <div className="h-full p-1 pr-1 pl-0">
            <MultimediaPanel
              className="h-full bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-modern overflow-hidden"
              openModal={openModal}
              selectedDocuments={selectedDocuments}
            />
          </div>
        </div>
      </main>

      {/* Modal components with enhanced backdrop */}
      {activeModal === "quiz" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <QuizModal onClose={closeModal} selectedDocuments={selectedDocuments}  />
        </div>
      )}
      {activeModal === "progress" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <ProgressModal onClose={closeModal}/>
        </div>
      )}
      {activeModal === "mindmap" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <MindMapModal onClose={closeModal} selectedDocuments={selectedDocuments} />
        </div>
      )}
    </div>
  )
}
