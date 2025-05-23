"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Upload, File, FileText, FileAudio, FileVideo, Plus } from "lucide-react"

interface FilePanelProps {
  className?: string
}

// Mock file data for demonstration
const mockFiles = [
  { id: 1, name: "Machine Learning Basics.pdf", type: "pdf", selected: true },
  { id: 2, name: "Data Structures Lecture.mp4", type: "video", selected: true },
  { id: 3, name: "Physics Notes.docx", type: "text", selected: false },
  { id: 4, name: "Calculus Lecture.mp3", type: "audio", selected: true },
  { id: 5, name: "Organic Chemistry.pdf", type: "pdf", selected: false },
]

export function FilePanel({ className }: FilePanelProps) {
  const [files, setFiles] = useState(mockFiles)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter files based on search query
  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Toggle file selection
  const toggleFileSelection = (id: number) => {
    setFiles(files.map((file) => (file.id === id ? { ...file, selected: !file.selected } : file)))
  }

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-400" />
      case "video":
        return <FileVideo className="h-4 w-4 text-blue-400" />
      case "audio":
        return <FileAudio className="h-4 w-4 text-green-400" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Study Materials</h2>

        {/* Search files */}
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search files..."
            className="pl-8 bg-gray-900 border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Add files button */}
        <Button className="w-full bg-gray-800 hover:bg-gray-700">
          <Upload className="h-4 w-4 mr-2" />
          Add Files
        </Button>
      </div>

      {/* File list */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-400">Your Files</span>
            <button className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center">
              <Plus className="h-3 w-3 mr-1" />
              New Folder
            </button>
          </div>

          <ul className="space-y-2">
            {filteredFiles.map((file) => (
              <li key={file.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800">
                <Checkbox
                  checked={file.selected}
                  onCheckedChange={() => toggleFileSelection(file.id)}
                  className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                />
                {getFileIcon(file.type)}
                <span className="text-sm flex-1 truncate">{file.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    </div>
  )
}
