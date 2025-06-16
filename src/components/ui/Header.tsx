'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ButtonComponent'
import { Menu, X, Zap, ChevronDown } from 'lucide-react'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { 
      name: 'Tools', 
      href: '/tools',
      submenu: [
        { name: 'AI Quote Calculator', href: '/tools/quote-calculator', description: 'Get personalized quotes' },
        { name: 'Readiness Assessment', href: '/tools/readiness-test', description: 'Test your scaling readiness' },
      ]
    },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
        <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-xl' 
          : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-neural-50/30 via-transparent to-quantum-50/30 pointer-events-none" />
        
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Revolutionary Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-neural-500 via-quantum-500 to-cyber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110">
                <Zap className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              {/* Animated ring */}
              <div className="absolute inset-0 w-12 h-12 border-2 border-neural-300/50 rounded-xl animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Glow effect */}
              <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-neural-400/30 to-quantum-400/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-display font-bold bg-gradient-to-r from-neural-600 via-quantum-600 to-cyber-600 bg-clip-text text-transparent">
                ScaleMate
              </h1>
              <p className="text-xs text-gray-500 font-mono tracking-wider">
                AI-POWERED SCALING
              </p>
            </div>
          </Link>

          {/* Revolutionary Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.submenu && item.submenu.some(sub => pathname === sub.href))
              const hasSubmenu = item.submenu && item.submenu.length > 0
              
              return (
                <div 
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => hasSubmenu && setActiveDropdown(item.name)}
                  onMouseLeave={() => hasSubmenu && setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`relative flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 group ${
                      isActive
                        ? 'text-neural-600 bg-gradient-to-r from-neural-50 to-quantum-50 shadow-sm border border-neural-100'
                        : 'text-gray-700 hover:text-neural-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-neural-50'
                    }`}
                  >
                    {item.name}
                    {hasSubmenu && (
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    )}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-neural-500 to-quantum-500 rounded-full" />
                    )}
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {hasSubmenu && activeDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
                      {item.submenu!.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-4 py-3 hover:bg-gradient-to-r hover:from-neural-50 hover:to-quantum-50 transition-all duration-200 group"
                        >
                          <div className="font-medium text-gray-900 group-hover:text-neural-600 transition-colors">
                            {subItem.name}
                          </div>
                          <div className="text-sm text-gray-500 group-hover:text-neural-500 transition-colors">
                            {subItem.description}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Revolutionary CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/tools/quote-calculator">
              <Button 
                variant="outline" 
                size="sm"
                className="border-neural-300/50 text-neural-600 hover:bg-gradient-to-r hover:from-neural-50 hover:to-quantum-50 hover:border-neural-400 transition-all duration-300 backdrop-blur-sm"
              >
                Get Quote
              </Button>
            </Link>
            <Link href="/tools/readiness-test">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-neural-500 via-quantum-500 to-cyber-500 hover:from-neural-600 hover:via-quantum-600 hover:to-cyber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Start Free Test
              </Button>
            </Link>
          </div>

          {/* Revolutionary Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-neural-50 hover:to-quantum-50 transition-all duration-300 hover:scale-110"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
            ) : (
              <Menu className="w-6 h-6 transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Revolutionary Mobile Navigation */}
        <div 
          className={`md:hidden transition-all duration-500 overflow-hidden ${
            isMobileMenuOpen 
              ? 'max-h-screen opacity-100 pb-6' 
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-2xl mt-4 p-6">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.submenu && item.submenu.some(sub => pathname === sub.href))
                const hasSubmenu = item.submenu && item.submenu.length > 0
                
                return (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => !hasSubmenu && setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isActive
                          ? 'text-neural-600 bg-gradient-to-r from-neural-50 to-quantum-50 shadow-sm'
                          : 'text-gray-700 hover:text-neural-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-neural-50'
                      }`}
                    >
                      <span>{item.name}</span>
                      {hasSubmenu && <ChevronDown className="w-4 h-4" />}
                    </Link>
                    
                    {/* Mobile Submenu */}
                    {hasSubmenu && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.submenu!.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-neural-600 hover:bg-neural-50 transition-all duration-200"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
            
            <div className="mt-6 pt-6 border-t border-gray-200/50 space-y-3">
              <Link href="/tools/quote-calculator" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-neural-300/50 text-neural-600 hover:bg-gradient-to-r hover:from-neural-50 hover:to-quantum-50"
                >
                  Get Quote
                </Button>
              </Link>
              <Link href="/tools/readiness-test" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-neural-500 via-quantum-500 to-cyber-500 text-white shadow-lg"
                >
                  Start Free Test
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 