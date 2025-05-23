"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles } from "lucide-react"

interface ChatPanelProps {
  className?: string
}

// Mock chat messages for demonstration
const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hello! I'm Study Guppy, your AI study assistant. I've analyzed your uploaded materials. What would you like to do today?",
  },
  { id: 2, role: "user", content: "Can you summarize the key concepts from the Machine Learning Basics PDF?" },
  {
    id: 3,
    role: "assistant",
    content:
      "Based on the Machine Learning Basics PDF, here are the key concepts:\n\n1. **Supervised Learning** - Training models with labeled data\n2. **Unsupervised Learning** - Finding patterns in unlabeled data\n3. **Reinforcement Learning** - Learning through trial and error with rewards\n4. **Neural Networks** - Computational models inspired by the human brain\n\nWould you like me to elaborate on any of these concepts?",
  },
]

export function ChatPanel({ className }: ChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Send a new message
  const sendMessage = () => {
    if (input.trim() === "") return

    // Add user message
    const newMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
    }

    setMessages([...messages, newMessage])
    setInput("")

    // Simulate AI response (in a real app, this would call an API)
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        role: "assistant",
        content:
          "I'm processing your request about \"" +
          input +
          '". In a real application, I would provide a meaningful response based on your study materials.',
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat with Study Guppy</h2>
          <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
            <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-100"
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.role === "assistant" ? (
                    <Bot className="h-4 w-4 mr-2 text-cyan-400" />
                  ) : (
                    <User className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-xs font-medium">{message.role === "assistant" ? "Study Guppy" : "You"}</span>
                </div>
                <div className="whitespace-pre-line text-sm">{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <Input
            placeholder="Ask a question about your study materials..."
            className="flex-1 bg-gray-900 border-gray-700"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button className="ml-2 bg-cyan-600 hover:bg-cyan-700" onClick={sendMessage} disabled={input.trim() === ""}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
