"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Upload, File, FileText, FileAudio, FileVideo, Plus, FolderPlus, Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface FilePanelProps {
  className?: string
  onSelectedDocumentsChange: (selectedDocs: string[]) => void
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  selected: boolean;
  size: string;
  lastModified: string;
  status: 'uploaded' | 'processed' | 'transcribing' | 'transcription_error' | 'pdf_error';
  hasText: boolean;
  isTranscribing?: boolean;
  transcriptionJobName?: string;
  textPreview?: string;
}

const mockFiles: FileItem[] = []

export function FilePanel({ className, onSelectedDocumentsChange }: FilePanelProps) {
  const [files, setFiles] = useState<FileItem[]>(mockFiles)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  
  useEffect(() => {
    const selectedDocIds = files
      .filter(file => file.selected)
      .map(file => file.id)
    onSelectedDocumentsChange(selectedDocIds)
  }, [files, onSelectedDocumentsChange])

  // Poll for transcription status
  useEffect(() => {
    const transcribingFiles = files.filter(file => file.status === 'transcribing' && file.transcriptionJobName);
    
    if (transcribingFiles.length === 0) return;

    const interval = setInterval(async () => {
      for (const file of transcribingFiles) {
        try {
          const response = await fetch(`/api/transcription-status?jobName=${file.transcriptionJobName}&documentId=${file.id}`);
          const result = await response.json();

          if (result.status === 'completed') {
            setFiles(prevFiles => 
              prevFiles.map(f => 
                f.id === file.id 
                  ? { 
                      ...f, 
                      status: 'processed', 
                      hasText: true, 
                      textPreview: result.textPreview,
                      isTranscribing: false 
                    }
                  : f
              )
            );
          } else if (result.status === 'failed') {
            setFiles(prevFiles => 
              prevFiles.map(f => 
                f.id === file.id 
                  ? { 
                      ...f, 
                      status: 'transcription_error', 
                      isTranscribing: false 
                    }
                  : f
              )
            );
          }
        } catch (error) {
          console.error(`Failed to check transcription status for ${file.id}:`, error);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [files]);

  const filteredFiles = files.filter((file) => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress('Uploading file...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        const isVideoOrAudio = result.fileType === 'video' || result.fileType === 'audio';
        
        if (result.status === 'transcribing') {
          setUploadProgress('Starting transcription...')
        } else {
          setUploadProgress('Processing file...')
        }
        
        const newFile: FileItem = {
          id: result.documentId,
          name: result.fileName,
          type: result.fileType,
          selected: true,
          size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
          lastModified: 'Just now',
          status: result.status,
          hasText: result.hasText,
          isTranscribing: result.isTranscribing,
          transcriptionJobName: result.transcriptionJobName,
          textPreview: result.textPreview
        }

        setFiles(prevFiles => [...prevFiles, newFile])
        
        if (result.status === 'transcribing') {
          setUploadProgress('File uploaded! Transcription in progress...')
        } else {
          setUploadProgress('File uploaded successfully!')
        }
        
        event.target.value = ''
        setTimeout(() => setUploadProgress(''), 3000)
      } else {
        setUploadProgress(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress('Upload failed: Network error')
    } finally {
      setIsUploading(false)
    }
  }

  const toggleFileSelection = (id: string) => {
    setFiles(files.map((file) => 
      file.id === id ? { ...file, selected: !file.selected } : file
    ))
  }

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

  const getStatusIcon = (file: FileItem) => {
    switch (file.status) {
      case 'transcribing':
        return <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
      case 'processed':
        return <CheckCircle className="h-3 w-3 text-green-400" />
      case 'transcription_error':
      case 'pdf_error':
        return <AlertCircle className="h-3 w-3 text-red-400" />
      default:
        return null
    }
  }

  const getStatusText = (file: FileItem) => {
    switch (file.status) {
      case 'transcribing':
        return 'Transcribing...'
      case 'processed':
        return 'Ready'
      case 'transcription_error':
        return 'Transcription failed'
      case 'pdf_error':
        return 'Processing failed'
      default:
        return 'Uploaded'
    }
  }

  return (
    <div className={`flex flex-col ${className} overflow-hidden`}>
      {/* Header section */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold gradient-text truncate">Study Materials</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full whitespace-nowrap">
              {files.filter((f) => f.selected).length} selected
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            className="pl-10 pr-4 py-2 bg-gray-800/50 border-white/10 rounded-xl focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.mp3,.mp4,.txt,.docx,.wav,.aac,.m4a,.ogg,.flac,.mov,.avi,.mkv,.webm,.m4v"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button 
              className="w-full btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl py-2 shadow-modern transition-all duration-300 hover:shadow-modern-lg text-sm disabled:opacity-50"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              <span className="hidden sm:inline">
                {isUploading ? 'Uploading...' : 'Upload'}
              </span>
            </Button>
          </div>
          
          <Button
            variant="outline"
            className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-3 py-2 transition-all duration-300"
            disabled={isUploading}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>

        {/* Upload progress indicator */}
        {uploadProgress && (
          <div className="mt-2 text-xs text-center">
            <span className={`${
              uploadProgress.includes('failed') ? 'text-red-400' : 
              uploadProgress.includes('success') || uploadProgress.includes('Transcription in progress') ? 'text-green-400' : 'text-cyan-400'
            }`}>
              {uploadProgress}
            </span>
          </div>
        )}
      </div>

      {/* File list section */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-300">Your Files</span>
            <button className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 hover:bg-cyan-400/10 px-2 py-1 rounded-lg transition-all duration-300">
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>

          {/* File list */}
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

                  {/* File information */}
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

                    {/* Status indicator */}
                    <div className="flex items-center gap-1 mt-1">
                      {getStatusIcon(file)}
                      <span className={`text-xs ${
                        file.status === 'processed' ? 'text-green-400' :
                        file.status === 'transcribing' ? 'text-blue-400' :
                        file.status.includes('error') ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {getStatusText(file)}
                      </span>
                    </div>

                    {/* Text preview for processed files */}
                    {file.hasText && file.textPreview && file.status === 'processed' && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-900/50 rounded-lg p-2 border border-white/5">
                        <div className="line-clamp-2">{file.textPreview}</div>
                      </div>
                    )}
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
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'No files found.' : 'Upload your first study material to get started.'}
              </p>
              {!searchQuery && (
                <p className="text-gray-500 text-xs mt-1">
                  Supports PDFs, videos, audio files, and text documents
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}