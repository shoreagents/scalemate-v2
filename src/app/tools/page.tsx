import React from 'react'
import Link from 'next/link'
import { Calculator, CheckCircle, ArrowRight, Sparkles, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/ButtonComponent'

const tools = [
  {
    name: 'AI Quote Calculator',
    description: 'Get personalized offshore staffing quotes through intelligent conversation with our AI consultant. Discover exact costs, optimal locations, and implementation timelines.',
    icon: Calculator,
    href: '/tools/quote-calculator',
    features: [
      'Conversational AI interface',
      'Personalized cost estimates',
      'Role-specific recommendations',
      'Location optimization',
      'Implementation timeline',
      'Savings calculations',
    ],
    badge: 'Most Popular',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Readiness Assessment',
    description: 'Comprehensive evaluation of your business readiness for offshore team scaling across 8 critical categories with actionable recommendations.',
    icon: CheckCircle,
    href: '/tools/readiness-test',
    features: [
      '8 critical assessment areas',
      'Detailed scoring system',
      'Actionable recommendations',
      'Improvement roadmap',
      'Resource suggestions',
      'Progress tracking',
    ],
    badge: 'Essential',
    color: 'from-green-500 to-green-600',
  },
]

const benefits = [
  {
    icon: Users,
    title: 'Expert Guidance',
    description: 'AI-powered tools trained on thousands of successful offshore implementations',
  },
  {
    icon: TrendingUp,
    title: 'Proven Results',
    description: 'Based on real data from businesses that have successfully scaled offshore',
  },
  {
    icon: Sparkles,
    title: 'Instant Insights',
    description: 'Get immediate, actionable recommendations tailored to your business',
  },
]

export default function ToolsPage() {
  return (
    <>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-primary-900/20 dark:via-background dark:to-primary-800/20">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800 mb-8">
                <Sparkles className="mr-2 h-4 w-4" />
                Free AI-Powered Tools
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                Start Your Offshore Journey with{' '}
                <span className="gradient-text">AI-Powered Tools</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                Experience the power of our AI-driven tools designed to help you make 
                informed decisions about offshore team scaling. Get personalized insights 
                and recommendations in minutes.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                      <benefit.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="py-20 bg-background">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  className="relative group"
                >
                  {/* Badge */}
                  <div className="absolute -top-3 left-6 z-10">
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      {tool.badge}
                    </span>
                  </div>

                  <div className="card p-8 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group-hover:border-primary/50">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${tool.color} text-white mr-4`}>
                        <tool.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-xl">{tool.name}</h3>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {tool.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {tool.features.map((feature) => (
                        <li key={feature} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link href={tool.href} className="block">
                      <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                        Try {tool.name}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-16">
              <div className="card p-8 max-w-2xl mx-auto bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
                <h3 className="font-bold text-xl mb-4">
                  Ready for the Complete ScaleMate System?
                </h3>
                <p className="text-muted-foreground mb-6">
                  These free tools are just the beginning. Get access to our complete 
                  methodology, templates, and ongoing support to build your offshore empire.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline">
                    Learn More About ScaleMate
                  </Button>
                  <Button>
                    Schedule Consultation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
} 