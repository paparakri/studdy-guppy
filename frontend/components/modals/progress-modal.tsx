import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart, LineChart, PieChart } from "lucide-react"

interface ProgressModalProps {
  onClose: () => void
}

export function ProgressModal({ onClose }: ProgressModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Learning Progress</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="chapters" className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              By Chapter
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <LineChart className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Overall Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Machine Learning Basics</span>
                        <span className="text-sm text-gray-400">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Data Structures</span>
                        <span className="text-sm text-gray-400">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Physics</span>
                        <span className="text-sm text-gray-400">20%</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Learning Activities</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-3xl font-bold text-cyan-400 mb-1">12</div>
                      <div className="text-sm text-gray-400">Quizzes Completed</div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-3xl font-bold text-teal-400 mb-1">87</div>
                      <div className="text-sm text-gray-400">Flashcards Reviewed</div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-3xl font-bold text-cyan-400 mb-1">5</div>
                      <div className="text-sm text-gray-400">Hours Studied</div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-3xl font-bold text-teal-400 mb-1">3</div>
                      <div className="text-sm text-gray-400">Days Streak</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Areas to Improve</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-800 rounded-lg p-3 border-l-4 border-amber-500">
                      <div className="text-sm font-medium">Neural Networks</div>
                      <div className="text-xs text-gray-400">Accuracy: 45% in quizzes</div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-3 border-l-4 border-amber-500">
                      <div className="text-sm font-medium">Binary Trees</div>
                      <div className="text-xs text-gray-400">Accuracy: 38% in quizzes</div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-3 border-l-4 border-red-500">
                      <div className="text-sm font-medium">Quantum Mechanics</div>
                      <div className="text-xs text-gray-400">Accuracy: 25% in quizzes</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chapters" className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Machine Learning Basics</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Chapter 1: Introduction</span>
                        <span className="text-sm text-gray-400">100%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Chapter 2: Types of ML</span>
                        <span className="text-sm text-gray-400">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Chapter 3: Neural Networks</span>
                        <span className="text-sm text-gray-400">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Chapter 4: Applications</span>
                        <span className="text-sm text-gray-400">0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Data Structures</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Chapter 1: Arrays & Lists</span>
                        <span className="text-sm text-gray-400">90%</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Chapter 2: Stacks & Queues</span>
                        <span className="text-sm text-gray-400">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Chapter 3: Trees</span>
                        <span className="text-sm text-gray-400">30%</span>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Chapter 4: Graphs</span>
                        <span className="text-sm text-gray-400">0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Machine Learning Quiz</h4>
                      <p className="text-sm text-gray-400">Score: 8/10</p>
                    </div>
                    <div className="text-sm text-gray-400">Today, 2:30 PM</div>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Flashcard Session</h4>
                      <p className="text-sm text-gray-400">Completed: 25 cards</p>
                    </div>
                    <div className="text-sm text-gray-400">Today, 11:15 AM</div>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Data Structures Quiz</h4>
                      <p className="text-sm text-gray-400">Score: 6/10</p>
                    </div>
                    <div className="text-sm text-gray-400">Yesterday, 4:45 PM</div>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Physics Quiz</h4>
                      <p className="text-sm text-gray-400">Score: 5/10</p>
                    </div>
                    <div className="text-sm text-gray-400">2 days ago, 10:20 AM</div>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Flashcard Session</h4>
                      <p className="text-sm text-gray-400">Completed: 32 cards</p>
                    </div>
                    <div className="text-sm text-gray-400">3 days ago, 3:10 PM</div>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
