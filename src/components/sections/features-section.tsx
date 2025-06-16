import React from 'react'
import { Calculator, CheckCircle, Users, TrendingUp, Zap, Globe, Shield, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

const features = [
  {
    name: 'AI Quote Calculator',
    description: 'Get instant, accurate quotes for offshore staffing with our intelligent AI system that understands your business needs.',
    icon: Calculator,
  },
  {
    name: 'Readiness Assessment',
    description: 'Comprehensive evaluation of your business readiness for offshore scaling across 8 critical categories.',
    icon: CheckCircle,
  },
  {
    name: 'Team Building System',
    description: 'Proven methodology to build and manage offshore teams of 20-50+ people that actually deliver results.',
    icon: Users,
  },
  {
    name: 'Cost Optimization',
    description: 'Save 60-80% on labor costs while maintaining or improving quality through strategic offshore placement.',
    icon: TrendingUp,
  },
  {
    name: 'AI Integration',
    description: 'Learn how to enhance your offshore teams with cutting-edge AI tools for maximum productivity.',
    icon: Zap,
  },
  {
    name: 'Global Talent Access',
    description: 'Access top talent from Philippines, India, Eastern Europe, and Latin America with cultural insights.',
    icon: Globe,
  },
  {
    name: 'Risk Mitigation',
    description: 'Comprehensive strategies to minimize risks and ensure successful offshore team implementation.',
    icon: Shield,
  },
  {
    name: 'Educational Resources',
    description: 'Extensive library of guides, templates, and best practices from successful offshore implementations.',
    icon: BookOpen,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-white via-neural-50/30 to-quantum-50/30 relative">
      <div className="absolute inset-0 neural-network-pattern opacity-5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 gradient-text">
            Everything You Need to Scale Successfully
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our comprehensive platform provides all the tools, knowledge, and systems 
            you need to build and manage successful offshore teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.name}
              variant="glass"
              hover
              className="h-full"
            >
              <CardContent>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-neural-500 to-quantum-500 text-white mb-4 shadow-neural-md">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{feature.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center rounded-full border px-6 py-2 text-sm font-medium bg-neural-50 text-neural-700 border-neural-200 dark:bg-neural-900/20 dark:text-neural-300 dark:border-neural-800 shadow-neural-sm">
            <Zap className="mr-2 h-4 w-4" />
            Ready to transform your business? Start with our free tools.
          </div>
        </div>
      </div>
    </section>
  )
} 