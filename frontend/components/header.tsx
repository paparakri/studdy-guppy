import { GuppyLogo } from "@/components/guppy-logo"

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900">
      <div className="flex items-center gap-2">
        <GuppyLogo className="h-8 w-8" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
          Study Guppy
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm text-gray-400 hover:text-white transition-colors">Settings</button>
        <button className="text-sm text-gray-400 hover:text-white transition-colors">Help</button>
        <button className="text-sm bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1 rounded-md hover:opacity-90 transition-opacity">
          Upgrade
        </button>
      </div>
    </header>
  )
}
