import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Target, Lightbulb } from 'lucide-react'

interface SummaryViewProps {
  selectedDocuments: string[]
}

export function SummaryView({ selectedDocuments }: SummaryViewProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Enhanced header section with modern styling */}
        <div className="card-modern bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-modern">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-cyan-400/20">
                <BookOpen className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold gradient-text">Machine Learning Basics</h3>
                <p className="text-sm text-gray-400 mt-1">AI-generated summary from your PDF</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10 rounded-xl">
              Export
            </Button>
          </div>
          
          {/* Study metrics with modern design */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">3</div>
              <div className="text-xs text-gray-400">Chapters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-400">15</div>
              <div className="text-xs text-gray-400">Key Concepts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">~20</div>
              <div className="text-xs text-gray-400">Min Read</div>
            </div>
          </div>
        </div>

        {/* Enhanced chapter summaries with modern card design */}
        <div className="space-y-4">
          {/* Chapter 1 */}
          <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-modern hover:shadow-modern-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white border-0 px-3 py-1 rounded-xl">
                  Chapter 1
                </Badge>
                <h4 className="font-bold text-lg text-gray-100">Introduction to Machine Learning</h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                5 min read
              </div>
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Machine learning is a subset of artificial intelligence that focuses on developing systems that can
              learn from and make decisions based on data.
              <span className="bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 text-cyan-200 px-2 py-0.5 rounded-lg mx-1 border border-cyan-700/30">
                Unlike traditional programming
              </span>
              machine learning algorithms can adapt and improve their performance over time without explicit
              programming.
            </p>

            {/* Key takeaways section */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Key Takeaway</span>
              </div>
              <p className="text-xs text-gray-300">
                ML systems learn patterns from data rather than following pre-programmed instructions.
              </p>
            </div>
          </div>

          {/* Chapter 2 */}
          <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-modern hover:shadow-modern-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white border-0 px-3 py-1 rounded-xl">
                  Chapter 2
                </Badge>
                <h4 className="font-bold text-lg text-gray-100">Types of Machine Learning</h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                8 min read
              </div>
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              There are three main types of machine learning, each suited for different types of problems:
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="bg-gradient-to-r from-teal-900/40 to-teal-800/40 text-teal-200 px-2 py-0.5 rounded-lg border border-teal-700/30 text-sm font-medium">
                    Supervised Learning
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Training with labeled data to make predictions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="bg-gradient-to-r from-teal-900/40 to-teal-800/40 text-teal-200 px-2 py-0.5 rounded-lg border border-teal-700/30 text-sm font-medium">
                    Unsupervised Learning
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Finding patterns in unlabeled data</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="bg-gradient-to-r from-teal-900/40 to-teal-800/40 text-teal-200 px-2 py-0.5 rounded-lg border border-teal-700/30 text-sm font-medium">
                    Reinforcement Learning
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Learning through trial and error with rewards</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Study Tip</span>
              </div>
              <p className="text-xs text-gray-300">
                Remember: Supervised = with labels, Unsupervised = without labels, Reinforcement = with rewards.
              </p>
            </div>
          </div>

          {/* Chapter 3 */}
          <div className="card-modern bg-gray-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-modern hover:shadow-modern-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white border-0 px-3 py-1 rounded-xl">
                  Chapter 3
                </Badge>
                <h4 className="font-bold text-lg text-gray-100">Neural Networks</h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                7 min read
              </div>
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Neural networks are computational models inspired by the human brain. They consist of layers of
              interconnected nodes or "neurons" that process information.
              <span className="bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 text-cyan-200 px-2 py-0.5 rounded-lg mx-1 border border-cyan-700/30">
                Deep learning
              </span>
              is a subset of machine learning that uses neural networks with many layers (deep neural networks).
            </p>

            <div className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Key Insight</span>
              </div>
              <p className="text-xs text-gray-300">
                Neural networks excel at pattern recognition and can learn complex relationships in data.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons with modern styling */}
        <div className="flex gap-3 pt-4">
          <Button className="flex-1 btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl py-3 shadow-modern transition-all duration-300">
            Generate Flashcards
          </Button>
          <Button variant="outline" className="flex-1 btn-modern border-white/20 hover:bg-white/10 rounded-xl py-3 transition-all duration-300">
            Create Quiz
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
