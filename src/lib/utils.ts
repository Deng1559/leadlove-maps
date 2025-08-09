import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency from cents to dollars
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

// Format credits with proper pluralization
export function formatCredits(credits: number): string {
  return `${credits.toLocaleString()} ${credits === 1 ? 'credit' : 'credits'}`
}

// Format percentage
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return formatDate(date)
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate random ID
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

// Calculate credit cost based on tool and usage
export function calculateCreditCost(toolName: string, usage: any = {}): number {
  const baseCosts: Record<string, number> = {
    'leadlove_maps': 3,
    'email_generator': 1,
    'business_analyzer': 1,
    'competitor_analysis': 2,
    'market_research': 3,
    'review_analyzer': 1,
    'contact_enrichment': 1,
  }

  let baseCost = baseCosts[toolName] || 1

  // Apply multipliers based on usage
  if (toolName === 'leadlove_maps') {
    const resultsCount = usage.maxResults || 20
    if (resultsCount > 20) {
      baseCost = Math.ceil(baseCost * (resultsCount / 20))
    }
  }

  return baseCost
}

// Validate credit balance
export function hasEnoughCredits(available: number, required: number): boolean {
  return available >= required
}

// Get subscription tier color
export function getSubscriptionTierColor(tier: string): string {
  switch (tier) {
    case 'starter':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'growth':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'enterprise':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// Get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50'
    case 'inactive':
      return 'text-gray-600 bg-gray-50'
    case 'canceled':
      return 'text-red-600 bg-red-50'
    case 'past_due':
      return 'text-yellow-600 bg-yellow-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

// Format processing time
export function formatProcessingTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }
  
  const seconds = Math.floor(milliseconds / 1000)
  const remainingMs = milliseconds % 1000
  
  if (seconds < 60) {
    return `${seconds}.${Math.floor(remainingMs / 100)}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  return `${minutes}m ${remainingSeconds}s`
}

// Calculate success rate
export function calculateSuccessRate(total: number, successful: number): number {
  if (total === 0) return 0
  return Math.round((successful / total) * 100)
}

// Get credit tier based on usage
export function getCreditTier(creditsUsed: number): {
  tier: string
  color: string
  description: string
} {
  if (creditsUsed < 50) {
    return {
      tier: 'Beginner',
      color: 'text-green-600 bg-green-50',
      description: 'Just getting started'
    }
  }
  
  if (creditsUsed < 200) {
    return {
      tier: 'Regular',
      color: 'text-blue-600 bg-blue-50',
      description: 'Building momentum'
    }
  }
  
  if (creditsUsed < 500) {
    return {
      tier: 'Pro',
      color: 'text-purple-600 bg-purple-50',
      description: 'Power user'
    }
  }
  
  return {
    tier: 'Expert',
    color: 'text-orange-600 bg-orange-50',
    description: 'Lead generation master'
  }
}

// Environment check
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// API response handler
export function handleApiResponse<T>(response: any): {
  data: T | null
  error: string | null
  success: boolean
} {
  if (response.error) {
    return {
      data: null,
      error: response.error.message || 'An error occurred',
      success: false
    }
  }

  return {
    data: response.data,
    error: null,
    success: true
  }
}

// URL builder for API endpoints
export function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  let url = `${baseUrl}/api${endpoint}`
  
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }
  
  return url
}