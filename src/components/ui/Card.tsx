import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'neural' | 'quantum' | 'cyber' | 'matrix' | 'glass' | 'ai-primary'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  glow?: boolean
  pulse?: boolean
  interactive?: boolean
  pattern?: boolean
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  badge?: string
  badgeVariant?: 'neural' | 'quantum' | 'cyber' | 'matrix'
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    hover = false,
    glow = false,
    pulse = false,
    interactive = false,
    pattern = false,
    children,
    ...props 
  }, ref) => {
    const baseStyles = `
      rounded-xl border transition-all duration-300 relative overflow-hidden
      ${interactive ? 'cursor-pointer' : ''}
    `

    const variants = {
      default: `
        bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800
        shadow-sm hover:shadow-md
      `,
      neural: `
        bg-gradient-to-br from-neural-50/50 to-neural-100/30 
        border-neural-200/50 shadow-neural-sm hover:shadow-neural-md
        backdrop-blur-sm
      `,
      quantum: `
        bg-gradient-to-br from-quantum-50/50 to-quantum-100/30 
        border-quantum-200/50 shadow-neural-sm hover:shadow-neural-md
        backdrop-blur-sm
      `,
      cyber: `
        bg-gradient-to-br from-cyber-50/50 to-cyber-100/30 
        border-cyber-200/50 shadow-neural-sm hover:shadow-neural-md
        backdrop-blur-sm
      `,
      matrix: `
        bg-gradient-to-br from-matrix-50/50 to-matrix-100/30 
        border-matrix-200/50 shadow-neural-sm hover:shadow-neural-md
        backdrop-blur-sm
      `,
      glass: `
        bg-white/10 dark:bg-black/10 border-white/20 dark:border-white/10
        backdrop-blur-neural shadow-neural-md hover:shadow-neural-lg
      `,
      'ai-primary': `
        bg-gradient-to-br from-neural-50/30 via-quantum-50/20 to-neural-100/40
        border-neural-200/30 shadow-neural-lg hover:shadow-neural-xl
        backdrop-blur-neural
      `
    }

    const sizes = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    }

    const effectClasses = cn(
      hover && 'hover:scale-[1.02] hover:-translate-y-1',
      glow && 'animate-glow-pulse',
      pulse && 'animate-neural-pulse',
      interactive && 'hover:shadow-neural-lg transform-gpu'
    )

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          effectClasses,
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Neural network pattern overlay */}
        {pattern && (
          <div className="absolute inset-0 neural-network-pattern opacity-10 pointer-events-none" />
        )}
        
        {/* Glow effect */}
        {glow && (
          <div className="absolute -inset-1 bg-gradient-to-r from-neural-500/20 via-quantum-500/20 to-neural-500/20 rounded-xl blur-sm -z-10" />
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, icon, badge, badgeVariant = 'neural', children, ...props }, ref) => {
    const badgeVariants = {
      neural: 'bg-neural-100 text-neural-700 border-neural-200',
      quantum: 'bg-quantum-100 text-quantum-700 border-quantum-200',
      cyber: 'bg-cyber-100 text-cyber-700 border-cyber-200',
      matrix: 'bg-matrix-100 text-matrix-700 border-matrix-200'
    }

    return (
      <div
        className={cn(
          'flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-700/50',
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-neural-500 to-quantum-500 flex items-center justify-center text-white shadow-neural-sm">
              {icon}
            </div>
          )}
          <div className="flex-1">
            {children}
          </div>
        </div>
        
        {badge && (
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full border',
            badgeVariants[badgeVariant]
          )}>
            {badge}
          </span>
        )}
      </div>
    )
  }
)

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn('py-4', className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardFooter } 