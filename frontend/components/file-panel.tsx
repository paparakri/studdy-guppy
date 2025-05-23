"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Upload, File, FileText, FileAudio, FileVideo, Plus, FolderPlus } from 'lucide-react'

interface FilePanelProps {
  className?: string
}

// Enhanced mock file data with additional metadata for better UI representation
const mockFiles = [
  {
    id: 1,
    name: "Machine Learning Basics.pdf",
    type: "pdf",
    selected: true,
    size: "2.4 MB",
    lastModified: "2h ago",
  },
  {
    id: 2,
    name: "Data Structures Lecture.mp4",
    type: "video",
    selected: true,
    size: "45.2 MB",
    lastModified: "1d ago",
  },
  { id: 3, name: "Physics Notes.docx", type: "text", selected: false, size: "1.1 MB", lastModified: "3d ago" },
  { id: 4, name: "Calculus Lecture.mp3", type: "audio", selected: true, size: "12.8 MB", lastModified: "1w ago" },
  { id: 5, name: "Organic Chemistry.pdf", type: "pdf", selected: false, size: "3.7 MB", lastModified: "2w ago" },
]

export function FilePanel({ className }: FilePanelProps) {
  const [files, setFiles] = useState(mockFiles)
  const [searchQuery, setSearchQuery] = useState("")

  // Enhanced file filtering with better search functionality
  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Toggle file selection with visual feedback
  const toggleFileSelection = (id: number) => {
    setFiles(files.map((file) => (file.id === id ? { ...file, selected: !file.selected } : file)))
  }

  // Enhanced file icon system with better visual distinction
  const getFileIcon = (type: string) => {
    const iconProps = "h-4 w-4"
    switch (type) {
      case "pdf":
        return <FileText className={`${iconProps} text-red-400`} />
      case "video":
        return <FileVideo className={`${iconProps} text-blue-400`} />
      case "audio":
        return <FileAudio className={`${iconProps} text-green-400`} />
      default:
        return <File className={`${iconProps} text-gray-400`} />
    }
  }

  // Get file type color for visual consistency
  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "pdf":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "video":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "audio":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  return (
    <div className={`flex flex-col ${className} overflow-hidden`}>
      {/* Header section with responsive design */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold gradient-text truncate">Study Materials</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full whitespace-nowrap">
              {files.filter((f) => f.selected).length} selected
            </span>
          </div>
        </div>

        {/* Responsive search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            className="pl-10 pr-4 py-2 bg-gray-800/50 border-white/10 rounded-xl focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Responsive action buttons */}
        <div className="flex gap-2">
          <Button className="flex-1 btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl py-2 shadow-modern transition-all duration-300 hover:shadow-modern-lg text-sm">
            <Upload className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          <Button
            variant="outline"
            className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-3 py-2 transition-all duration-300"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File list section with responsive design */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-300">Your Files</span>
            <button className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 hover:bg-cyan-400/10 px-2 py-1 rounded-lg transition-all duration-300">
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>

          {/* Responsive file list */}
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`card-modern group relative p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                  file.selected
                    ? "bg-cyan-500/10 border-cyan-400/30 shadow-modern"
                    : "bg-gray-800/30 border-white/10 hover:bg-gray-800/50 hover:border-white/20"
                }`}
                onClick={() => toggleFileSelection(file.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={file.selected}
                    onCheckedChange={() => toggleFileSelection(file.id)}
                    className="mt-0.5 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 rounded-md flex-shrink-0"
                  />

                  {/* File icon */}
                  <div className="flex-shrink-0 mt-0.5">{getFileIcon(file.type)}</div>

                  {/* File information with responsive layout */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-gray-100 truncate group-hover:text-white transition-colors duration-300 text-sm">
                        {file.name}
                      </h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md border ${getFileTypeColor(file.type)} flex-shrink-0`}>
                        {file.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{file.size}</span>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <span>{file.lastModified}</span>
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                {file.selected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg"></div>
                )}
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredFiles.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">No files found.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
