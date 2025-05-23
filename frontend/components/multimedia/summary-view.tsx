import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function SummaryView() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Machine Learning Basics</h3>
          <p className="text-sm text-gray-300 mb-4">
            This summary highlights the key concepts from your Machine Learning Basics PDF.
          </p>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Badge className="mr-2 bg-cyan-600 hover:bg-cyan-600">Chapter 1</Badge>
                Introduction to Machine Learning
              </h4>
              <p className="text-sm text-gray-300">
                Machine learning is a subset of artificial intelligence that focuses on developing systems that can
                learn from and make decisions based on data.
                <span className="bg-cyan-900/30 text-cyan-300 px-1 rounded">Unlike traditional programming</span>,
                machine learning algorithms can adapt and improve their performance over time without explicit
                programming.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Badge className="mr-2 bg-teal-600 hover:bg-teal-600">Chapter 2</Badge>
                Types of Machine Learning
              </h4>
              <p className="text-sm text-gray-300">There are three main types of machine learning:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 mt-2 space-y-1">
                <li>
                  <span className="bg-teal-900/30 text-teal-300 px-1 rounded">Supervised Learning</span>: Training with
                  labeled data to make predictions
                </li>
                <li>
                  <span className="bg-teal-900/30 text-teal-300 px-1 rounded">Unsupervised Learning</span>: Finding
                  patterns in unlabeled data
                </li>
                <li>
                  <span className="bg-teal-900/30 text-teal-300 px-1 rounded">Reinforcement Learning</span>: Learning
                  through trial and error with rewards
                </li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Badge className="mr-2 bg-cyan-600 hover:bg-cyan-600">Chapter 3</Badge>
                Neural Networks
              </h4>
              <p className="text-sm text-gray-300">
                Neural networks are computational models inspired by the human brain. They consist of layers of
                interconnected nodes or "neurons" that process information.
                <span className="bg-cyan-900/30 text-cyan-300 px-1 rounded">Deep learning</span>
                is a subset of machine learning that uses neural networks with many layers (deep neural networks).
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
