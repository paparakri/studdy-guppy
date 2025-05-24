"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, SkipForward, SkipBack, Download, Share2, RefreshCw, Settings, FileText, Loader2, Mic, Radio } from "lucide-react"
import { Label } from "@/components/ui/label"

interface PodcastModalProps {
  onClose: () => void
  selectedDocuments?: string[]
}

interface PodcastSegment {
  id: number;
  speaker: 'host1' | 'host2';
  text: string;
  audioUrl: string | null;
  voiceId: string;
  duration?: number;
  error?: string;
}

interface PodcastData {
  id: string;
  title: string;
  duration: string;
  segments: PodcastSegment[];
  script: any;
  documentIds: string[];
  timestamp: string;
}

export function PodcastModal({ onClose, selectedDocuments = [] }: PodcastModalProps) {
  const [podcastData, setPodcastData] = useState<PodcastData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(selectedDocuments.length === 0)
  
  // Podcast settings
  const [podcastStyle, setPodcastStyle] = useState('conversational')
  const [duration, setDuration] = useState('medium')
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSegment, setCurrentSegment] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  // Generate podcast when component mounts or documents change
  useEffect(() => {
    if (selectedDocuments.length > 0 && !showSettings) {
      generatePodcast()
    }
  }, [selectedDocuments])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration)
    }

    const handleEnded = () => {
      // Auto-play next segment
      if (podcastData && currentSegment < podcastData.segments.length - 1) {
        playSegment(currentSegment + 1)
      } else {
        setIsPlaying(false)
        setCurrentSegment(0)
      }
    }

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e)
      setIsPlaying(false)
      setError('Audio playback failed. The audio file may be corrupted or inaccessible.')
    }

    const handleCanPlay = () => {
      console.log('Audio can play')
    }

    const handleLoadStart = () => {
      console.log('Audio load started')
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadstart', handleLoadStart)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [currentSegment, podcastData])

  const generatePodcast = async () => {
    if (selectedDocuments.length === 0) {
      setError('Please select documents to generate a podcast')
      return
    }

    setIsLoading(true)
    setError(null)
    setShowSettings(false)

    try {
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          podcastStyle,
          duration
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPodcastData(data)
      } else {
        setError(data.error || 'Failed to generate podcast')
      }
    } catch (error) {
      console.error('Podcast generation error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const playSegment = (segmentIndex: number) => {
    if (!podcastData || !podcastData.segments[segmentIndex]) {
      console.error('Invalid segment index or no podcast data')
      return
    }
    
    const segment = podcastData.segments[segmentIndex]
    if (!segment.audioUrl) {
      console.error('No audio URL for segment', segmentIndex)
      setError(`No audio available for segment ${segmentIndex + 1}`)
      return
    }
    
    const audio = audioRef.current
    if (!audio) {
      console.error('Audio element not found')
      return
    }

    console.log(`Playing segment ${segmentIndex} with URL:`, segment.audioUrl)
    
    setCurrentSegment(segmentIndex)
    audio.src = segment.audioUrl
    
    // Add error handling for load failures
    audio.load()
    
    audio.play().catch(error => {
      console.error('Failed to play audio:', error)
      setError(`Failed to play audio: ${error.message}`)
      setIsPlaying(false)
    })
    
    setIsPlaying(true)
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      if (!audio.src && podcastData?.segments[currentSegment]?.audioUrl) {
        audio.src = podcastData.segments[currentSegment].audioUrl!
        audio.load()
      }
      
      audio.play().catch(error => {
        console.error('Failed to play audio:', error)
        setError(`Failed to play audio: ${error.message}`)
        setIsPlaying(false)
      })
      
      setIsPlaying(true)
    }
  }

  const skipForward = () => {
    if (podcastData && currentSegment < podcastData.segments.length - 1) {
      playSegment(currentSegment + 1)
    }
  }

  const skipBackward = () => {
    if (currentSegment > 0) {
      playSegment(currentSegment - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const downloadPodcast = () => {
    // For now, download the current segment
    if (podcastData?.segments[currentSegment]?.audioUrl) {
      const link = document.createElement('a')
      link.href = podcastData.segments[currentSegment].audioUrl!
      link.download = `${podcastData.title}_segment_${currentSegment + 1}.mp3`
      link.click()
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
        <DialogHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
                <Radio className="h-6 w-6" />
                {showSettings ? 'AI Podcast Generator' : 'AI Podcast Player'}
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                {showSettings 
                  ? `Generate an AI podcast from ${selectedDocuments.length} selected document${selectedDocuments.length > 1 ? 's' : ''}`
                  : 'AI-generated conversational podcast'
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
                  Please select study materials from the left panel to generate an AI podcast
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Podcast Style
                    </Label>
                    <Select value={podcastStyle} onValueChange={setPodcastStyle}>
                      <SelectTrigger className="bg-gray-800/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="interview">Interview Style</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Duration
                    </Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="bg-gray-800/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (3-5 min)</SelectItem>
                        <SelectItem value="medium">Medium (8-12 min)</SelectItem>
                        <SelectItem value="long">Long (15-20 min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Documents:</h4>
                  <p className="text-xs text-gray-400">
                    {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected for podcast generation
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
              <h3 className="text-lg font-bold mb-2 gradient-text">Generating AI Podcast</h3>
              <p className="text-sm text-gray-400">
                Creating conversational content from {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''}...
              </p>
              <div className="mt-4 text-xs text-gray-500">
                <p>• Analyzing content with AI</p>
                <p>• Generating conversation script</p>
                <p>• Converting to natural speech</p>
              </div>
            </div>
          </div>
        )}

        {/* Podcast Player */}
        {!showSettings && !isLoading && podcastData && (
          <div className="space-y-6">
            {/* Podcast Info */}
            <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-2">{podcastData.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{podcastData.segments.length} segments</span>
                <span>•</span>
                <span>{podcastData.duration} duration</span>
                <span>•</span>
                <span>Generated {new Date(podcastData.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Audio Player Controls */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={skipBackward}
                    disabled={currentSegment === 0}
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={togglePlayPause}
                    disabled={!podcastData.segments[currentSegment]?.audioUrl}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-full w-12 h-12"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    onClick={skipForward}
                    disabled={currentSegment >= podcastData.segments.length - 1}
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={downloadPodcast}
                    variant="outline"
                    size="sm"
                    className="border-white/20 hover:bg-white/10 rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 hover:bg-white/10 rounded-xl"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalDuration)}</span>
                </div>
              </div>

              {/* Current Segment Info */}
              <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={podcastData.segments[currentSegment]?.speaker === 'host1' ? 'default' : 'secondary'}>
                    {podcastData.segments[currentSegment]?.speaker === 'host1' ? 'Alex' : 'Sam'}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    Segment {currentSegment + 1} of {podcastData.segments.length}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {podcastData.segments[currentSegment]?.text}
                </p>
              </div>
            </div>

            {/* Segment List */}
            <div className="bg-gray-800/30 rounded-xl border border-white/10">
              <div className="p-4 border-b border-white/10">
                <h4 className="font-semibold text-gray-200">Podcast Segments</h4>
              </div>
              <ScrollArea className="max-h-60">
                <div className="p-2">
                  {podcastData.segments.map((segment, index) => (
                    <div
                      key={segment.id}
                      className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-300 ${
                        index === currentSegment
                          ? 'bg-cyan-500/20 border border-cyan-400/30'
                          : 'bg-gray-800/50 hover:bg-gray-800/70 border border-transparent'
                      }`}
                      onClick={() => segment.audioUrl && playSegment(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={segment.speaker === 'host1' ? 'default' : 'secondary'} className="text-xs">
                            {segment.speaker === 'host1' ? 'Alex' : 'Sam'}
                          </Badge>
                          {segment.audioUrl ? (
                            <Mic className="h-3 w-3 text-green-400" />
                          ) : (
                            <div className="h-3 w-3 bg-red-400 rounded-full" />
                          )}
                        </div>
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                        {segment.text}
                      </p>
                      {segment.error && (
                        <p className="text-xs text-red-400 mt-1">Error: {segment.error}</p>
                      )}
                      {segment.audioUrl && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          Audio: {segment.audioUrl.includes('amazonaws.com') ? 'S3 URL Available' : 'Custom URL'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Hidden Audio Element */}
            <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
          </div>
        )}

        {/* Error State */}
        {!showSettings && !isLoading && error && !podcastData && (
          <div className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <Radio className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-red-400">Generation Failed</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <Button 
                onClick={() => generatePodcast()}
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
                onClick={() => generatePodcast()}
                disabled={selectedDocuments.length === 0 || isLoading}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 shadow-modern transition-all duration-300 hover:shadow-modern-lg"
              >
                <Radio className="h-4 w-4 mr-2" />
                Generate Podcast
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
                New Podcast
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}