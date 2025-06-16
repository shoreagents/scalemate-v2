import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'neural' | 'quantum' | 'cyber' | 'matrix' | 'ai-primary' | 'ai-secondary'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  glow?: boolean
  pulse?: boolean
  shimmer?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    isLoading = false,
    loadingText = 'Loading...',
    icon,
    iconPosition = 'left',
    glow = false,
    pulse = false,
    shimmer = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group'
    
    const variants = {
      default: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500 shadow-sm hover:shadow-md',
      outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
      neural: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg',
      quantum: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 focus:ring-purple-500 shadow-md hover:shadow-lg',
      cyber: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-green-500 shadow-md hover:shadow-lg',
      matrix: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 focus:ring-yellow-500 shadow-md hover:shadow-lg',
      'ai-primary': 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl border border-blue-400/20',
      'ai-secondary': 'bg-white/10 backdrop-blur border border-white/20 text-gray-900 dark:text-white hover:bg-white/20 focus:ring-blue-500 shadow-sm hover:shadow-md'
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12',
      xl: 'px-8 py-4 text-lg h-14'
    }
    
    const effectClasses = [
      glow && '',
      pulse && '',
      shimmer && ''
    ].filter(Boolean).join(' ')
    
    const classes = [baseStyles, variants[variant], sizes[size], effectClasses, className].filter(Boolean).join(' ')
    
    return (
      <button 
        className={classes} 
        ref={ref} 
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <div className={`flex items-center space-x-2 ${isLoading ? 'opacity-0' : ''}`}>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          
          <span className="font-medium">
            {isLoading ? loadingText : children}
          </span>
          
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      </button>
    )
  }
)

Button.displayName = 'Button' 