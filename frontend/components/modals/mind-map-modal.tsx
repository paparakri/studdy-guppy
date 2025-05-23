"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Download, Share2 } from "lucide-react"
import { useState } from "react"

interface MindMapModalProps {
  onClose: () => void
}

export function MindMapModal({ onClose }: MindMapModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1)

  // Increase zoom level
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2))
  }

  // Decrease zoom level
  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Mind Map: Machine Learning Concepts</DialogTitle>
        </DialogHeader>

        <div className="relative h-[70vh] bg-gray-900 rounded-md overflow-hidden">
          {/* Mind map visualization */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease-out" }}
          >
            {/* This is a simplified representation of a mind map */}
            <div className="relative">
              {/* Central node */}
              <div className="absolute left-0 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg z-10">
                Machine Learning
              </div>

              {/* Branch 1 */}
              <div className="absolute left-[100px] top-[-50px] transform -translate-y-1/2 bg-teal-600 text-white px-3 py-1 rounded-lg shadow-md">
                Supervised Learning
              </div>
              <div className="absolute left-[50px] top-[-50px] w-[50px] h-[1px] bg-teal-600"></div>

              {/* Branch 1 children */}
              <div className="absolute left-[180px] top-[-80px] transform -translate-y-1/2 bg-teal-700 text-white px-2 py-1 rounded-md shadow-sm text-sm">
                Classification
              </div>
              <div className="absolute left-[140px] top-[-65px] w-[40px] h-[1px] bg-teal-700"></div>

              <div className="absolute left-[180px] top-[-20px] transform -translate-y-1/2 bg-teal-700 text-white px-2 py-1 rounded-md shadow-sm text-sm">
                Regression
              </div>
              <div className="absolute left-[140px] top-[-35px] w-[40px] h-[1px] bg-teal-700"></div>

              {/* Branch 2 */}
              <div className="absolute left-[100px] top-[50px] transform -translate-y-1/2 bg-cyan-600 text-white px-3 py-1 rounded-lg shadow-md">
                Unsupervised Learning
              </div>
              <div className="absolute left-[50px] top-[50px] w-[50px] h-[1px] bg-cyan-600"></div>

              {/* Branch 2 children */}
              <div className="absolute left-[180px] top-[20px] transform -translate-y-1/2 bg-cyan-700 text-white px-2 py-1 rounded-md shadow-sm text-sm">
                Clustering
              </div>
              <div className="absolute left-[140px] top-[35px] w-[40px] h-[1px] bg-cyan-700"></div>

              <div className="absolute left-[180px] top-[80px] transform -translate-y-1/2 bg-cyan-700 text-white px-2 py-1 rounded-md shadow-sm text-sm">
                Dimensionality Reduction
              </div>
              <div className="absolute left-[140px] top-[65px] w-[40px] h-[1px] bg-cyan-700"></div>

              {/* Branch 3 */}
              <div className="absolute left-[-100px] top-[50px] transform -translate-y-1/2 bg-teal-600 text-white px-3 py-1 rounded-lg shadow-md">
                Reinforcement Learning
              </div>
              <div className="absolute left-[-50px] top-[50px] w-[50px] h-[1px] bg-teal-600"></div>

              {/* Branch 4 */}
              <div className="absolute left-[-100px] top-[-50px] transform -translate-y-1/2 bg-cyan-600 text-white px-3 py-1 rounded-lg shadow-md">
                Neural Networks
              </div>
              <div className="absolute left-[-50px] top-[-50px] w-[50px] h-[1px] bg-cyan-600"></div>

              {/* Branch 4 children */}
              <div className="absolute left-[-180px] top-[-80px] transform -translate-y-1/2 bg-cyan-700 text-white px-2 py-1 rounded-md shadow-sm text-sm">
                Deep Learning
              </div>
              <div className="absolute left-[-140px] top-[-65px] w-[40px] h-[1px] bg-cyan-700"></div>

              <div className="absolute left-[-180px] top-[-20px] transform -translate-y-1/2 bg-cyan-700 text-white px-2 py-1 rounded-md shadow-sm text-sm">
                CNNs
              </div>
              <div className="absolute left-[-140px] top-[-35px] w-[40px] h-[1px] bg-cyan-700"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} disabled={zoomLevel <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={zoomIn} disabled={zoomLevel >= 2}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
