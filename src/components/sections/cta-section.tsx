import React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Calculator, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/ButtonComponent'

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-primary-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary-700/20 to-transparent" />
      
      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-primary-300/30 bg-primary-500/20 px-4 py-1.5 text-sm font-medium text-primary-100 mb-8">
            <Sparkles className="mr-2 h-4 w-4" />
            Start Your Transformation Today
          </div>

          {/* Main heading */}
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
            Ready to Scale Your Business with{' '}
            <span className="text-primary-200">Offshore Teams & AI?</span>
          </h2>

          {/* Subheading */}
          <p className="text-lg text-primary-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of progressive business owners who have transformed their 
            operations using the ScaleMate system. Start with our free tools and 
            discover what&apos;s possible.
          </p>

          {/* Tool cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-400/20 text-primary-100 mb-4 mx-auto">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Quote Calculator</h3>
              <p className="text-primary-200 text-sm mb-4">
                Get personalized offshore staffing quotes in minutes
              </p>
              <Link href="/tools/quote-calculator" className="block">
                <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Try Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-400/20 text-primary-100 mb-4 mx-auto">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Readiness Assessment</h3>
              <p className="text-primary-200 text-sm mb-4">
                Evaluate your business readiness for offshore scaling
              </p>
              <Link href="/tools/readiness-test" className="block">
                <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Take Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Main CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/tools">
              <Button size="lg" className="text-lg px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 font-semibold">
                Start with Free Tools
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10 hover:text-gray-900">
              Schedule Consultation
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-primary-200">
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              100% Free Tools
            </div>
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              No Credit Card Required
            </div>
            <div className="flex items-center">
              <span className="mr-2">✓</span>
              Instant Results
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 