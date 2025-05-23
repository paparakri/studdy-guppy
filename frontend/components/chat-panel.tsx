"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react'

interface ChatPanelProps {
  className?: string
}

// Enhanced mock chat messages with better structure and metadata
const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm Study Guppy, your AI study assistant. I've analyzed your uploaded materials and I'm ready to help you learn more effectively. What would you like to explore today?",
    timestamp: "10:30 AM"
  },
  { 
    id: 2, 
    role: "user", 
    content: "Can you summarize the key concepts from the Machine Learning Basics PDF?",
    timestamp: "10:32 AM"
  },
  {
    id: 3,
    role: "assistant",
    content: "Based on the Machine Learning Basics PDF, here are the key concepts:\n\n**1. Supervised Learning** - Training models with labeled data to make predictions\n**2. Unsupervised Learning** - Finding hidden patterns in unlabeled data\n**3. Reinforcement Learning** - Learning through trial and error with rewards\n**4. Neural Networks** - Computational models inspired by the human brain\n\nWould you like me to elaborate on any of these concepts or create flashcards for better retention?",
    timestamp: "10:33 AM"
  },
]

export function ChatPanel({ className }: ChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Enhanced auto-scroll with smooth animation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  // Enhanced message sending with typing indicator
  const sendMessage = () => {

    // TODO: Replace existing mock logic with:
    // const response = await fetch('/api/chat', { ... });

    if (input.trim() === "") return

    // Add user message with timestamp
    const newMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages([...messages, newMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response with realistic typing delay
    setTimeout(() => {
      setIsTyping(false)
      const aiResponse = {
        id: messages.length + 2,
        role: "assistant",
        content: `I understand you're asking about "${input}". In a real application, I would analyze your study materials and provide a comprehensive, personalized response to help you learn more effectively.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1500)
  }

  // Handle Enter key press for better UX
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={`flex flex-col ${className} overflow-hidden`}>
      {/* Enhanced header with modern styling and better visual hierarchy */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-modern">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 pulse-modern"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">Chat with Study Guppy</h2>
              <p className="text-sm text-gray-400">AI-powered study assistant</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="btn-modern border-white/20 hover:bg-white/10 rounded-xl px-4 py-2 transition-all duration-300"
          >
            <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Enhanced chat messages area with better spacing and modern design */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                {/* Message bubble with enhanced styling */}
                <div
                  className={`rounded-2xl p-4 shadow-modern transition-all duration-300 hover:shadow-modern-lg ${
                    message.role === "user" 
                      ? "bg-gradient-to-br from-cyan-600 to-teal-600 text-white ml-4" 
                      : "bg-gray-800/70 backdrop-blur-sm text-gray-100 border border-white/10 mr-4"
                  }`}
                >
                  {/* Message header with avatar and role */}
                  <div className="flex items-center mb-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 ${
                      message.role === "assistant" ? "bg-cyan-500/20" : "bg-white/20"
                    }`}>
                      {message.role === "assistant" ? (
                        <Bot className="h-3 w-3 text-cyan-400" />
                      ) : (
                        <User className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-xs font-medium opacity-90">
                      {message.role === "assistant" ? "Study Guppy" : "You"}
                    </span>
                    <span className="text-xs opacity-60 ml-auto">{message.timestamp}</span>
                  </div>
                  
                  {/* Message content with enhanced typography */}
                  <div className="whitespace-pre-line text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator with modern animation */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] mr-4">
                <div className="bg-gray-800/70 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-modern">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 bg-cyan-500/20">
                      <Bot className="h-3 w-3 text-cyan-400" />
                    </div>
                    <span className="text-xs font-medium opacity-90">Study Guppy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-xs text-gray-400 ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Enhanced input area with modern styling and better UX */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Ask a question about your study materials..."
              className="pr-12 py-4 bg-gray-800/50 border-white/10 rounded-xl focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isTyping}
            />
            {/* Character count or input status */}
            <div className="absolute bottom-2 right-12 text-xs text-gray-500">
              {input.length > 0 && `${input.length} chars`}
            </div>
          </div>
          
          <Button 
            className="btn-modern bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl px-6 py-4 shadow-modern transition-all duration-300 hover:shadow-modern-lg disabled:opacity-50" 
            onClick={sendMessage} 
            disabled={input.trim() === "" || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick action suggestions */}
        <div className="flex gap-2 mt-3">
          <button 
            className="text-xs bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg transition-all duration-300"
            onClick={() => setInput("Create a quiz from my materials")}
          >
            Create Quiz
          </button>
          <button 
            className="text-xs bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg transition-all duration-300"
            onClick={() => setInput("Summarize key concepts")}
          >
            Summarize
          </button>
          <button 
            className="text-xs bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg transition-all duration-300"
            onClick={() => setInput("Generate flashcards")}
          >
            Flashcards
          </button>
        </div>
      </div>
    </div>
  )
}
