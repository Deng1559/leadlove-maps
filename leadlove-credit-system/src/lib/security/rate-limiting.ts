import { createClient } from '@/lib/supabase/client';

// Rate limiting implementation using Supabase as storage
// In production, consider using Redis/Upstash for better performance

interface RateLimit {
  requests: number;
  windowStart: number;
}

interface RateLimitConfig {
  requests: number;    // Maximum requests allowed
  window: number;      // Time window in seconds
  blockDuration?: number; // How long to block after limit exceeded (seconds)
}

// Rate limiting configurations by endpoint type
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints
  'auth': { requests: 5, window: 300 }, // 5 requests per 5 minutes
  
  // Lead generation and enrichment (resource-intensive)
  'enrichment': { requests: 10, window: 300, blockDuration: 600 }, // 10 requests per 5 min, block 10 min
  'leadlove': { requests: 20, window: 300, blockDuration: 300 }, // 20 requests per 5 min, block 5 min
  
  // Export operations (moderate usage)
  'export': { requests: 30, window: 300, blockDuration: 180 }, // 30 requests per 5 min, block 3 min
  
  // Feedback and community features (high frequency allowed)
  'feedback': { requests: 100, window: 300 }, // 100 requests per 5 minutes
  'roadmap': { requests: 50, window: 300 },  // 50 requests per 5 minutes
  
  // Admin operations
  'admin': { requests: 200, window: 300 }, // 200 requests per 5 minutes
  
  // Default limit for other endpoints
  'default': { requests: 60, window: 300 }, // 60 requests per 5 minutes (1 per 5 seconds)
};

export class RateLimiter {
  private supabase;
  
  constructor() {
    this.supabase = createClient();
  }
  
  // Check if request should be rate limited
  async checkRateLimit(
    userId: string, 
    endpoint: string, 
    userAgent: string = 'unknown',
    ip: string = '127.0.0.1'
  ): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
    
    // Determine endpoint category for rate limiting
    const category = this.getEndpointCategory(endpoint);
    const config = RATE_LIMITS[category] || RATE_LIMITS.default;
    
    const now = Date.now();
    const windowStart = now - (config.window * 1000);
    
    try {
      // Get or create rate limit record
      const rateLimitKey = `${userId}:${category}`;
      
      // Check current usage from database
      const { data: rateLimitData, error } = await this.supabase
        .from('user_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('endpoint_category', category)
        .eq('window_start', Math.floor(windowStart / 1000))
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // Database error, allow request but log
        console.error('Rate limit check failed:', error);
        return { allowed: true };
      }
      
      if (!rateLimitData) {
        // First request in this window
        await this.createRateLimitRecord(userId, category, endpoint, userAgent, ip, now);
        return { 
          allowed: true, 
          resetTime: now + (config.window * 1000),
          remaining: config.requests - 1
        };
      }
      
      // Check if blocked
      if (rateLimitData.blocked_until && rateLimitData.blocked_until > now) {
        return { 
          allowed: false, 
          resetTime: rateLimitData.blocked_until 
        };
      }
      
      // Check current window requests
      if (rateLimitData.request_count >= config.requests) {
        // Rate limit exceeded
        const blockUntil = config.blockDuration ? now + (config.blockDuration * 1000) : null;
        
        // Update record with block status
        if (blockUntil) {
          await this.supabase
            .from('user_rate_limits')
            .update({ 
              blocked_until: blockUntil,
              violations_count: (rateLimitData.violations_count || 0) + 1,
              last_violation_at: new Date(now).toISOString()
            })
            .eq('id', rateLimitData.id);
        }
        
        return { 
          allowed: false, 
          resetTime: blockUntil || (now + (config.window * 1000))
        };
      }
      
      // Increment request count
      await this.supabase
        .from('user_rate_limits')
        .update({ 
          request_count: rateLimitData.request_count + 1,
          last_request_at: new Date(now).toISOString(),
          last_endpoint: endpoint,
          last_user_agent: userAgent,
          last_ip: ip
        })
        .eq('id', rateLimitData.id);
      
      return { 
        allowed: true,
        resetTime: now + (config.window * 1000),
        remaining: config.requests - rateLimitData.request_count - 1
      };
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow request but log for investigation
      return { allowed: true };
    }
  }
  
  // Create new rate limit record
  private async createRateLimitRecord(
    userId: string,
    category: string,
    endpoint: string,
    userAgent: string,
    ip: string,
    timestamp: number
  ): Promise<void> {
    const config = RATE_LIMITS[category] || RATE_LIMITS.default;
    const windowStart = Math.floor((timestamp - (config.window * 1000)) / 1000);
    
    await this.supabase
      .from('user_rate_limits')
      .insert({
        user_id: userId,
        endpoint_category: category,
        window_start: windowStart,
        request_count: 1,
        first_request_at: new Date(timestamp).toISOString(),
        last_request_at: new Date(timestamp).toISOString(),
        last_endpoint: endpoint,
        last_user_agent: userAgent,
        last_ip: ip,
        max_requests: config.requests,
        window_seconds: config.window
      });
  }
  
  // Determine endpoint category for rate limiting
  private getEndpointCategory(endpoint: string): string {
    if (endpoint.includes('/auth/')) return 'auth';
    if (endpoint.includes('/enrichment/')) return 'enrichment';
    if (endpoint.includes('/leadlove/')) return 'leadlove';
    if (endpoint.includes('/google-sheets/') || endpoint.includes('/google-drive/') || endpoint.includes('/snov/')) return 'export';
    if (endpoint.includes('/feedback/')) return 'feedback';
    if (endpoint.includes('/roadmap/')) return 'roadmap';
    if (endpoint.includes('/admin/')) return 'admin';
    
    return 'default';
  }
  
  // Clean up old rate limit records
  async cleanupOldRecords(): Promise<void> {
    const cutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
    
    try {
      await this.supabase
        .from('user_rate_limits')
        .delete()
        .lt('created_at', cutoff.toISOString());
    } catch (error) {
      console.error('Failed to cleanup rate limit records:', error);
    }
  }
  
  // Get user's current rate limit status
  async getUserRateStatus(userId: string): Promise<Record<string, any>> {
    try {
      const { data: records, error } = await this.supabase
        .from('user_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to get rate status:', error);
        return {};
      }
      
      const status: Record<string, any> = {};
      
      for (const record of records || []) {
        const config = RATE_LIMITS[record.endpoint_category] || RATE_LIMITS.default;
        const resetTime = new Date(record.created_at).getTime() + (config.window * 1000);
        
        status[record.endpoint_category] = {
          requests_made: record.request_count,
          max_requests: record.max_requests,
          remaining: Math.max(0, record.max_requests - record.request_count),
          reset_time: resetTime,
          blocked_until: record.blocked_until,
          violations: record.violations_count || 0
        };
      }
      
      return status;
    } catch (error) {
      console.error('Rate status error:', error);
      return {};
    }
  }
}

// Utility function for middleware
export async function checkApiRateLimit(
  userId: string, 
  endpoint: string,
  userAgent?: string,
  ip?: string
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  
  const rateLimiter = new RateLimiter();
  const result = await rateLimiter.checkRateLimit(userId, endpoint, userAgent, ip);
  
  const headers: Record<string, string> = {};
  
  if (result.resetTime) {
    headers['X-RateLimit-Reset'] = Math.ceil(result.resetTime / 1000).toString();
  }
  
  if (result.remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = result.remaining.toString();
  }
  
  const category = rateLimiter['getEndpointCategory'](endpoint);
  const config = RATE_LIMITS[category] || RATE_LIMITS.default;
  headers['X-RateLimit-Limit'] = config.requests.toString();
  
  if (!result.allowed) {
    headers['Retry-After'] = Math.ceil(((result.resetTime || Date.now()) - Date.now()) / 1000).toString();
  }
  
  return { allowed: result.allowed, headers };
}

// Create rate limiting table if it doesn't exist (for development)
export const createRateLimitingTable = `
  CREATE TABLE IF NOT EXISTS user_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint_category TEXT NOT NULL,
    window_start BIGINT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    max_requests INTEGER NOT NULL,
    window_seconds INTEGER NOT NULL,
    first_request_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_request_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_endpoint TEXT,
    last_user_agent TEXT,
    last_ip INET,
    blocked_until BIGINT,
    violations_count INTEGER DEFAULT 0,
    last_violation_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, endpoint_category, window_start)
  );
  
  CREATE INDEX IF NOT EXISTS idx_rate_limits_user_category ON user_rate_limits(user_id, endpoint_category);
  CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON user_rate_limits(created_at);
  CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON user_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;
  
  -- Enable RLS
  ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;
  
  -- Users can only see their own rate limits
  CREATE POLICY "Users can view own rate limits" ON user_rate_limits
    FOR SELECT USING (auth.uid() = user_id);
`;