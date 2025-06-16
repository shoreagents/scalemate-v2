import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neural-50 via-white to-quantum-50 pt-20">
      <div className="fixed inset-0 neural-network-pattern opacity-20 pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold gradient-text mb-4">
            About ScaleMate
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            The ultimate educational platform for progressive business owners to scale using offshore staff and AI solutions.
          </p>
        </div>

        <Card variant="ai-primary" pattern glow>
          <CardHeader 
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            badge="Our Mission"
            badgeVariant="neural"
          >
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Empowering Business Growth
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Follow the ScaleMate system, and you&apos;ll have more money than you know how to spend.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                ScaleMate is designed for progressive business owners who understand that the future of business 
                lies in intelligent scaling through offshore teams and AI-powered solutions. Our comprehensive 
                educational platform provides you with the exact system and tools needed to build, manage, and 
                optimize remote teams that deliver exceptional results.
              </p>
              
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-6">
                Whether you&apos;re looking to reduce costs, access global talent, or implement cutting-edge AI 
                automation, ScaleMate gives you the roadmap to success. Our proven methodology has helped 
                countless business owners transform their operations and achieve unprecedented growth.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AboutPage 