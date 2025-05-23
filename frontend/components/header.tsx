import { GuppyLogo } from "@/components/guppy-logo"
import { Button } from "@/components/ui/button"
import { Settings, HelpCircle, Crown } from 'lucide-react'

export function Header() {
  return (
    <header className="relative">
      {/* Background with gradient and glass effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-md border-b border-white/10"></div>
      
      <div className="relative flex items-center justify-between px-8 py-4">
        {/* Logo and brand section with enhanced styling */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <GuppyLogo className="h-10 w-10 drop-shadow-lg" />
            {/* Subtle glow effect around logo */}
            <div className="absolute inset-0 h-10 w-10 bg-cyan-400/20 rounded-full blur-md -z-10"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold gradient-text tracking-tight">
              Study Guppy
            </h1>
            <p className="text-xs text-gray-400 font-medium">Smart Study Assistant</p>
          </div>
        </div>

        {/* Navigation and action buttons with modern styling */}
        <div className="flex items-center gap-3">
          {/* Settings button with modern hover effect */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="btn-modern text-gray-300 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2 transition-all duration-300"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          {/* Help button with modern hover effect */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="btn-modern text-gray-300 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2 transition-all duration-300"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>

          {/* Premium upgrade button with gradient and modern effects */}
          <Button className="btn-modern bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-2 rounded-xl shadow-modern font-medium transition-all duration-300 hover:shadow-modern-lg">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Pro
          </Button>
        </div>
      </div>
    </header>
  )
}
