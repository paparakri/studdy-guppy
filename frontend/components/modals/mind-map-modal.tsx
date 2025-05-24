"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ZoomIn, ZoomOut, Download, Share2, RefreshCw, Settings, FileText, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"

interface MindMapModalProps {
  onClose: () => void
  selectedDocuments?: string[]
}

interface MindMapData {
  mermaidCode: string;
  documentIds: string[];
  documentsProcessed: number;
  timestamp: string;
}

export function MindMapModal({ onClose, selectedDocuments = [] }: MindMapModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userGuidance, setUserGuidance] = useState("")
  const [showSettings, setShowSettings] = useState(selectedDocuments.length === 0)
  
  const mermaidRef = useRef<HTMLDivElement>(null)

  // Generate mind map when component mounts or documents change
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      generateMindMap()
    }
  }, [selectedDocuments])

  // Render Mermaid diagram when mindMapData changes
  useEffect(() => {
    if (mindMapData?.mermaidCode && mermaidRef.current && typeof window !== 'undefined') {
      renderMermaidDiagram()
    }
  }, [mindMapData])

  const generateMindMap = async (guidance?: string) => {
    if (selectedDocuments.length === 0) {
      setError('Please select documents to generate a mind map')
      return
    }

    setIsLoading(true)
    setError(null)
    setShowSettings(false)

    try {
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          userGuidance: guidance || userGuidance
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMindMapData(data)
      } else {
        setError(data.error || 'Failed to generate mind map')
      }
    } catch (error) {
      console.error('Mind map generation error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderMermaidDiagram = async () => {
    if (!mindMapData?.mermaidCode || !mermaidRef.current) return

    try {
      // Dynamically import mermaid to avoid SSR issues
      const mermaid = (await import('mermaid')).default
      
      // Initialize mermaid with dark theme
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#06b6d4',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#0891b2',
          lineColor: '#14b8a6',
          sectionBkgColor: '#1f2937',
          altSectionBkgColor: '#374151',
          gridColor: '#4b5563',
          textColor: '#ffffff',
          taskBkgColor: '#1f2937',
          taskTextColor: '#ffffff',
          activeTaskBkgColor: '#06b6d4',
          activeTaskBorderColor: '#0891b2',
          gridLineColor: '#4b5563'
        },
        mindmap: {
          padding: 20,
          maxNodeWidth: 200
        }
      })

      // Clear previous content
      mermaidRef.current.innerHTML = ''

      // Generate unique ID for this diagram
      const diagramId = `mindmap-${Date.now()}`
      
      // Render the diagram
      const { svg } = await mermaid.render(diagramId, mindMapData.mermaidCode)
      mermaidRef.current.innerHTML = svg

    } catch (renderError) {
      console.error('Mermaid rendering error:', renderError)
      setError('Failed to render mind map. Please try regenerating.')
    }
  }

  // Zoom controls
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3))
  }

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.3))
  }

  const resetZoom = () => {
    setZoomLevel(1)
  }

  // Download functionality
  const downloadMindMap = () => {
    if (!mermaidRef.current) return

    const svg = mermaidRef.current.querySelector('svg')
    if (!svg) return

    // Create a canvas and convert SVG to PNG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const data = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      
      // Download as PNG
      const link = document.createElement('a')
      link.download = `mindmap-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(data)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
        <DialogHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold gradient-text">
                {showSettings ? 'Mind Map Settings' : 'Mind Map'}
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                {showSettings 
                  ? `Generate a mind map from ${selectedDocuments.length} selected document${selectedDocuments.length > 1 ? 's' : ''}`
                  : 'AI-generated knowledge visualization'
                }
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="border-white/20 hover:bg-white/10 rounded-xl"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </DialogHeader>

        {/* Settings Panel */}
        {showSettings && (
          <div className="py-4 space-y-4">
            {selectedDocuments.length === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
                  <FileText className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold mb-2 gradient-text">No Documents Selected</h3>
                <p className="text-sm text-gray-400">
                  Please select study materials from the left panel to generate a mind map
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300 mb-2 block">
                    Custom Instructions (Optional)
                  </Label>
                  <Textarea
                    placeholder="e.g., 'Focus on key concepts and relationships', 'Emphasize practical applications', etc."
                    value={userGuidance}
                    onChange={(e) => setUserGuidance(e.target.value)}
                    className="bg-gray-800/50 border-white/10 rounded-xl resize-none"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Documents:</h4>
                  <p className="text-xs text-gray-400">
                    {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected for mind map generation
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2 gradient-text">Generating Mind Map</h3>
              <p className="text-sm text-gray-400">
                Creating visual representation from {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''}...
              </p>
            </div>
          </div>
        )}

        {/* Mind Map Display */}
        {!showSettings && !isLoading && mindMapData && (
          <div className="relative flex-1 min-h-[500px] bg-gray-900 rounded-xl overflow-hidden">
            <div
              className="absolute inset-0 flex items-center justify-center p-4"
              style={{ 
                transform: `scale(${zoomLevel})`, 
                transition: "transform 0.2s ease-out",
                transformOrigin: "center center"
              }}
            >
              <div 
                ref={mermaidRef} 
                className="max-w-full max-h-full overflow-visible"
                style={{ minHeight: '400px', minWidth: '600px' }}
              />
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button variant="outline" size="icon" onClick={zoomOut} disabled={zoomLevel <= 0.3}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={resetZoom}>
                <span className="text-xs font-medium">{Math.round(zoomLevel * 100)}%</span>
              </Button>
              <Button variant="outline" size="icon" onClick={zoomIn} disabled={zoomLevel >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={downloadMindMap}>
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => generateMindMap()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Info overlay */}
            <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-xs text-gray-300">
                Generated from {mindMapData.documentsProcessed} document{mindMapData.documentsProcessed > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(mindMapData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!showSettings && !isLoading && error && !mindMapData && (
          <div className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <FileText className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-red-400">Error</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <Button 
                onClick={() => generateMindMap()}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-4 py-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {showSettings ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={onClose}
                className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-6 py-3 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => generateMindMap()}
                disabled={selectedDocuments.length === 0 || isLoading}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 shadow-modern transition-all duration-300 hover:shadow-modern-lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Generate Mind Map
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={onClose}
                className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-6 py-3 transition-all duration-300"
              >
                Close
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 shadow-modern transition-all duration-300 hover:shadow-modern-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                New Mind Map
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}