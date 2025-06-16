// Core types for the ScaleMate application

export interface User {
  id: string
  email?: string
  sessionId: string
  createdAt: Date
  updatedAt: Date
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  emailNotifications: boolean
  marketingEmails: boolean
}

export interface Session {
  id: string
  userId?: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  country?: string
  city?: string
  createdAt: Date
  updatedAt: Date
  lastActivity: Date
  pageViews: PageView[]
  events: AnalyticsEvent[]
}

export interface PageView {
  id: string
  sessionId: string
  path: string
  title: string
  referrer?: string
  timestamp: Date
  timeOnPage?: number
}

export interface AnalyticsEvent {
  id: string
  sessionId: string
  eventType: string
  eventData: Record<string, any>
  timestamp: Date
}

// AI Quote Calculator Types
export interface QuoteCalculatorSession {
  id: string
  sessionId: string
  conversationId: string
  messages: QuoteMessage[]
  currentStep: QuoteStep
  businessInfo?: BusinessInfo
  requirements?: StaffingRequirements
  quote?: StaffingQuote
  status: 'active' | 'completed' | 'abandoned'
  createdAt: Date
  updatedAt: Date
}

export interface QuoteMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export type QuoteStep = 
  | 'greeting'
  | 'business_type'
  | 'role_requirements'
  | 'experience_level'
  | 'location_preference'
  | 'budget_discussion'
  | 'timeline'
  | 'generating_quote'
  | 'presenting_results'
  | 'follow_up'

export interface BusinessInfo {
  type: string
  industry: string
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  currentTeamSize?: number
  monthlyRevenue?: string
  primaryGoals: string[]
}

export interface StaffingRequirements {
  roles: RoleRequirement[]
  totalPositions: number
  startDate: string
  duration: 'temporary' | 'permanent' | 'project-based'
  workingHours: string
  timezone: string
}

export interface RoleRequirement {
  title: string
  description: string
  skills: string[]
  experienceLevel: 'entry' | 'mid' | 'senior' | 'expert'
  quantity: number
  priority: 'high' | 'medium' | 'low'
}

export interface StaffingQuote {
  id: string
  totalMonthlyCost: number
  totalAnnualCost: number
  costBreakdown: CostBreakdown[]
  recommendations: Recommendation[]
  implementationPlan: ImplementationStep[]
  savings: SavingsCalculation
  nextSteps: string[]
  validUntil: Date
}

export interface CostBreakdown {
  role: string
  quantity: number
  monthlySalary: number
  totalMonthlyCost: number
  location: string
  experienceLevel: string
}

export interface Recommendation {
  type: 'role' | 'location' | 'process' | 'tool'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
}

export interface ImplementationStep {
  phase: number
  title: string
  description: string
  duration: string
  deliverables: string[]
  dependencies?: string[]
}

export interface SavingsCalculation {
  monthlyLocalCost: number
  monthlyOffshoreCost: number
  monthlySavings: number
  annualSavings: number
  savingsPercentage: number
  breakEvenMonths: number
}

// Readiness Test Types
export interface ReadinessTestSession {
  id: string
  sessionId: string
  responses: TestResponse[]
  currentQuestion: number
  totalQuestions: number
  results?: ReadinessResults
  status: 'in_progress' | 'completed' | 'abandoned'
  createdAt: Date
  updatedAt: Date
}

export interface TestResponse {
  questionId: string
  questionText: string
  answer: string | number | string[]
  score: number
  category: ReadinessCategory
  timestamp: Date
}

export type ReadinessCategory = 
  | 'systems_processes'
  | 'team_management'
  | 'ai_knowledge'
  | 'cultural_awareness'
  | 'training_documentation'
  | 'communication'
  | 'financial_readiness'
  | 'time_management'

export interface ReadinessResults {
  overallScore: number
  categoryScores: CategoryScore[]
  readinessLevel: 'not_ready' | 'getting_started' | 'ready' | 'advanced'
  strengths: string[]
  weaknesses: string[]
  recommendations: ReadinessRecommendation[]
  nextSteps: string[]
  estimatedTimeToReady?: string
}

export interface CategoryScore {
  category: ReadinessCategory
  score: number
  maxScore: number
  percentage: number
  level: 'poor' | 'fair' | 'good' | 'excellent'
}

export interface ReadinessRecommendation {
  category: ReadinessCategory
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  resources: Resource[]
  estimatedTime: string
}

export interface Resource {
  type: 'article' | 'video' | 'tool' | 'template' | 'course'
  title: string
  url: string
  description: string
  duration?: string
}

// Blog and Content Types
export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: Author
  publishedAt: Date
  updatedAt: Date
  status: 'draft' | 'published' | 'archived'
  categories: Category[]
  tags: Tag[]
  featuredImage?: string
  seoTitle?: string
  seoDescription?: string
  readingTime: number
  views: number
}

export interface Author {
  id: string
  name: string
  email: string
  bio?: string
  avatar?: string
  socialLinks?: SocialLinks
}

export interface SocialLinks {
  twitter?: string
  linkedin?: string
  github?: string
  website?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  count: number
}

// Email and Marketing Types
export interface EmailCapture {
  id: string
  email: string
  sessionId: string
  source: 'tool_completion' | 'newsletter' | 'download' | 'consultation' | 'exit_intent'
  metadata?: Record<string, any>
  status: 'pending' | 'confirmed' | 'unsubscribed'
  createdAt: Date
  confirmedAt?: Date
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  templateId?: string
  audienceId: string
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  scheduledAt?: Date
  sentAt?: Date
  stats?: EmailStats
}

export interface EmailStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  unsubscribed: number
  bounced: number
  openRate: number
  clickRate: number
  unsubscribeRate: number
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps extends BaseComponentProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  required?: boolean
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>> 