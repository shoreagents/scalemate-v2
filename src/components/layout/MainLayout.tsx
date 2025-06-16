'use client'

import React from 'react'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export default function MainLayout({ children, className = '' }: MainLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
} 