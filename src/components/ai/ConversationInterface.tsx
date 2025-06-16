'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/ButtonComponent'
import { useToast } from '@/hooks/use-toast'
import { Send, Bot, User, Loader2, Sparkles, TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  phase?: string
  step?: number
}

interface ConversationState {
  sessionId: string | null
  phase: string
  step: number
  isComplete: boolean
  quote: any | null
}

interface ConversationInterfaceProps {
  onQuoteGenerated?: (quote: any) => void
  onPhaseChange?: (phase: string, step: number) => void
}

export function ConversationInterface({ 
  onQuoteGenerated, 
  onPhaseChange 
}: ConversationInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [conversationState, setConversationState] = useState<ConversationState>({
    sessionId: null,
    phase: 'discovery',
    step: 1,
    isComplete: false,
    quote: null
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Phase information
  const phaseInfo = {
    discovery: {
      title: 'Business Discovery',
      description: 'Understanding your business needs',
      icon: '🔍',
      color: 'from-blue-500 to-cyan-500'
    },
    role_specification: {
      title: 'Role Specification',
      description: 'Defining the perfect role',
      icon: '🎯',
      color: 'from-purple-500 to-pink-500'
    },
    qualification: {
      title: 'Qualification',
      description: 'Gathering requirements',
      icon: '📋',
      color: 'from-green-500 to-emerald-500'
    },
    quote_generation: {
      title: 'Quote Generation',
      description: 'Creating your personalized quote',
      icon: '💰',
      color: 'from-orange-500 to-red-500'
    }
  }

  // Initialize conversation
  useEffect(() => {
    initializeConversation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading])

  const initializeConversation = async () => {
    try {
      setIsInitializing(true)
      
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to start conversation')
      }

      const data = await response.json()
      
      if (data.success) {
        setConversationState(prev => ({
          ...prev,
          sessionId: data.sessionId,
          phase: data.phase,
          step: data.step
        }))

        // Add welcome message
        const welcomeMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `👋 Hi there! I'm your AI assistant, and I'm here to help you find the perfect offshore team member for your business.

I'll ask you a few questions to understand your specific needs, and then I'll create a personalized quote and implementation plan just for you.

This usually takes about 5-10 minutes, and by the end, you'll have:
✅ A detailed quote with transparent pricing
✅ Specific role recommendations
✅ A clear implementation timeline
✅ Next steps to get started

Let's begin! Tell me about your business - what industry are you in and what does your company do?`,
          timestamp: new Date(),
          phase: 'discovery',
          step: 1
        }

        setMessages([welcomeMessage])
        
        // Track conversation start
        trackEvent('conversation_started', {
          sessionId: data.sessionId,
          phase: 'discovery',
          step: 1
        })
      } else {
        throw new Error(data.message || 'Failed to start conversation')
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error)
      toast({
        title: 'Connection Error',
        description: 'Failed to start the conversation. Please refresh the page and try again.',
        variant: 'destructive'
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationState.sessionId || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      phase: conversationState.phase,
      step: conversationState.step
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Track message sent
    trackEvent('message_sent', {
      sessionId: conversationState.sessionId,
      phase: conversationState.phase,
      step: conversationState.step,
      messageLength: userMessage.content.length
    })

    try {
      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: conversationState.sessionId,
          message: userMessage.content,
          metadata: {
            timestamp: userMessage.timestamp.toISOString(),
            userAgent: navigator.userAgent
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      if (data.success) {
        // Add AI response
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          phase: data.phase,
          step: data.step
        }

        setMessages(prev => [...prev, aiMessage])

        // Update conversation state
        setConversationState(prev => ({
          ...prev,
          phase: data.phase,
          step: data.step,
          isComplete: data.isComplete,
          quote: data.quote
        }))

        // Handle phase change
        if (onPhaseChange && (data.phase !== conversationState.phase || data.step !== conversationState.step)) {
          onPhaseChange(data.phase, data.step)
        }

        // Handle quote generation
        if (data.quote && onQuoteGenerated) {
          onQuoteGenerated(data.quote)
          
          toast({
            title: 'Quote Generated! 🎉',
            description: 'Your personalized offshore staffing quote is ready.',
            variant: 'default'
          })
        }

        // Track message received
        trackEvent('message_received', {
          sessionId: conversationState.sessionId,
          phase: data.phase,
          step: data.step,
          responseLength: data.response.length,
          isComplete: data.isComplete
        })

      } else {
        throw new Error(data.message || 'Failed to process message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again, or refresh the page if the problem persists.',
        timestamp: new Date(),
        phase: conversationState.phase,
        step: conversationState.step
      }

      setMessages(prev => [...prev, errorMessage])

      toast({
        title: 'Message Error',
        description: 'Failed to send your message. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const trackEvent = async (eventType: string, eventData: any) => {
    try {
      await fetch('/api/conversation/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: conversationState.sessionId,
          eventType,
          eventData,
          phase: conversationState.phase,
          step: conversationState.step
        })
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const currentPhase = phaseInfo[conversationState.phase as keyof typeof phaseInfo] || phaseInfo.discovery

  if (isInitializing) {
    return (
      <Card className="w-full max-w-4xl mx-auto h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-neural to-quantum flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-neural to-quantum animate-ping opacity-20"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Initializing AI Assistant</h3>
          <p className="text-gray-600">Setting up your personalized conversation...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Progress Header */}
      <Card className="p-4 bg-gradient-to-r from-white to-gray-50 border-l-4 border-neural">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentPhase.color} flex items-center justify-center text-white text-lg`}>
              {currentPhase.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{currentPhase.title}</h3>
              <p className="text-sm text-gray-600">{currentPhase.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Step {conversationState.step} of 4</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full bg-gradient-to-r ${currentPhase.color} transition-all duration-500`}
            style={{ width: `${(conversationState.step / 4) * 100}%` }}
          ></div>
        </div>
      </Card>

      {/* Chat Interface */}
      <Card className="h-[500px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-neural text-white' 
                    : 'bg-gradient-to-r from-quantum to-cyber text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-neural text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-quantum to-cyber text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-neural" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLoading ? "AI is processing..." : "Type your message..."}
                disabled={isLoading || conversationState.isComplete}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-neural focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
              {conversationState.isComplete && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || conversationState.isComplete}
              className="px-4 py-3 bg-gradient-to-r from-neural to-quantum hover:from-neural/90 hover:to-quantum/90 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          {conversationState.isComplete && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Conversation Complete!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your personalized quote has been generated. Check the quote section below for details.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
} 