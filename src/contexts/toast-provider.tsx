'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { generateId } from '@/lib/utils'

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (toastId: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
  }, [])

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId()
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }
  }, [dismiss])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const value: ToastContextType = {
    toasts,
    toast,
    dismiss,
    dismissAll,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  )
}

interface ToastComponentProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastComponent({ toast, onDismiss }: ToastComponentProps) {
  const getToastStyles = () => {
    const baseStyles = 'rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 max-w-sm'
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200`
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200`
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200`
      default:
        return `${baseStyles} bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100`
    }
  }

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {toast.title && (
            <div className="font-semibold text-sm mb-1">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
} 