'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/ButtonComponent'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'

interface Question {
  id: string
  category: 'business' | 'technology' | 'team' | 'processes'
  question: string
  options: Array<{ value: number; label: string; description?: string }>
}

interface TestResult {
  overallScore: number
  categoryScores: {
    business: number
    technology: number
    team: number
    processes: number
  }
  readinessLevel: 'Not Ready' | 'Getting Started' | 'Ready to Scale' | 'Scale Master'
  recommendations: string[]
  nextSteps: string[]
}

const questions: Question[] = [
  {
    id: '1',
    category: 'business',
    question: 'What is your current annual revenue?',
    options: [
      { value: 1, label: 'Under $100K', description: 'Early stage business' },
      { value: 2, label: '$100K - $500K', description: 'Growing business' },
      { value: 3, label: '$500K - $2M', description: 'Established business' },
      { value: 4, label: '$2M+', description: 'Mature business' }
    ]
  },
  {
    id: '2',
    category: 'business',
    question: 'How predictable is your monthly revenue?',
    options: [
      { value: 1, label: 'Very unpredictable', description: 'Revenue varies significantly' },
      { value: 2, label: 'Somewhat predictable', description: 'Some recurring revenue' },
      { value: 3, label: 'Mostly predictable', description: 'Strong recurring revenue base' },
      { value: 4, label: 'Highly predictable', description: 'Stable recurring revenue model' }
    ]
  },
  {
    id: '3',
    category: 'team',
    question: 'How many full-time employees do you currently have?',
    options: [
      { value: 1, label: '1-5 employees', description: 'Small team' },
      { value: 2, label: '6-15 employees', description: 'Growing team' },
      { value: 3, label: '16-50 employees', description: 'Medium team' },
      { value: 4, label: '50+ employees', description: 'Large team' }
    ]
  },
  {
    id: '4',
    category: 'team',
    question: 'How comfortable are you with managing remote teams?',
    options: [
      { value: 1, label: 'No experience', description: 'Never managed remote workers' },
      { value: 2, label: 'Some experience', description: 'Limited remote management' },
      { value: 3, label: 'Comfortable', description: 'Good remote management skills' },
      { value: 4, label: 'Expert level', description: 'Extensive remote team experience' }
    ]
  },
  {
    id: '5',
    category: 'technology',
    question: 'How would you rate your current technology infrastructure?',
    options: [
      { value: 1, label: 'Basic', description: 'Minimal tech tools' },
      { value: 2, label: 'Developing', description: 'Some modern tools in place' },
      { value: 3, label: 'Advanced', description: 'Good tech stack and systems' },
      { value: 4, label: 'Cutting-edge', description: 'Latest technology and automation' }
    ]
  },
  {
    id: '6',
    category: 'technology',
    question: 'How familiar are you with AI tools and automation?',
    options: [
      { value: 1, label: 'Not familiar', description: 'No AI/automation experience' },
      { value: 2, label: 'Basic knowledge', description: 'Aware but limited use' },
      { value: 3, label: 'Regular user', description: 'Use AI tools regularly' },
      { value: 4, label: 'Power user', description: 'Advanced AI/automation implementation' }
    ]
  },
  {
    id: '7',
    category: 'processes',
    question: 'How well documented are your business processes?',
    options: [
      { value: 1, label: 'Not documented', description: 'Processes exist in heads only' },
      { value: 2, label: 'Partially documented', description: 'Some key processes written down' },
      { value: 3, label: 'Well documented', description: 'Most processes clearly documented' },
      { value: 4, label: 'Fully systematized', description: 'Complete process documentation and SOPs' }
    ]
  },
  {
    id: '8',
    category: 'processes',
    question: 'How standardized are your workflows?',
    options: [
      { value: 1, label: 'Ad-hoc', description: 'Different approach each time' },
      { value: 2, label: 'Somewhat consistent', description: 'Some standard procedures' },
      { value: 3, label: 'Mostly standardized', description: 'Clear workflows for most tasks' },
      { value: 4, label: 'Fully standardized', description: 'Consistent, optimized workflows' }
    ]
  }
]

const ReadinessTestPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      calculateResults()
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const calculateResults = () => {
    const categoryScores = {
      business: 0,
      technology: 0,
      team: 0,
      processes: 0
    }

    const categoryCounts = {
      business: 0,
      technology: 0,
      team: 0,
      processes: 0
    }

    questions.forEach(question => {
      const answer = answers[question.id]
      if (answer) {
        categoryScores[question.category] += answer
        categoryCounts[question.category]++
      }
    })

    // Calculate average scores for each category
    Object.keys(categoryScores).forEach(category => {
      const key = category as keyof typeof categoryScores
      if (categoryCounts[key] > 0) {
        categoryScores[key] = Math.round((categoryScores[key] / categoryCounts[key]) * 25)
      }
    })

    const overallScore = Math.round(
      (categoryScores.business + categoryScores.technology + categoryScores.team + categoryScores.processes) / 4
    )

    let readinessLevel: TestResult['readinessLevel']
    let recommendations: string[]
    let nextSteps: string[]

    if (overallScore < 25) {
      readinessLevel = 'Not Ready'
      recommendations = [
        'Focus on stabilizing your core business operations',
        'Build a solid foundation before scaling',
        'Consider working with a business consultant',
        'Develop basic systems and processes'
      ]
      nextSteps = [
        'Schedule a strategy consultation',
        'Review our business foundation resources',
        'Start with basic process documentation'
      ]
    } else if (overallScore < 50) {
      readinessLevel = 'Getting Started'
      recommendations = [
        'You have good potential for scaling',
        'Focus on strengthening weaker areas',
        'Consider starting with basic offshore support',
        'Invest in process documentation and systems'
      ]
      nextSteps = [
        'Book a scaling readiness consultation',
        'Start with a small offshore pilot project',
        'Implement basic project management tools'
      ]
    } else if (overallScore < 75) {
      readinessLevel = 'Ready to Scale'
      recommendations = [
        'You are well-positioned for scaling',
        'Consider implementing AI-powered solutions',
        'Expand your offshore team strategically',
        'Focus on automation and optimization'
      ]
      nextSteps = [
        'Get a personalized scaling quote',
        'Schedule an AI implementation consultation',
        'Plan your offshore team expansion'
      ]
    } else {
      readinessLevel = 'Scale Master'
      recommendations = [
        'Excellent! You are ready for advanced scaling',
        'Implement cutting-edge AI solutions',
        'Build a comprehensive offshore operation',
        'Focus on innovation and market expansion'
      ]
      nextSteps = [
        'Schedule an executive scaling consultation',
        'Explore advanced AI automation solutions',
        'Plan multi-location offshore operations'
      ]
    }

    setTestResult({
      overallScore,
      categoryScores,
      readinessLevel,
      recommendations,
      nextSteps
    })
    setShowResults(true)
  }

  const resetTest = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setTestResult(null)
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (showResults && testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neural-50 via-white to-quantum-50 pt-20">
        <div className="fixed inset-0 neural-network-pattern opacity-20 pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold gradient-text mb-4">
              Your Scaling Readiness Results
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Based on your responses, here&apos;s your personalized scaling assessment
            </p>
          </div>

          {/* Overall Score */}
          <Card variant="ai-primary" className="mb-8" glow pattern>
            <CardContent className="text-center">
              <div className="mb-6">
                <div className="w-32 h-32 mx-auto relative">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(testResult.overallScore / 100) * 314} 314`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0066FF" />
                        <stop offset="100%" stopColor="#6B46C1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-neural-600">{testResult.overallScore}</div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {testResult.readinessLevel}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your business scaling readiness level
              </p>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {Object.entries(testResult.categoryScores).map(([category, score]) => (
              <Card key={category} variant="glass" hover>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {category}
                    </h3>
                    <span className="text-2xl font-bold text-neural-600">{score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-neural-500 to-quantum-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recommendations */}
          <Card variant="neural" className="mb-8">
            <CardHeader 
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
              badge="AI Generated"
              badgeVariant="neural"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Personalized Recommendations
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Based on your assessment results
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {testResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-neural-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card variant="quantum" className="mb-8">
            <CardHeader 
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              }
              badge="Action Items"
              badgeVariant="quantum"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recommended Next Steps
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your path to scaling success
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResult.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg border border-gray-200/50">
                    <div className="flex-shrink-0 w-8 h-8 bg-quantum-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="flex-1 text-gray-700 dark:text-gray-300">{step}</span>
                    <Button variant="outline" size="sm">
                      Take Action
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card variant="ai-primary" glow>
            <CardContent className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Start Scaling?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Based on your results, we can create a personalized scaling plan that fits your business needs and readiness level.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="ai-primary" size="lg">
                  Get Personalized Quote
                </Button>
                <Button variant="outline" size="lg">
                  Schedule Consultation
                </Button>
                <Button variant="ghost" size="lg" onClick={resetTest}>
                  Retake Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const currentAnswer = answers[question.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neural-50 via-white to-quantum-50 pt-20">
      <div className="fixed inset-0 neural-network-pattern opacity-20 pointer-events-none" />
      
      <div className="relative max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold gradient-text mb-4">
            AI Scaling Readiness Test
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover how ready your business is for AI-powered scaling
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-neural-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-neural-500 to-quantum-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card variant="ai-primary" className="mb-8" pattern>
          <CardHeader 
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            badge={question.category.charAt(0).toUpperCase() + question.category.slice(1)}
            badgeVariant="neural"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {question.question}
              </h2>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ${
                    currentAnswer === option.value
                      ? 'border-neural-500 bg-neural-50 shadow-neural-md'
                      : 'border-gray-200 bg-white hover:border-neural-300 hover:bg-neural-50/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      currentAnswer === option.value
                        ? 'border-neural-500 bg-neural-500'
                        : 'border-gray-300'
                    }`}>
                      {currentAnswer === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>

          <CardFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                variant="neural"
                onClick={nextQuestion}
                disabled={!currentAnswer}
                icon={
                  currentQuestion === questions.length - 1 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )
                }
                iconPosition="right"
              >
                {currentQuestion === questions.length - 1 ? 'Get Results' : 'Next'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default ReadinessTestPage 