import { Fish } from "lucide-react"

interface GuppyLogoProps {
  className?: string
}

export function GuppyLogo({ className }: GuppyLogoProps) {
  // Using Fish icon from lucide-react as a placeholder for the guppy mascot
  // In a real application, this would be replaced with a custom SVG or image
  return (
    <div className={`text-cyan-400 ${className}`}>
      <Fish />
    </div>
  )
}
