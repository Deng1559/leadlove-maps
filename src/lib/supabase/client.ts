// Supabase client configuration for LeadLove Maps Credit System
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'leadlove-credit-system@1.0.0'
    }
  }
})

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to get user credits
export const getUserCredits = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to get credit balance using the database function
export const getCreditBalance = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_user_credit_balance', { user_uuid: userId })
  
  if (error) {
    console.error('Error getting credit balance:', error)
    return 0
  }
  
  return data || 0
}

// Helper function to consume credits
export const consumeCredits = async (
  userId: string, 
  creditsToConsume: number, 
  toolUsed: string,
  referenceId?: string,
  metadata?: any
): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('consume_credits', {
      user_uuid: userId,
      credits_to_consume: creditsToConsume,
      tool_used: toolUsed,
      reference_id: referenceId,
      metadata: metadata
    })
  
  if (error) {
    console.error('Error consuming credits:', error)
    return false
  }
  
  return data || false
}

// Helper function to add credits
export const addCredits = async (
  userId: string,
  creditsToAdd: number,
  transactionType: string = 'purchase',
  description?: string,
  referenceId?: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('add_credits', {
      user_uuid: userId,
      credits_to_add: creditsToAdd,
      transaction_type: transactionType,
      description: description,
      reference_id: referenceId
    })
  
  if (error) {
    console.error('Error adding credits:', error)
    return false
  }
  
  return data || false
}

// Helper function to get user usage statistics
export const getUserUsageStats = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_user_usage_stats', { user_uuid: userId })
  
  if (error) {
    console.error('Error getting usage stats:', error)
    return null
  }
  
  return data
}

// Helper function to get all credit packages
export const getCreditPackages = async () => {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true })
  
  if (error) throw error
  return data
}

// Helper function to get subscription packages
export const getSubscriptionPackages = async () => {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .eq('is_subscription', true)
    .order('price_cents', { ascending: true })
  
  if (error) throw error
  return data
}

// Helper function to get one-time credit packages
export const getOneTimeCreditPackages = async () => {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .eq('is_subscription', false)
    .order('price_cents', { ascending: true })
  
  if (error) throw error
  return data
}

// Helper function to get user transactions
export const getUserTransactions = async (userId: string, limit: number = 20) => {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// Helper function to get user subscription
export const getUserSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
  return data
}

// Helper function to get tool configurations
export const getToolConfigurations = async () => {
  const { data, error } = await supabase
    .from('tool_configurations')
    .select('*')
    .eq('is_active', true)
    .order('tool_name', { ascending: true })
  
  if (error) throw error
  return data
}

// Helper function to get tool configuration by name
export const getToolConfiguration = async (toolName: string) => {
  const { data, error } = await supabase
    .from('tool_configurations')
    .select('*')
    .eq('tool_name', toolName)
    .eq('is_active', true)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to track usage
export const trackUsage = async (
  userId: string,
  toolName: string,
  creditsConsumed: number,
  searchQuery?: string,
  resultsCount?: number,
  processingTimeMs?: number,
  success: boolean = true,
  workflowId?: string,
  errorMessage?: string,
  metadata?: any
) => {
  const { data, error } = await supabase
    .from('usage_tracking')
    .insert({
      user_id: userId,
      tool_name: toolName,
      credits_consumed: creditsConsumed,
      search_query: searchQuery,
      results_count: resultsCount,
      processing_time_ms: processingTimeMs,
      success: success,
      workflow_id: workflowId,
      error_message: errorMessage,
      metadata: metadata
    })
  
  if (error) {
    console.error('Error tracking usage:', error)
    return false
  }
  
  return true
}

// Helper function to get webhook configuration for current environment
export const getWebhookConfig = async () => {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
  
  const { data, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('environment', environment)
    .eq('is_active', true)
    .single()
  
  if (error) throw error
  return data
}

// Helper function for real-time subscriptions to user credit changes
export const subscribeToUserCredits = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`user-credits-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_credits',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

// Helper function for real-time subscriptions to user transactions
export const subscribeToUserTransactions = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`user-transactions-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'credit_transactions',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

// Export the main client
export default supabase