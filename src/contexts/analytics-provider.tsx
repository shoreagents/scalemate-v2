'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { generateId } from '@/lib/utils'
import type { AnalyticsEvent, PageView } from '@/types'

interface AnalyticsContextType {
  sessionId: string
  trackEvent: (eventType: string, eventData?: Record<string, any>) => void
  trackPageView: (path: string, title: string, referrer?: string) => void
  getUserId: () => string | null
  setUserId: (userId: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(() => generateId())
  const [userId, setUserIdState] = useState<string | null>(null)

  const trackEvent = useCallback(async (eventType: string, eventData: Record<string, any> = {}) => {
    const event: Omit<AnalyticsEvent, 'id'> = {
      sessionId,
      eventType,
      eventData: {
        ...eventData,
        userId,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    }

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }, [sessionId, userId])

  const trackPageView = useCallback(async (path: string, title: string, referrer?: string) => {
    const pageView: Omit<PageView, 'id'> = {
      sessionId,
      path,
      title,
      referrer,
      timestamp: new Date(),
    }

    try {
      await fetch('/api/analytics/pageviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageView),
      })
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }, [sessionId])

  useEffect(() => {
    // Initialize session tracking
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('scalemate-user-id')
      if (storedUserId) {
        setUserIdState(storedUserId)
      }
    }
  }, [])

  useEffect(() => {
    // Track initial page view
    if (typeof window !== 'undefined') {
      trackPageView(window.location.pathname, document.title, document.referrer)
    }
  }, [trackPageView])

  const setUserId = (newUserId: string) => {
    setUserIdState(newUserId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('scalemate-user-id', newUserId)
    }
    trackEvent('user_identified', { userId: newUserId })
  }

  const getUserId = () => userId

  const value: AnalyticsContextType = {
    sessionId,
    trackEvent,
    trackPageView,
    getUserId,
    setUserId,
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
} 