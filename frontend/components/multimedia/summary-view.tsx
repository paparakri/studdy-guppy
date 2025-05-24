"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Target, Lightbulb, FileText, Loader2, AlertCircle, Download, Share2 } from 'lucide-react'

interface Chapter {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  estimatedReadTime: number;
}

interface SummaryData {
  documentIds: string[];
  overallSummary: string;
  chapters: Chapter[];
  keyTopics: string[];
  totalEstimatedTime: number;
  timestamp: string;
}

interface FileStatus {
  id: string
  status: 'uploaded' | 'processed' | 'transcribing' | 'transcription_error' | 'pdf_error'
  isTranscribing: boolean
  name: string
}

interface SummaryViewProps {
  selectedDocuments: string[]
  fileStatuses: Record<string, FileStatus>
}

export function SummaryView({ selectedDocuments, fileStatuses }: SummaryViewProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Get processed files (ready for summarization)
  const processedDocuments = selectedDocuments.filter(docId => {
    const fileStatus = fileStatuses[docId]
    return fileStatus?.status === 'processed' || !fileStatus?.isTranscribing
  })

  // Generate summary when selectedDocuments changes (but only if no files are transcribing)
  useEffect(() => {
    if (selectedDocuments.length > 0 && !hasTranscribingFiles) {
      generateSummary()
    } else {
      setSummaryData(null)
      setError(null)
    }
  }, [selectedDocuments, hasTranscribingFiles])

  const generateSummary = async (summaryType: string = 'detailed') => {
    if (selectedDocuments.length === 0) return

    // Don't generate if files are still transcribing
    if (hasTranscribingFiles) {
      setError(`Please wait for transcription to complete: ${transcribingFileNames.join(', ')}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          summaryType
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSummaryData(data)
      } else {
        setError(data.error || 'Failed to generate summary')
      }
    } catch (error) {
      console.error('Summary generation error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show message when no documents are selected
  if (selectedDocuments.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
            <FileText className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 gradient-text">No Documents Selected</h3>
          <p className="text-sm text-gray-400 mb-4">
            Select study materials from the left panel to generate summaries and chapters
          </p>
        </div>
      </div>
    )
  }

  // Show transcription waiting message
  if (hasTranscribingFiles) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/20">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
          <h3 className="text-lg font-bold mb-2 gradient-text">Transcription in Progress</h3>
          <p className="text-sm text-gray-400 mb-4">
            Please wait for transcription to complete before generating summaries
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
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2 gradient-text">Analyzing Content</h3>
          <p className="text-sm text-gray-400">
            Creating chapters and summaries from {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-red-400">Error</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <Button 
            onClick={() => generateSummary()}
            disabled={hasTranscribingFiles}
            className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-4 py-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Show summary content
  if (!summaryData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
            <BookOpen className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 gradient-text">Generate Summary</h3>
          <p className="text-sm text-gray-400 mb-4">
            Create organized summaries and chapters from your selected documents
          </p>
          <Button 
            onClick={() => generateSummary()}
            disabled={hasTranscribingFiles}
            className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-4 py-2"
          >
            Generate Summary
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
        {/* Enhanced header section with modern styling */}
        <div className="card-modern bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-modern">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-cyan-400/20">
                <BookOpen className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold gradient-text">Content Summary</h3>
                <p className="text-sm text-gray-400 mt-1">
                  AI-generated analysis from {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10 rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Overall summary */}
          <div className="bg-gray-900/50 rounded-xl p-4 border border-white/5 mb-4">
            <h4 className="text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Overview
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {summaryData.overallSummary}
            </p>
          </div>
          
          {/* Study metrics with modern design */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{summaryData.chapters.length}</div>
              <div className="text-xs text-gray-400">Chapters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-400">{summaryData.keyTopics.length}</div>
              <div className="text-xs text-gray-400">Key Topics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">~{summaryData.totalEstimatedTime}</div>
              <div className="text-xs text-gray-400">Min Read</div>
            </div>
          </div>
        </div>

        {/* Key Topics Section */}
        {summaryData.keyTopics.length > 0 && (
          <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-modern hover:shadow-modern-lg transition-all duration-300">
            <h4 className="font-bold text-lg text-gray-100 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-400" />
              Key Topics Covered
            </h4>
            <div className="flex flex-wrap gap-2">
              {summaryData.keyTopics.map((topic, index) => (
                <Badge 
                  key={index}
                  className="bg-gradient-to-r from-cyan-600/20 to-teal-600/20 hover:from-cyan-600/30 hover:to-teal-600/30 text-cyan-200 border-cyan-500/30 px-3 py-1 rounded-xl"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced chapter summaries with modern card design */}
        <div className="space-y-4">
          {summaryData.chapters.map((chapter, index) => (
            <div 
              key={chapter.id} 
              className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-modern hover:shadow-modern-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className={`${
                    index % 2 === 0 
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600" 
                      : "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600"
                  } text-white border-0 px-3 py-1 rounded-xl`}>
                    Chapter {index + 1}
                  </Badge>
                  <h4 className="font-bold text-lg text-gray-100">{chapter.title}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {chapter.estimatedReadTime} min read
                </div>
              </div>
              
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                {chapter.summary}
              </p>

              {/* Key points section */}
              {chapter.keyPoints.length > 0 && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">Key Points</span>
                  </div>
                  <div className="space-y-2">
                    {chapter.keyPoints.map((point, pointIndex) => (
                      <div key={pointIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-xs text-gray-300">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action buttons with modern styling */}
        <div className="flex gap-3 pt-4">
          <Button 
            className="flex-1 btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl py-3 shadow-modern transition-all duration-300"
            onClick={() => generateSummary('detailed')}
            disabled={hasTranscribingFiles}
          >
            Regenerate Summary
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 btn-modern border-white/20 hover:bg-white/10 rounded-xl py-3 transition-all duration-300"
            onClick={() => generateSummary('brief')}
            disabled={hasTranscribingFiles}
          >
            Brief Version
          </Button>
        </div>

        {/* Timestamp info */}
        <div className="text-center text-xs text-gray-500 pt-2">
          Generated {new Date(summaryData.timestamp).toLocaleString()}
        </div>
              </div>
      </ScrollArea>
    </div>
  )
}