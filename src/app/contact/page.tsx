import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/ButtonComponent'

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neural-50 via-white to-quantum-50 pt-20">
      <div className="fixed inset-0 neural-network-pattern opacity-20 pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold gradient-text mb-4">
            Contact ScaleMate
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ready to scale your business? Get in touch with our team of experts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card variant="neural" hover>
            <CardHeader 
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              badge="Quick Start"
              badgeVariant="neural"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Get Started Today
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try our AI-powered tools
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Start your scaling journey with our free tools. Get a personalized quote 
                or take our readiness assessment to see how prepared your business is for scaling.
              </p>
              <div className="space-y-3">
                <Button variant="neural" className="w-full">
                  Get AI Quote
                </Button>
                <Button variant="outline" className="w-full">
                  Take Readiness Test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="quantum" hover>
            <CardHeader 
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              }
              badge="Expert Support"
              badgeVariant="quantum"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Schedule Consultation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Talk to our scaling experts
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Book a one-on-one consultation with our scaling experts. We&apos;ll analyze your 
                business and create a custom roadmap for your offshore team implementation.
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-quantum-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  30-minute strategy session
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-quantum-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Custom scaling roadmap
                </div>
                <Button variant="quantum" className="w-full" shimmer>
                  Book Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card variant="ai-primary" className="mt-8" pattern glow>
          <CardContent className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Transform Your Business?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Join thousands of progressive business owners who have successfully scaled 
              their operations with our proven system.
            </p>
            <Button variant="ai-primary" size="lg">
              Start Your Scaling Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ContactPage 