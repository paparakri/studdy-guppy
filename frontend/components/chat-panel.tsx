"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react'

interface ChatPanelProps {
  className?: string
  selectedDocuments: string[]
}

interface Message {
  id: number;
  role: string;
  content: string;
  timestamp: string;
}

// Enhanced mock chat messages with better structure and metadata
const initialMessages:Message[] = []

export function ChatPanel({ className, selectedDocuments }: ChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Enhanced auto-scroll with smooth animation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  // Enhanced message sending with typing indicator
  const sendMessage = async () => {
    if (input.trim() === "") return

    // Add user message to UI
    const newMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages([...messages, newMessage])
    const userInput = input
    setInput("")
    setIsTyping(true)

    try {
      // Send message with selected documents
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          documentIds: selectedDocuments // Send all selected document IDs
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Add AI response to UI
        const aiResponse = {
          id: messages.length + 2,
          role: "assistant",
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setMessages(prev => [...prev, aiResponse])
      } else {
        console.error('Chat error:', data.error)
        // Add error message to UI
        const errorMessage = {
          id: messages.length + 2,
          role: "assistant", 
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat network error:', error)
      // Handle network error
    } finally {
      setIsTyping(false)
    }
  }

  // Handle Enter key press for better UX
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getDocumentContextIndicator = () => {
    if (!selectedDocuments || selectedDocuments.length === 0) {
      return (
        <div className="text-xs text-gray-500 mb-2 px-3">
          💡 Select documents in the left panel to chat about them
        </div>
      )
    }
    
    return (
      <div className="text-xs text-cyan-400 mb-2 px-3">
        📚 Chatting about {selectedDocuments.length} selected document{selectedDocuments.length > 1 ? 's' : ''}
      </div>
    )
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
        {getDocumentContextIndicator()}
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
      </div>
    </div>
  )
}
