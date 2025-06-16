'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Play, Users, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/ButtonComponent'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-neural-50 via-white to-quantum-50 dark:from-neural-900/20 dark:via-background dark:to-quantum-800/20">
      {/* Neural Network Background */}
      <div className="absolute inset-0 neural-network-pattern opacity-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-gradient-to-b from-neural-200/20 via-quantum-200/10 to-transparent rounded-full blur-3xl animate-neural-pulse" />
      
      <div className="container relative">
        <div className="flex flex-col items-center text-center py-20 lg:py-32">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-neural-50 text-neural-700 border-neural-200 dark:bg-neural-900/20 dark:text-neural-300 dark:border-neural-800 mb-8 shadow-neural-sm">
            <Zap className="mr-2 h-4 w-4" />
            Follow the ScaleMate system and scale your business
          </div>

          {/* Main heading */}
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl mb-6">
            Scale Your Business with{' '}
            <span className="gradient-text">Offshore Teams</span>{' '}
            & AI Solutions
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl mb-10">
            The ultimate educational platform for progressive business owners. 
            Learn our proven system to build offshore teams that actually work, 
            enhanced with cutting-edge AI tools.
          </p>

          {/* Value proposition */}
          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm font-medium">
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4 text-neural-500" />
              Build 20-50+ person teams
            </div>
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="mr-2 h-4 w-4 text-cyber-500" />
              Save 60-80% on labor costs
            </div>
            <div className="flex items-center text-muted-foreground">
              <Zap className="mr-2 h-4 w-4 text-quantum-500" />
              AI-enhanced workflows
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/tools">
              <Button variant="ai-primary" size="lg" className="text-lg px-8 py-4">
                Try Our Free Tools
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ai-secondary" size="lg" className="text-lg px-8 py-4">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Social proof */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by progressive business owners worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {/* Placeholder for company logos */}
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-8 w-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 text-background"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            fill="currentColor"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            fill="currentColor"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
} 