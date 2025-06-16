import React from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    content: "ScaleMate's system completely transformed how we think about offshore teams. We went from struggling with 2 VAs to successfully managing a team of 35 people across 4 countries. The AI tools made the difference.",
    author: {
      name: "Sarah Chen",
      role: "CEO, TechFlow Solutions",
      image: "/testimonials/sarah.jpg",
    },
    rating: 5,
  },
  {
    content: "The readiness assessment was eye-opening. It showed us exactly what we needed to fix before scaling. Following their recommendations, we saved 6 months of trial and error.",
    author: {
      name: "Marcus Rodriguez",
      role: "Founder, Digital Marketing Pro",
      image: "/testimonials/marcus.jpg",
    },
    rating: 5,
  },
  {
    content: "I was skeptical about offshore teams until I found ScaleMate. Their educational approach and AI-enhanced methodology helped us build a 20-person team that outperforms our local hires.",
    author: {
      name: "Jennifer Walsh",
      role: "COO, E-commerce Empire",
      image: "/testimonials/jennifer.jpg",
    },
    rating: 5,
  },
]

const stats = [
  { label: "Average Cost Savings", value: "73%" },
  { label: "Team Success Rate", value: "94%" },
  { label: "Time to Full Team", value: "90 days" },
  { label: "Client Satisfaction", value: "4.9/5" },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Trusted by Progressive Business Owners
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how ScaleMate has helped businesses like yours build successful 
            offshore teams and scale beyond their wildest dreams.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="card p-6 relative"
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4 text-primary/20">
                <Quote className="h-8 w-8" />
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-muted-foreground mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </blockquote>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <span className="text-primary font-semibold text-sm">
                    {testimonial.author.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-sm">
                    {testimonial.author.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.author.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="card p-8 max-w-2xl mx-auto bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
            <h3 className="font-bold text-xl mb-4">
              Join Hundreds of Successful Business Owners
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your offshore scaling journey today with our free AI-powered tools 
              and proven methodology.
            </p>
            <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="ml-2">4.9/5 from 500+ business owners</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 