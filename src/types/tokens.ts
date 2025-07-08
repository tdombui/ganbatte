import { z } from 'zod'

// Zod schemas for validation
export const CreateSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  planName: z.string(),
  monthlyAmount: z.number().positive(),
  tokensPerMonth: z.number().positive(),
  milesPerToken: z.number().positive().default(100),
  customerEmail: z.string().email(),
})

export const UseTokensSchema = z.object({
  jobId: z.string().uuid(),
  tokensUsed: z.number().positive(),
  milesCovered: z.number().positive(),
  description: z.string().optional(),
})

// TypeScript interfaces
export interface EnterpriseSubscription {
  id: string
  customer_id: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  plan_name: string
  monthly_amount: number
  tokens_per_month: number
  miles_per_token: number
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
  current_period_start?: string
  current_period_end?: string
  created_at: string
  updated_at: string
}

export interface Token {
  id: string
  subscription_id: string
  job_id?: string
  tokens_used: number
  miles_covered: number
  description?: string
  used_at: string
  created_at: string
}

export interface TokenUsage {
  subscription: EnterpriseSubscription
  tokensUsed: number
  tokensRemaining: number
  jobsThisMonth: number
  totalMilesThisMonth: number
}

export interface CreateSubscriptionRequest {
  customerId: string
  planName: string
  monthlyAmount: number
  tokensPerMonth: number
  milesPerToken?: number
  customerEmail: string
}

export interface UseTokensRequest {
  jobId: string
  tokensUsed: number
  milesCovered: number
  description?: string
}

export interface CheckTokenAvailabilityResponse {
  hasEnoughTokens: boolean
  tokensNeeded: number
  tokensAvailable: number
  tokensUsed: number
  subscription?: EnterpriseSubscription
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      enterprise_subscriptions: {
        Row: EnterpriseSubscription
        Insert: Omit<EnterpriseSubscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EnterpriseSubscription, 'id' | 'created_at' | 'updated_at'>>
      }
      tokens: {
        Row: Token
        Insert: Omit<Token, 'id' | 'created_at'>
        Update: Partial<Omit<Token, 'id' | 'created_at'>>
      }
    }
  }
} 