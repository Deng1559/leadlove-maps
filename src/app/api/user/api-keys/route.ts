import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { UserApiKeyManager, SupportedServices } from '@/lib/security/user-api-keys';
import { SecurityValidator, sanitizeError } from '@/lib/security/validation';
import { checkApiRateLimit } from '@/lib/security/rate-limiting';
import { z } from 'zod';

// Validation schemas
const storeApiKeySchema = z.object({
  service: z.enum(['google', 'snov', 'openai', 'stripe', 'custom']),
  keyName: z.string().min(1).max(50).transform(SecurityValidator.sanitizeText),
  value: z.string().min(10).max(1000),
  expiresAt: z.string().datetime().optional()
});

const testApiKeySchema = z.object({
  service: z.enum(['google', 'snov', 'openai', 'stripe', 'custom']),
  keyName: z.string().min(1).max(50).transform(SecurityValidator.sanitizeText).optional()
});

// POST /api/user/api-keys - Store new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Rate limiting
    const rateLimitResult = await checkApiRateLimit(
      user.id,
      '/api/user/api-keys',
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1'
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }
    
    // Validate input
    const body = await request.json();
    const validation = storeApiKeySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        sanitizeError(validation.error),
        { status: 400 }
      );
    }
    
    const { service, keyName, value, expiresAt } = validation.data;
    
    // Initialize API key manager
    const keyManager = new UserApiKeyManager();
    
    // Store the API key
    const result = await keyManager.storeApiKey(user.id, {
      service,
      key_name: keyName,
      value,
      expires_at: expiresAt ? new Date(expiresAt) : undefined
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    // Log security event
    await supabase.rpc('log_security_event', {
      p_user_id: user.id,
      p_event_type: 'api_key_stored',
      p_severity: 'low',
      p_description: `User stored ${service} API key: ${keyName}`,
      p_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent'),
      p_endpoint: '/api/user/api-keys',
      p_additional_data: { service, key_name: keyName }
    });
    
    return NextResponse.json({
      success: true,
      keyId: result.keyId,
      service,
      keyName,
      message: 'API key stored successfully'
    }, {
      headers: rateLimitResult.headers
    });
    
  } catch (error) {
    console.error('Store API key error:', error);
    return NextResponse.json(
      sanitizeError(error),
      { status: 500 }
    );
  }
}

// GET /api/user/api-keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Rate limiting
    const rateLimitResult = await checkApiRateLimit(
      user.id,
      '/api/user/api-keys',
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1'
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }
    
    const keyManager = new UserApiKeyManager();
    const result = await keyManager.listApiKeys(user.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    // Add service information to each key
    const enrichedKeys = (result.keys || []).map(key => ({
      ...key,
      service_name: getServiceDisplayName(key.service),
      is_expired: key.expires_at ? new Date(key.expires_at) < new Date() : false
    }));
    
    return NextResponse.json({
      success: true,
      keys: enrichedKeys,
      supported_services: Object.values(SupportedServices).map(service => ({
        value: service,
        name: getServiceDisplayName(service),
        description: getServiceDescription(service)
      }))
    }, {
      headers: rateLimitResult.headers
    });
    
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      sanitizeError(error),
      { status: 500 }
    );
  }
}

// PUT /api/user/api-keys - Test API key
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Rate limiting (more restrictive for testing)
    const rateLimitResult = await checkApiRateLimit(
      user.id,
      '/api/user/api-keys/test',
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1'
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }
    
    // Validate input
    const body = await request.json();
    const validation = testApiKeySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        sanitizeError(validation.error),
        { status: 400 }
      );
    }
    
    const { service, keyName = 'default' } = validation.data;
    
    const keyManager = new UserApiKeyManager();
    const result = await keyManager.testApiKey(user.id, service, keyName);
    
    // Log security event
    await supabase.rpc('log_security_event', {
      p_user_id: user.id,
      p_event_type: 'api_key_tested',
      p_severity: 'low',
      p_description: `User tested ${service} API key: ${keyName} - ${result.success ? 'success' : 'failed'}`,
      p_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent'),
      p_endpoint: '/api/user/api-keys',
      p_additional_data: { service, key_name: keyName, test_result: result.success }
    });
    
    return NextResponse.json({
      success: result.success,
      service,
      keyName,
      error: result.error,
      details: result.details,
      tested_at: new Date().toISOString()
    }, {
      headers: rateLimitResult.headers
    });
    
  } catch (error) {
    console.error('Test API key error:', error);
    return NextResponse.json(
      sanitizeError(error),
      { status: 500 }
    );
  }
}

// DELETE /api/user/api-keys - Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');
    
    if (!keyId || !SecurityValidator.isValidUuid(keyId)) {
      return NextResponse.json(
        { error: 'Invalid key ID' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Rate limiting
    const rateLimitResult = await checkApiRateLimit(
      user.id,
      '/api/user/api-keys',
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1'
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }
    
    const keyManager = new UserApiKeyManager();
    const result = await keyManager.deleteApiKey(user.id, keyId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    // Log security event
    await supabase.rpc('log_security_event', {
      p_user_id: user.id,
      p_event_type: 'api_key_deleted',
      p_severity: 'medium',
      p_description: `User deleted API key: ${keyId}`,
      p_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent'),
      p_endpoint: '/api/user/api-keys',
      p_additional_data: { key_id: keyId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    }, {
      headers: rateLimitResult.headers
    });
    
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      sanitizeError(error),
      { status: 500 }
    );
  }
}

// Helper functions
function getServiceDisplayName(service: string): string {
  switch (service) {
    case SupportedServices.GOOGLE: return 'Google APIs';
    case SupportedServices.SNOV: return 'Snov.io';
    case SupportedServices.OPENAI: return 'OpenAI';
    case SupportedServices.STRIPE: return 'Stripe';
    case SupportedServices.CUSTOM: return 'Custom Service';
    default: return service;
  }
}

function getServiceDescription(service: string): string {
  switch (service) {
    case SupportedServices.GOOGLE: return 'Google Sheets, Drive, and Places API access';
    case SupportedServices.SNOV: return 'Email verification and campaign management';
    case SupportedServices.OPENAI: return 'AI-powered content generation';
    case SupportedServices.STRIPE: return 'Payment processing (for advanced features)';
    case SupportedServices.CUSTOM: return 'Custom third-party service integration';
    default: return 'Third-party service integration';
  }
}