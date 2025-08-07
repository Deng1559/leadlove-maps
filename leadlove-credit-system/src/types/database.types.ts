// TypeScript types for LeadLove Maps Credit System database
// Auto-generated types based on Supabase schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string | null
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_status: 'inactive' | 'active' | 'canceled' | 'past_due'
          subscription_tier: 'starter' | 'growth' | 'enterprise'
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id?: string | null
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'inactive' | 'active' | 'canceled' | 'past_due'
          subscription_tier?: 'starter' | 'growth' | 'enterprise'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string | null
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'inactive' | 'active' | 'canceled' | 'past_due'
          subscription_tier?: 'starter' | 'growth' | 'enterprise'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      credit_packages: {
        Row: {
          id: string
          name: string
          description: string | null
          credits_included: number
          price_cents: number
          stripe_price_id: string | null
          is_subscription: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          credits_included: number
          price_cents: number
          stripe_price_id?: string | null
          is_subscription?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          credits_included?: number
          price_cents?: number
          stripe_price_id?: string | null
          is_subscription?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          credits_available: number
          credits_used: number
          credits_purchased: number
          last_refill_date: string | null
          subscription_credits_per_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_available?: number
          credits_used?: number
          credits_purchased?: number
          last_refill_date?: string | null
          subscription_credits_per_month?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_available?: number
          credits_used?: number
          credits_purchased?: number
          last_refill_date?: string | null
          subscription_credits_per_month?: number
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'purchase' | 'usage' | 'refill' | 'bonus' | 'refund'
          credits_amount: number
          description: string | null
          reference_id: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: 'purchase' | 'usage' | 'refill' | 'bonus' | 'refund'
          credits_amount: number
          description?: string | null
          reference_id?: string | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: 'purchase' | 'usage' | 'refill' | 'bonus' | 'refund'
          credits_amount?: number
          description?: string | null
          reference_id?: string | null
          metadata?: any | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          status: 'active' | 'canceled' | 'past_due' | 'paused'
          current_period_start: string | null
          current_period_end: string | null
          credits_per_month: number
          price_cents: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          status: 'active' | 'canceled' | 'past_due' | 'paused'
          current_period_start?: string | null
          current_period_end?: string | null
          credits_per_month?: number
          price_cents: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'paused'
          current_period_start?: string | null
          current_period_end?: string | null
          credits_per_month?: number
          price_cents?: number
          created_at?: string
          updated_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          tool_name: string
          credits_consumed: number
          workflow_id: string | null
          search_query: string | null
          results_count: number | null
          processing_time_ms: number | null
          success: boolean
          error_message: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_name: string
          credits_consumed: number
          workflow_id?: string | null
          search_query?: string | null
          results_count?: number | null
          processing_time_ms?: number | null
          success?: boolean
          error_message?: string | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_name?: string
          credits_consumed?: number
          workflow_id?: string | null
          search_query?: string | null
          results_count?: number | null
          processing_time_ms?: number | null
          success?: boolean
          error_message?: string | null
          metadata?: any | null
          created_at?: string
        }
      }
      tool_configurations: {
        Row: {
          id: string
          tool_name: string
          credits_per_use: number
          description: string | null
          is_active: boolean
          max_results_per_use: number
          rate_limit_per_hour: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tool_name: string
          credits_per_use: number
          description?: string | null
          is_active?: boolean
          max_results_per_use?: number
          rate_limit_per_hour?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tool_name?: string
          credits_per_use?: number
          description?: string | null
          is_active?: boolean
          max_results_per_use?: number
          rate_limit_per_hour?: number
          created_at?: string
          updated_at?: string
        }
      }
      webhook_configs: {
        Row: {
          id: string
          environment: 'development' | 'staging' | 'production'
          webhook_url: string
          api_key: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          environment: 'development' | 'staging' | 'production'
          webhook_url: string
          api_key?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          environment?: 'development' | 'staging' | 'production'
          webhook_url?: string
          api_key?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      user_credit_summary: {
        Row: {
          user_id: string | null
          email: string | null
          full_name: string | null
          subscription_status: string | null
          credits_available: number | null
          credits_used: number | null
          credits_purchased: number | null
          last_refill_date: string | null
          subscription_credits: number | null
          subscription_active: string | null
        }
      }
    }
    Functions: {
      get_user_credit_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      consume_credits: {
        Args: {
          user_uuid: string
          credits_to_consume: number
          tool_used: string
          reference_id?: string
          metadata?: any
        }
        Returns: boolean
      }
      add_credits: {
        Args: {
          user_uuid: string
          credits_to_add: number
          transaction_type?: string
          description?: string
          reference_id?: string
        }
        Returns: boolean
      }
      refill_subscription_credits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_usage_stats: {
        Args: { user_uuid: string }
        Returns: any
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: any
      }
    }
  }
}

// Additional TypeScript interfaces for application use
export interface User {
  id: string
  auth_id: string | null
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_status: 'inactive' | 'active' | 'canceled' | 'past_due'
  subscription_tier: 'starter' | 'growth' | 'enterprise'
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface CreditPackage {
  id: string
  name: string
  description: string | null
  credits_included: number
  price_cents: number
  stripe_price_id: string | null
  is_subscription: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserCredits {
  id: string
  user_id: string
  credits_available: number
  credits_used: number
  credits_purchased: number
  last_refill_date: string | null
  subscription_credits_per_month: number
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: 'purchase' | 'usage' | 'refill' | 'bonus' | 'refund'
  credits_amount: number
  description: string | null
  reference_id: string | null
  metadata: any | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  status: 'active' | 'canceled' | 'past_due' | 'paused'
  current_period_start: string | null
  current_period_end: string | null
  credits_per_month: number
  price_cents: number
  created_at: string
  updated_at: string
}

export interface UsageTracking {
  id: string
  user_id: string
  tool_name: string
  credits_consumed: number
  workflow_id: string | null
  search_query: string | null
  results_count: number | null
  processing_time_ms: number | null
  success: boolean
  error_message: string | null
  metadata: any | null
  created_at: string
}

export interface ToolConfiguration {
  id: string
  tool_name: string
  credits_per_use: number
  description: string | null
  is_active: boolean
  max_results_per_use: number
  rate_limit_per_hour: number
  created_at: string
  updated_at: string
}

export interface WebhookConfig {
  id: string
  environment: 'development' | 'staging' | 'production'
  webhook_url: string
  api_key: string | null
  is_active: boolean
  created_at: string
}

export interface UserCreditSummary {
  user_id: string | null
  email: string | null
  full_name: string | null
  subscription_status: string | null
  credits_available: number | null
  credits_used: number | null
  credits_purchased: number | null
  last_refill_date: string | null
  subscription_credits: number | null
  subscription_active: string | null
}

// Usage statistics interface
export interface UserUsageStats {
  total_credits_used: number
  total_searches: number
  success_rate: number
  avg_processing_time_ms: number
  tools_used: string[]
  last_used: string | null
}

// Frontend-specific types
export interface LeadLoveSearchRequest {
  businessType: string
  location: string
  serviceOffering?: string
  countryCode?: string
  maxResults?: number
  userId?: string
  userName?: string
}

export interface LeadLoveSearchResponse {
  success: boolean
  workflowId?: string
  message?: string
  estimatedTime?: string
  error?: string
  creditsConsumed?: number
  creditsRemaining?: number
}

export interface CreditPurchaseRequest {
  packageId: string
  paymentMethodId?: string
}

export interface SubscriptionRequest {
  priceId: string
  paymentMethodId?: string
}