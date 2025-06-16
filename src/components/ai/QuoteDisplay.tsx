'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/ButtonComponent'
import { 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Star,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Target,
  Shield,
  Zap
} from 'lucide-react'

interface QuoteData {
  id: string
  sessionId: string
  quote: {
    recommendedRole: {
      title: string
      description: string
      keyResponsibilities: string[]
      requiredSkills: string[]
      experienceLevel: string
      category: string
    }
    pricing: {
      hourlyRate: {
        min: number
        max: number
        recommended: number
        currency: string
      }
      monthlyEstimate: {
        partTime: number
        fullTime: number
        currency: string
      }
      setupFees: {
        recruitment: number
        onboarding: number
        total: number
        currency: string
      }
      totalFirstMonth: number
      ongoingMonthly: number
    }
    implementation: {
      timeline: {
        recruitment: string
        interviews: string
        onboarding: string
        fullProductivity: string
      }
      phases: Array<{
        phase: string
        duration: string
        activities: string[]
        deliverables: string[]
      }>
      supportIncluded: string[]
    }
    alternatives: Array<{
      title: string
      description: string
      pricing: {
        hourlyRate: number
        monthlyEstimate: number
      }
      pros: string[]
      cons: string[]
    }>
    riskFactors: Array<{
      risk: string
      mitigation: string
      impact: 'low' | 'medium' | 'high'
    }>
  }
  confidence: number
  generatedAt: Date
}

interface QuoteDisplayProps {
  quote: QuoteData
  onScheduleConsultation?: () => void
  onDownloadQuote?: () => void
}

export function QuoteDisplay({ 
  quote, 
  onScheduleConsultation, 
  onDownloadQuote 
}: QuoteDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'implementation' | 'alternatives' | 'risks'>('overview')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'implementation', label: 'Implementation', icon: Calendar },
    { id: 'alternatives', label: 'Alternatives', icon: TrendingUp },
    { id: 'risks', label: 'Risk Analysis', icon: Shield }
  ]

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-neural to-quantum text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Personalized Quote</h2>
            <p className="text-blue-100">
              Generated on {new Date(quote.generatedAt).toLocaleDateString()} • 
              Confidence Score: {Math.round(quote.confidence * 100)}%
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-5 h-5 ${i < Math.round(quote.confidence * 5) ? 'text-yellow-300 fill-current' : 'text-blue-200'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Role Summary */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {quote.quote.recommendedRole.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {quote.quote.recommendedRole.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{quote.quote.recommendedRole.experienceLevel}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>{quote.quote.recommendedRole.category}</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-neural">
              {formatCurrency(quote.quote.pricing.hourlyRate.recommended)}/hr
            </div>
            <div className="text-sm text-gray-500">
              {formatCurrency(quote.quote.pricing.hourlyRate.min)} - {formatCurrency(quote.quote.pricing.hourlyRate.max)} range
            </div>
          </div>
        </div>

        {/* Key Skills */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {quote.quote.recommendedRole.requiredSkills.map((skill, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(quote.quote.pricing.monthlyEstimate.partTime)}
            </div>
            <div className="text-sm text-gray-600">Part-time (20h/week)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-neural">
              {formatCurrency(quote.quote.pricing.monthlyEstimate.fullTime)}
            </div>
            <div className="text-sm text-gray-600">Full-time (40h/week)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(quote.quote.pricing.setupFees.total)}
            </div>
            <div className="text-sm text-gray-600">One-time setup</div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-neural shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Responsibilities */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Key Responsibilities</span>
              </h4>
              <ul className="space-y-2">
                {quote.quote.recommendedRole.keyResponsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-neural rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Pricing Breakdown */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span>Pricing Breakdown</span>
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="font-medium">{formatCurrency(quote.quote.pricing.hourlyRate.recommended)}/hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly (Full-time)</span>
                  <span className="font-medium">{formatCurrency(quote.quote.pricing.monthlyEstimate.fullTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recruitment Fee</span>
                  <span className="font-medium">{formatCurrency(quote.quote.pricing.setupFees.recruitment)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Onboarding Fee</span>
                  <span className="font-medium">{formatCurrency(quote.quote.pricing.setupFees.onboarding)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>First Month Total</span>
                  <span className="text-neural">{formatCurrency(quote.quote.pricing.totalFirstMonth)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span>Ongoing Monthly</span>
                  <span className="font-semibold">{formatCurrency(quote.quote.pricing.ongoingMonthly)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'implementation' && (
          <div className="space-y-6">
            {/* Timeline */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>Implementation Timeline</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(quote.quote.implementation.timeline).map(([phase, duration], index) => (
                  <div key={phase} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-neural to-quantum text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                      {index + 1}
                    </div>
                    <h5 className="font-medium text-gray-900 capitalize mb-1">
                      {phase.replace('_', ' ')}
                    </h5>
                    <p className="text-sm text-gray-600">{duration}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Implementation Phases */}
            <div className="space-y-4">
              {quote.quote.implementation.phases.map((phase, index) => (
                <Card key={index} className="p-6">
                  <button
                    onClick={() => toggleSection(`phase-${index}`)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-neural text-white rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <span>{phase.phase}</span>
                      <span className="text-sm text-gray-500">({phase.duration})</span>
                    </h4>
                    {expandedSections[`phase-${index}`] ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSections[`phase-${index}`] && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Activities</h5>
                        <ul className="space-y-1">
                          {phase.activities.map((activity, actIndex) => (
                            <li key={actIndex} className="flex items-start space-x-2">
                              <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 text-sm">{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Deliverables</h5>
                        <ul className="space-y-1">
                          {phase.deliverables.map((deliverable, delIndex) => (
                            <li key={delIndex} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 text-sm">{deliverable}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Support Included */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Support Included</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quote.quote.implementation.supportIncluded.map((support, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{support}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div className="space-y-4">
            {quote.quote.alternatives.map((alternative, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{alternative.title}</h4>
                    <p className="text-gray-600">{alternative.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-neural">
                      {formatCurrency(alternative.pricing.hourlyRate)}/hr
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(alternative.pricing.monthlyEstimate)}/month
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Pros</h5>
                    <ul className="space-y-1">
                      {alternative.pros.map((pro, proIndex) => (
                        <li key={proIndex} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">Cons</h5>
                    <ul className="space-y-1">
                      {alternative.cons.map((con, conIndex) => (
                        <li key={conIndex} className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-4">
            {quote.quote.riskFactors.map((risk, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(risk.impact)}`}>
                    {risk.impact.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{risk.risk}</h4>
                    <p className="text-gray-700 mb-3">{risk.mitigation}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Shield className="w-4 h-4" />
                      <span>ScaleMate Mitigation Strategy</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-gray-900 mb-1">Ready to get started?</h4>
            <p className="text-gray-600">Schedule a consultation to discuss your requirements in detail.</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onDownloadQuote}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Quote</span>
            </Button>
            <Button
              onClick={onScheduleConsultation}
              className="bg-gradient-to-r from-neural to-quantum hover:from-neural/90 hover:to-quantum/90 text-white flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Consultation</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
} 