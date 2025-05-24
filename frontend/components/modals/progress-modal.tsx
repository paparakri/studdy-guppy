// components/modals/progress-modal.tsx - FIXED VERSION
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, LineChart, PieChart, Brain, Target, Clock, Trophy, Loader2, RefreshCw, TrendingUp, Award } from "lucide-react"
import type { UserProgress, ProgressAnalytics, ChapterProgress } from '@/types/progress'

interface ProgressModalProps {
  onClose: () => void
}

export function ProgressModal({ onClose }: ProgressModalProps) {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  
  const userId = 'default-user' // For hackathon - in real app, get from auth

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/progress?userId=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setUserProgress(data.userProgress)
        setAnalytics(data.analytics)
        setLastRefresh(new Date().toLocaleTimeString())
      } else {
        setError(data.error || 'Failed to load progress')
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getProgressColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-400'
    if (accuracy >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getProgressBgColor = (accuracy: number) => {
    if (accuracy >= 80) return 'from-green-600/20 to-green-500/20 border-green-500/30'
    if (accuracy >= 60) return 'from-yellow-600/20 to-yellow-500/20 border-yellow-500/30'
    return 'from-red-600/20 to-red-500/20 border-red-500/30'
  }

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text text-center">
              Loading Progress
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Analyzing your learning journey...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400 text-center flex items-center justify-center gap-2">
              <BarChart className="h-5 w-5" />
              Error Loading Progress
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <BarChart className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <Button 
                onClick={loadProgressData}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-4 py-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!userProgress) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text text-center flex items-center justify-center gap-2">
              <BarChart className="h-5 w-5" />
              No Progress Yet
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-400/20">
                <BarChart className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Start taking quizzes and using flashcards to track your learning progress!
              </p>
              <Button 
                onClick={onClose}
                className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-4 py-2"
              >
                Start Learning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl overflow-hidden">
        <DialogHeader className="pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
                <BarChart className="h-6 w-6" />
                Learning Progress
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                Track your learning journey and identify areas for improvement
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Last updated: {lastRefresh}</span>
              <Button
                onClick={loadProgressData}
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-white/10 rounded-xl"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <TabsList className="grid grid-cols-4 mb-4 shrink-0">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs sm:text-sm">
                <PieChart className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="chapters" className="flex items-center gap-1 text-xs sm:text-sm">
                <BarChart className="h-4 w-4" />
                <span className="hidden sm:inline">Chapters</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1 text-xs sm:text-sm">
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-1 text-xs sm:text-sm">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Awards</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 pb-4">
                  {/* Overall Stats */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 sm:p-6 border border-white/10">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-cyan-400" />
                      Overall Performance
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">
                          {userProgress.overallAccuracy.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Overall Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-teal-400 mb-1">
                          {userProgress.totalQuestionsAnswered}
                        </div>
                        <div className="text-sm text-gray-400">Questions Answered</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-300">Progress</span>
                        <span className="text-sm text-gray-400">{userProgress.overallAccuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={userProgress.overallAccuracy} className="h-2" />
                    </div>
                  </div>

                  {/* Learning Activities */}
                  <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-white/10">
                    <h3 className="text-lg font-medium mb-4">Learning Activities</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-white/5">
                        <div className="text-xl sm:text-2xl font-bold text-cyan-400 mb-1">
                          {userProgress.totalCorrectAnswers}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">Correct Answers</div>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-white/5">
                        <div className="text-xl sm:text-2xl font-bold text-teal-400 mb-1">
                          {Math.floor(userProgress.totalStudyTime / 60)}h {userProgress.totalStudyTime % 60}m
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">Study Time</div>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-white/5">
                        <div className="text-xl sm:text-2xl font-bold text-purple-400 mb-1">
                          {userProgress.studyStreak}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">Day Streak</div>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-white/5">
                        <div className="text-xl sm:text-2xl font-bold text-green-400 mb-1">
                          {userProgress.strongAreas.length}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">Mastered Areas</div>
                      </div>
                    </div>
                  </div>

                  {/* Areas to Improve */}
                  {analytics?.improvementAreas && analytics.improvementAreas.length > 0 && (
                    <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-white/10">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-yellow-400" />
                        Areas to Improve
                      </h3>
                      <div className="space-y-3">
                        {analytics.improvementAreas.slice(0, 3).map((area, index) => (
                          <div key={area.chapterId} className={`bg-gradient-to-r ${getProgressBgColor(area.currentAccuracy)} rounded-lg p-4 border`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm font-medium text-gray-200 flex-1 pr-2">{area.chapterTitle}</div>
                              <div className={`text-sm font-bold ${getProgressColor(area.currentAccuracy)} shrink-0`}>
                                {area.currentAccuracy.toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">{area.recommendedAction}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strong Areas */}
                  {userProgress.strongAreas.length > 0 && (
                    <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-white/10">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-400" />
                        Mastered Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {userProgress.strongAreas.map(chapterId => {
                          const chapter = userProgress.chapterProgress[chapterId]
                          return (
                            <Badge 
                              key={chapterId}
                              className="bg-gradient-to-r from-green-600/20 to-green-500/20 text-green-300 border-green-500/30 px-3 py-1 text-xs"
                            >
                              {chapter?.chapterTitle || chapterId} ({chapter?.accuracy.toFixed(0)}%)
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="chapters" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4 pb-4">
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                    <h3 className="text-lg font-medium mb-4">Chapter Performance</h3>
                  
                    {Object.keys(userProgress.chapterProgress).length === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No chapter data yet. Take some quizzes to see detailed progress!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.values(userProgress.chapterProgress)
                          .sort((a, b) => b.accuracy - a.accuracy)
                          .map((chapter: ChapterProgress) => (
                          <div key={chapter.chapterId} className="bg-gray-900/50 rounded-lg p-4 border border-white/5">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 pr-4">
                                <h4 className="font-medium text-gray-200 text-sm sm:text-base">{chapter.chapterTitle}</h4>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-400 mt-1">
                                  <span>{chapter.totalQuestions} questions</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(chapter.lastStudied).toLocaleDateString()}
                                  </span>
                                  <span>•</span>
                                  <Badge variant={chapter.needsReview ? "destructive" : "secondary"} className="text-xs">
                                    {chapter.needsReview ? 'Needs Review' : 'Good'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className={`text-lg font-bold ${getProgressColor(chapter.accuracy)}`}>
                                  {chapter.accuracy.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-400">
                                  {chapter.correctAnswers}/{chapter.totalQuestions}
                                </div>
                              </div>
                            </div>
                            <Progress value={chapter.accuracy} className="h-2" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 pb-4">
                  {analytics?.recentSessions && analytics.recentSessions.length > 0 ? (
                    analytics.recentSessions
                      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                      .map((session, index) => (
                      <div key={session.sessionId} className="bg-gray-800/30 rounded-lg p-4 border border-white/10">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 pr-4">
                            <h4 className="font-medium text-gray-200 capitalize text-sm sm:text-base">
                              {session.sessionType} Session
                            </h4>
                            <p className="text-sm text-gray-400">
                              Score: {session.correctAnswers}/{session.totalQuestions} ({session.accuracy.toFixed(1)}%)
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm text-gray-400">
                              {new Date(session.completedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.floor(session.timeSpent / 60)}m {session.timeSpent % 60}s
                            </div>
                          </div>
                        </div>
                        <Progress value={session.accuracy} className="h-2 mb-2" />
                        
                        {/* Show difficulty badge */}
                        <div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              session.difficulty === 'hard' ? 'border-red-400/30 text-red-300' :
                              session.difficulty === 'medium' ? 'border-yellow-400/30 text-yellow-300' :
                              'border-green-400/30 text-green-300'
                            }`}
                          >
                            {session.difficulty.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <LineChart className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No session history yet. Complete some quizzes to see your progress!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="achievements" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 pb-4">
                  {analytics?.achievements && analytics.achievements.length > 0 ? (
                    <div className="grid gap-4">
                      {analytics.achievements.map((achievement, index) => (
                        <div key={index} className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg p-4 border border-yellow-500/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-yellow-400/20 shrink-0">
                              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-yellow-200 text-sm sm:text-base truncate">{achievement.name}</h4>
                              <p className="text-sm text-gray-400">{achievement.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No achievements yet. Keep learning to unlock your first achievement!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}