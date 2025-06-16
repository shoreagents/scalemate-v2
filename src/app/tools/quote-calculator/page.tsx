'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/ButtonComponent'
import { ConversationInterface } from '@/components/ai/ConversationInterface'
import { QuoteDisplay } from '@/components/ai/QuoteDisplay'
import { Calculator, Sparkles, MessageSquare, FileText, ArrowRight, Brain, Zap, Target } from 'lucide-react'

export default function QuoteCalculatorPage() {
  const [activeMode, setActiveMode] = useState<'conversation' | 'traditional'>('conversation')
  const [generatedQuote, setGeneratedQuote] = useState<any>(null)
  const [currentPhase, setCurrentPhase] = useState('discovery')
  const [currentStep, setCurrentStep] = useState(1)

  const handleQuoteGenerated = (quote: any) => {
    setGeneratedQuote(quote)
  }

  const handlePhaseChange = (phase: string, step: number) => {
    setCurrentPhase(phase)
    setCurrentStep(step)
  }

  const handleScheduleConsultation = () => {
    // Redirect to contact page or open calendar
    window.open('https://calendly.com/scalemate', '_blank')
  }

  const handleDownloadQuote = () => {
    // Generate and download PDF quote
    console.log('Downloading quote...', generatedQuote)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-neural to-quantum rounded-full flex items-center justify-center relative">
              <Calculator className="w-10 h-10 text-white" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neural to-quantum animate-ping opacity-20"></div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            The Most Advanced Offshore Staffing Quote System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience the future of offshore staffing quotes with our revolutionary AI-powered conversation system. 
            Get personalized recommendations, transparent pricing, and implementation plans in minutes.
          </p>
          
          {/* Mode Selection */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Button
              variant={activeMode === 'conversation' ? 'default' : 'outline'}
              onClick={() => setActiveMode('conversation')}
              className={`flex items-center space-x-2 px-6 py-3 ${
                activeMode === 'conversation' 
                  ? 'bg-gradient-to-r from-neural to-quantum text-white' 
                  : 'border-neural text-neural hover:bg-neural hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>AI Conversation</span>
              <Sparkles className="w-4 h-4" />
            </Button>
            <div className="text-gray-400">or</div>
            <Button
              variant={activeMode === 'traditional' ? 'default' : 'outline'}
              onClick={() => setActiveMode('traditional')}
              className={`flex items-center space-x-2 px-6 py-3 ${
                activeMode === 'traditional' 
                  ? 'bg-gradient-to-r from-neural to-quantum text-white' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Traditional Form</span>
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Intelligence</h3>
              <p className="text-gray-600 text-sm">Advanced conversation engine with memory and context understanding</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dynamic Pricing Engine</h3>
              <p className="text-gray-600 text-sm">Real-time quote generation with role recommendations and alternatives</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Implementation Ready</h3>
              <p className="text-gray-600 text-sm">Complete roadmap with timeline, phases, and risk mitigation</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {activeMode === 'conversation' ? (
            <>
              {/* AI Conversation Interface */}
              <ConversationInterface
                onQuoteGenerated={handleQuoteGenerated}
                onPhaseChange={handlePhaseChange}
              />

              {/* Generated Quote Display */}
              {generatedQuote && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Your Personalized Quote is Ready! 🎉
                    </h2>
                                    <p className="text-gray-600 max-w-2xl mx-auto">
                  Based on our conversation, here&apos;s your comprehensive offshore staffing solution 
                  with transparent pricing and implementation plan.
                </p>
                  </div>
                  
                  <QuoteDisplay
                    quote={generatedQuote}
                    onScheduleConsultation={handleScheduleConsultation}
                    onDownloadQuote={handleDownloadQuote}
                  />
                </div>
              )}
            </>
          ) : (
            /* Traditional Form Mode */
            <Card className="p-8 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Traditional Quote Form</h2>
                <p className="text-gray-600">
                  Prefer a traditional form? We&apos;re working on integrating our advanced AI system 
                  with a streamlined form experience.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Coming Soon: Hybrid Experience</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  We&apos;re developing a hybrid form that combines the speed of traditional forms 
                  with the intelligence of our AI conversation system.
                </p>
                <Button
                  onClick={() => setActiveMode('conversation')}
                  className="bg-gradient-to-r from-neural to-quantum text-white"
                >
                  Try AI Conversation Instead
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Bottom CTA */}
        {!generatedQuote && (
          <div className="text-center mt-16">
            <Card className="p-8 bg-gradient-to-r from-neural/5 to-quantum/5 border-neural/20">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Ready to Transform Your Business?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join thousands of businesses that have successfully scaled with offshore talent. 
                Our AI-powered system ensures you get the perfect match for your specific needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={() => setActiveMode('conversation')}
                  className="bg-gradient-to-r from-neural to-quantum text-white px-8 py-3"
                >
                  Start AI Conversation
                </Button>
                <Button
                  variant="outline"
                  onClick={handleScheduleConsultation}
                  className="border-neural text-neural hover:bg-neural hover:text-white px-8 py-3"
                >
                  Schedule Consultation
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 