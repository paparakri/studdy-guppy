// components/modals/aquarium-modal.tsx - NEW FILE
"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Fish, Sparkles, Trophy, Clock, Star, Waves, Plus } from 'lucide-react'

interface Guppy {
  id: string;
  type: "common" | "rare" | "epic" | "legendary" | "shiny";
  x: number;
  y: number;
  direction: number;
  speed: number;
  color: string;
  size: number;
  earnedAt: string;
  earnedFromMinutes: number;
}

interface GuppyData {
  fish: Guppy[];
  totalStudyTime: number;
  totalGuppies: number;
  studyStreak: number;
  lastStudyDate: string;
}

const FISH_TYPES = {
  common: { color: "#60A5FA", rarity: "Common", description: "Earned every 15 minutes" },
  rare: { color: "#A855F7", rarity: "Rare", description: "Earned at milestones & streaks" },
  epic: { color: "#EF4444", rarity: "Epic", description: "Earned for dedicated study" },
  legendary: { color: "#F59E0B", rarity: "Legendary", description: "Earned for major achievements" },
  shiny: { color: "#10B981", rarity: "Shiny", description: "Ultra rare random reward" },
}

interface AquariumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AquariumModal({ isOpen, onClose }: AquariumModalProps) {
  const [guppyData, setGuppyData] = useState<GuppyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTestingTools, setShowTestingTools] = useState(false);
  const animationRef = useRef<number>();

  const userId = 'default-user'; // For hackathon

  useEffect(() => {
    if (isOpen) {
      loadGuppyData();
    }
  }, [isOpen]);

  // NEW: Also reload when guppy events are triggered
  useEffect(() => {
    const handleNewGuppies = (event: CustomEvent) => {
      console.log('New guppies earned event received in modal:', event.detail);
      loadGuppyData(); // Reload data to show new guppies
    };

    window.addEventListener('newGuppiesEarned', handleNewGuppies as EventListener);
    return () => {
      window.removeEventListener('newGuppiesEarned', handleNewGuppies as EventListener);
    };
  }, []);

  // Fish animation
  useEffect(() => {
    if (!guppyData?.fish.length) return;

    const animateFish = () => {
      setGuppyData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          fish: prev.fish.map(guppy => {
            let newX = guppy.x + Math.cos(guppy.direction) * guppy.speed;
            let newY = guppy.y + Math.sin(guppy.direction) * guppy.speed * 0.4;
            let newDirection = guppy.direction + (Math.random() - 0.5) * 0.05;

            // Bounce off walls
            if (newX > 85) {
              newDirection = Math.PI - guppy.direction + (Math.random() - 0.5) * 0.3;
              newX = 85;
            } else if (newX < 15) {
              newDirection = Math.PI - guppy.direction + (Math.random() - 0.5) * 0.3;
              newX = 15;
            }

            if (newY > 75) {
              newDirection = -guppy.direction + (Math.random() - 0.5) * 0.3;
              newY = 75;
            } else if (newY < 25) {
              newDirection = -guppy.direction + (Math.random() - 0.5) * 0.3;
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

  // Testing function to add guppies
  const addTestGuppies = async () => {
    try {
      const response = await fetch('/api/guppies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          studyMinutes: 30 // Simulate 30 minutes of study
        })
      });

      if (response.ok) {
        const data = await response.json();
        loadGuppyData();
        
        // Trigger new guppies event if guppies were earned
        if (data.newGuppies && data.newGuppies.length > 0) {
          window.dispatchEvent(new CustomEvent('newGuppiesEarned', { 
            detail: { 
              guppies: data.newGuppies, 
              studyMinutes: 30 
            } 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to add test guppies:', error);
    }
  };

  // NEW: Testing function to add specific study time
  const addTestStudyTime = async (minutes: number) => {
    try {
      const response = await fetch('/api/guppies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          studyMinutes: minutes
        })
      });

      if (response.ok) {
        const data = await response.json();
        loadGuppyData();
        
        // Trigger new guppies event if guppies were earned
        if (data.newGuppies && data.newGuppies.length > 0) {
          window.dispatchEvent(new CustomEvent('newGuppiesEarned', { 
            detail: { 
              guppies: data.newGuppies, 
              studyMinutes: minutes 
            } 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to add test study time:', error);
    }
  };

  function GuppyComponent({ guppy }: { guppy: Guppy }) {
    // Fix: Normalize direction and flip correctly so fish face the direction they're swimming
    const normalizedDirection = ((guppy.direction % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    const isFlipped = normalizedDirection < Math.PI / 2 || normalizedDirection > 3 * Math.PI / 2;

    return (
      <div
        className="absolute transition-all duration-100 ease-linear"
        style={{
          left: `${guppy.x}%`,
          top: `${guppy.y}%`,
          transform: `scale(${guppy.size}) ${isFlipped ? "scaleX(-1)" : ""}`,
        }}
      >
        <svg width="32" height="24" viewBox="0 0 32 24" className="drop-shadow-lg">
          <defs>
            <radialGradient id={`gradient-${guppy.id}`} cx="0.3" cy="0.3">
              <stop offset="0%" stopColor={guppy.color} stopOpacity="1" />
              <stop offset="70%" stopColor={guppy.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={guppy.color} stopOpacity="0.6" />
            </radialGradient>
          </defs>

          {/* Fish body */}
          <ellipse cx="16" cy="12" rx="12" ry="6" fill={`url(#gradient-${guppy.id})`} />
          <ellipse cx="14" cy="12" rx="9" ry="4.5" fill={guppy.color} opacity="0.9" />

          {/* Fish tail */}
          <path d="M28 12 L32 6 L32 18 Z" fill={guppy.color} opacity="0.7" />
          <path d="M28 12 L30 8 L30 16 Z" fill={guppy.color} opacity="0.9" />

          {/* Fish eye */}
          <circle cx="10" cy="9" r="2.5" fill="white" />
          <circle cx="10" cy="9" r="1.5" fill="black" />
          <circle cx="9.5" cy="8.5" r="0.5" fill="white" />

          {/* Fins */}
          <path d="M16 18 L22 21 L20 24 Z" fill={guppy.color} opacity="0.6" />
          <path d="M16 6 L22 3 L20 0 Z" fill={guppy.color} opacity="0.6" />
          <path d="M8 15 L12 18 L10 20 Z" fill={guppy.color} opacity="0.5" />

          {/* Special effects for rare fish */}
          {guppy.type === "shiny" && (
            <>
              <circle cx="8" cy="6" r="1" fill="#FFD700" opacity="0.8" className="animate-pulse" />
              <circle cx="20" cy="15" r="1" fill="#FFD700" opacity="0.8" className="animate-pulse" />
            </>
          )}
          {guppy.type === "legendary" && (
            <circle
              cx="16"
              cy="12"
              r="8"
              fill="none"
              stroke="#FFD700"
              strokeWidth="1"
              opacity="0.6"
              className="animate-ping"
            />
          )}
        </svg>

        {guppy.type === "shiny" && (
          <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-yellow-300 animate-spin" />
        )}
      </div>
    );
  }

  const fishCounts = guppyData?.fish.reduce(
    (acc, guppy) => {
      acc[guppy.type] = (acc[guppy.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  ) || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-modern-xl">
        <DialogHeader className="pb-4 border-b border-white/10">
          <DialogTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Fish className="h-6 w-6" />
            My Study Aquarium
          </DialogTitle>
          <p className="text-sm text-gray-400">
            Guppies earned through dedicated study time
          </p>
        </DialogHeader>

        <Tabs defaultValue="aquarium" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="aquarium">Aquarium</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="aquarium" className="space-y-4">
            {/* Main Aquarium */}
            <div className="relative bg-gradient-to-b from-blue-500 to-blue-700 border border-blue-400 overflow-hidden h-96 rounded-xl">
              {/* Water background */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-800 to-blue-400 opacity-80">
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-r from-blue-600 to-blue-500 opacity-50 animate-pulse" />
              </div>

              {/* Fish container */}
              <div className="absolute inset-0">
                {guppyData?.fish.map((guppy) => (
                  <GuppyComponent key={guppy.id} guppy={guppy} />
                ))}
              </div>

              {/* Empty state */}
              {(!guppyData?.fish.length) && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center text-white/80">
                    <Fish className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Your aquarium is empty</h3>
                    <p className="text-sm">Start studying to earn your first guppy!</p>
                  </div>
                </div>
              )}

              {/* Aquarium info */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg z-10">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {guppyData?.totalGuppies || 0} guppies
                  </span>
                </div>
              </div>

              {/* Debug info for testing */}
              {guppyData?.fish && guppyData.fish.length > 0 && (
                <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs z-10">
                  {guppyData.fish.length} fish loaded
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="collection" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(FISH_TYPES).map(([type, config]) => (
                <div key={type} className="bg-gray-800/30 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full" 
                        style={{ backgroundColor: config.color }}
                      />
                      <div>
                        <h4 className="font-medium text-white">{config.rarity}</h4>
                        <p className="text-xs text-gray-400">{config.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-white border-gray-600">
                      {fishCounts[type] || 0}
                    </Badge>
                  </div>
                  
                  {type === "shiny" && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3 h-3" />
                      <span className="text-xs">Ultra Rare</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-800/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {guppyData?.totalGuppies || 0}
                </div>
                <div className="text-sm text-gray-400">Total Guppies</div>
              </div>
              
              <div className="bg-gray-800/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-teal-400">
                  {Math.floor((guppyData?.totalStudyTime || 0) / 60)}h {(guppyData?.totalStudyTime || 0) % 60}m
                </div>
                <div className="text-sm text-gray-400">Total Study Time</div>
              </div>
              
              <div className="bg-gray-800/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {guppyData?.studyStreak || 0}
                </div>
                <div className="text-sm text-gray-400">Study Streak</div>
              </div>
              
              <div className="bg-gray-800/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {fishCounts['legendary'] || 0}
                </div>
                <div className="text-sm text-gray-400">Legendary Fish</div>
              </div>
            </div>

            {/* Recent guppies */}
            {guppyData?.fish && guppyData.fish.length > 0 && (
              <div className="bg-gray-800/30 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Guppies
                </h4>
                <div className="space-y-2">
                  {guppyData.fish
                    .slice()
                    .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                    .slice(0, 5)
                    .map((guppy) => (
                      <div key={guppy.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: guppy.color }}
                          />
                          <span className="text-gray-300">
                            {FISH_TYPES[guppy.type].rarity} Guppy
                          </span>
                        </div>
                        <div className="text-gray-400">
                          {new Date(guppy.earnedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Testing Tools */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestingTools(!showTestingTools)}
              className="border-white/20 text-gray-300"
            >
              Testing Tools
            </Button>
            
            {showTestingTools && (
              <div className="flex gap-2">
                <Button
                  onClick={addTestGuppies}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  +30min Study
                </Button>
                <Button
                  onClick={() => addTestStudyTime(5)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  +5min Quick
                </Button>
                <Button
                  onClick={() => addTestStudyTime(60)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  +60min Epic
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}