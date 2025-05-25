// components/aquarium/aquarium-widget.tsx - NEW FILE
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Fish, Sparkles } from 'lucide-react'

interface Guppy {
  id: string;
  type: "common" | "rare" | "epic" | "legendary" | "shiny";
  x: number;
  y: number;
  direction: number;
  speed: number;
  color: string;
  size: number;
}

interface GuppyData {
  fish: Guppy[];
  totalStudyTime: number;
  totalGuppies: number;
}

interface AquariumWidgetProps {
  onOpenModal: () => void;
}

export function AquariumWidget({ onOpenModal }: AquariumWidgetProps) {
  const [guppyData, setGuppyData] = useState<GuppyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newGuppyAlert, setNewGuppyAlert] = useState<Guppy | null>(null);
  const animationRef = useRef<number>();
  const widgetRef = useRef<HTMLDivElement>(null);

  const userId = 'default-user'; // For hackathon

  // Load guppy data on mount
  useEffect(() => {
    loadGuppyData();
  }, []);

  // Listen for new guppies earned
  useEffect(() => {
    const handleNewGuppies = (event: CustomEvent) => {
      const { guppies } = event.detail;
      if (guppies && guppies.length > 0) {
        setNewGuppyAlert(guppies[0]); // Show alert for first new guppy
        setTimeout(() => setNewGuppyAlert(null), 3000);
        loadGuppyData(); // Reload data to show new guppies
      }
    };

    window.addEventListener('newGuppiesEarned', handleNewGuppies as EventListener);
    return () => {
      window.removeEventListener('newGuppiesEarned', handleNewGuppies as EventListener);
    };
  }, []);

  // Animate fish
  useEffect(() => {
    if (!guppyData?.fish.length) return;

    const animateFish = () => {
      setGuppyData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          fish: prev.fish.map(guppy => {
            let newX = guppy.x + Math.cos(guppy.direction) * guppy.speed * 0.3;
            let newY = guppy.y + Math.sin(guppy.direction) * guppy.speed * 0.2;
            let newDirection = guppy.direction + (Math.random() - 0.5) * 0.1;

            // Bounce off walls (widget boundaries)
            if (newX > 85) {
              newDirection = Math.PI - guppy.direction;
              newX = 85;
            } else if (newX < 15) {
              newDirection = Math.PI - guppy.direction;
              newX = 15;
            }

            if (newY > 75) {
              newDirection = -guppy.direction;
              newY = 75;
            } else if (newY < 25) {
              newDirection = -guppy.direction;
              newY = 25;
            }

            return {
              ...guppy,
              x: newX,
              y: newY,
              direction: newDirection,
            };
          })
        };
      });
      
      animationRef.current = requestAnimationFrame(animateFish);
    };

    animationRef.current = requestAnimationFrame(animateFish);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [guppyData?.fish.length]);

  const loadGuppyData = async () => {
    try {
      const response = await fetch(`/api/guppies?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setGuppyData(data.data);
      }
    } catch (error) {
      console.error('Failed to load guppy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple fish component for the widget
  function MiniGuppy({ guppy }: { guppy: Guppy }) {
    const isFlipped = guppy.direction > Math.PI / 2 && guppy.direction < (3 * Math.PI) / 2;

    return (
      <div
        className="absolute transition-all duration-75 ease-linear"
        style={{
          left: `${guppy.x}%`,
          top: `${guppy.y}%`,
          transform: `scale(${guppy.size * 0.4}) ${isFlipped ? "scaleX(-1)" : ""}`,
        }}
      >
        <div 
          className="w-3 h-2 rounded-full opacity-80"
          style={{ backgroundColor: guppy.color }}
        />
        {guppy.type === "shiny" && (
          <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-yellow-300 animate-spin" />
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative bg-gradient-to-b from-blue-500/30 to-blue-700/30 rounded-xl p-3 border border-blue-400/20 h-20">
        <div className="flex items-center justify-center h-full">
          <Fish className="h-4 w-4 text-blue-300 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={widgetRef}>
      {/* New Guppy Alert */}
      {newGuppyAlert && (
        <div className="absolute -top-8 left-0 right-0 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs px-2 py-1 rounded-lg animate-bounce shadow-lg z-10">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>New {newGuppyAlert.type} guppy!</span>
          </div>
        </div>
      )}

      {/* Mini Aquarium */}
      <Button
        onClick={onOpenModal}
        className="relative w-full bg-gradient-to-b from-blue-500/40 to-blue-700/40 hover:from-blue-500/50 hover:to-blue-700/50 border border-blue-400/30 rounded-xl p-0 h-20 overflow-hidden transition-all duration-300 group"
        variant="ghost"
      >
        {/* Water effect background */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-800/40 to-blue-400/20">
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600/30 to-blue-500/30 animate-pulse" />
        </div>

        {/* Fish swimming */}
        <div className="absolute inset-0">
          {guppyData?.fish.slice(0, 8).map((guppy) => (
            <MiniGuppy key={guppy.id} guppy={guppy} />
          ))}
        </div>

        {/* Info overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white/90 group-hover:text-white transition-colors">
          <div className="flex items-center gap-1 mb-1">
            <Fish className="h-3 w-3" />
            <span className="text-xs font-medium">
              {guppyData?.totalGuppies || 0} guppies
            </span>
          </div>
          <div className="text-xs opacity-75">
            {Math.floor((guppyData?.totalStudyTime || 0) / 60)}h {(guppyData?.totalStudyTime || 0) % 60}m studied
          </div>
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>
    </div>
  );
}