import React from 'react'
import Link from 'next/link'
import { Calculator, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/ButtonComponent'

const tools = [
  {
    name: 'AI Quote Calculator',
    description: 'Get personalized offshore staffing quotes through intelligent conversation with our AI consultant.',
    icon: Calculator,
    href: '/tools/quote-calculator',
    features: [
      'Conversational AI interface',
      'Personalized cost estimates',
      'Role-specific recommendations',
      'Location optimization',
      'Implementation timeline',
    ],
    badge: 'Most Popular',
  },
  {
    name: 'Readiness Assessment',
    description: 'Comprehensive evaluation of your business readiness for offshore team scaling.',
    icon: CheckCircle,
    href: '/tools/readiness-test',
    features: [
      '8 critical assessment areas',
      'Detailed scoring system',
      'Actionable recommendations',
      'Improvement roadmap',
      'Resource suggestions',
    ],
    badge: 'Essential',
  },
]

export function ToolsPreviewSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-50/50 to-background">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800 mb-6">
            <Sparkles className="mr-2 h-4 w-4" />
            Free AI-Powered Tools
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Start Your Offshore Journey Today
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the power of our AI-driven tools designed to help you make 
            informed decisions about offshore team scaling.
          </p>
        </div>

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
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-xl">{tool.name}</h3>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {tool.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {tool.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

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

        {/* Bottom section */}
        <div className="text-center mt-16">
          <div className="card p-8 max-w-2xl mx-auto bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
            <h3 className="font-bold text-xl mb-4">
              Ready for the Complete ScaleMate System?
            </h3>
            <p className="text-muted-foreground mb-6">
              These free tools are just the beginning. Get access to our complete 
              methodology, templates, and ongoing support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">
                Learn More About ScaleMate
              </Button>
              <Button className="bg-neural-600 hover:bg-neural-700 text-white">
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 