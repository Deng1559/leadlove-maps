import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { SecurityValidator, sanitizeError } from '@/lib/security/validation';
import { checkApiRateLimit } from '@/lib/security/rate-limiting';
import { z } from 'zod';

// GDPR Compliance and Data Privacy API
// Handles data export, deletion, consent management, and privacy controls

interface DataExportRequest {
  includePersonalData: boolean;
  includeLeadData: boolean;
  includeFeedbackData: boolean;
  includeUsageData: boolean;
  format: 'json' | 'csv';
}

interface ConsentUpdate {
  marketing_emails: boolean;
  analytics_tracking: boolean;
  data_processing: boolean;
  third_party_sharing: boolean;
}

// Validation schemas
const exportRequestSchema = z.object({
  includePersonalData: z.boolean().default(true),
  includeLeadData: z.boolean().default(true),
  includeFeedbackData: z.boolean().default(true),
  includeUsageData: z.boolean().default(false),
  format: z.enum(['json', 'csv']).default('json')
});

const consentUpdateSchema = z.object({
  marketing_emails: z.boolean().optional(),
  analytics_tracking: z.boolean().optional(),
  data_processing: z.boolean().optional(),
  third_party_sharing: z.boolean().optional()
});

const deletionRequestSchema = z.object({
  confirmDeletion: z.literal(true),
  reason: z.string().max(500).transform(SecurityValidator.sanitizeText).optional(),
  deleteLeadData: z.boolean().default(true),
  deleteFeedbackData: z.boolean().default(true),
  deleteApiKeys: z.boolean().default(true)
});

// POST /api/user/privacy - Handle privacy requests (export, deletion, consent updates)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (!action || !['export', 'delete', 'consent'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: export, delete, or consent' },
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
    
    // Rate limiting (stricter for privacy operations)
    const rateLimitResult = await checkApiRateLimit(
      user.id,
      `/api/user/privacy/${action}`,
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
    
    const body = await request.json();
    
    switch (action) {
      case 'export':
        return await handleDataExport(supabase, user.id, body, request, rateLimitResult.headers);
      
      case 'delete':
        return await handleDataDeletion(supabase, user.id, body, request, rateLimitResult.headers);
      
      case 'consent':
        return await handleConsentUpdate(supabase, user.id, body, request, rateLimitResult.headers);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Privacy request error:', error);
    return NextResponse.json(
      sanitizeError(error),
      { status: 500 }
    );
  }
}

// GET /api/user/privacy - Get user's privacy settings and data summary
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
      '/api/user/privacy',
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
    
    // Get user's privacy settings and data summary
    const [
      userProfile,
      leadDataCount,
      feedbackCount,
      apiKeyCount,
      usageCount
    ] = await Promise.all([
      supabase.from('users').select('*').eq('auth_id', user.id).single(),
      supabase.from('enriched_leads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('feedback_responses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('user_api_keys').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('usage_tracking').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    ]);
    
    const dataSummary = {
      personal_data: {
        profile_exists: !!userProfile.data,
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
      },
      stored_data_counts: {
        enriched_leads: leadDataCount.count || 0,
        feedback_responses: feedbackCount.count || 0,
        api_keys: apiKeyCount.count || 0,
        usage_records: usageCount.count || 0
      },
      privacy_settings: {
        marketing_emails: userProfile.data?.marketing_consent || false,
        analytics_tracking: userProfile.data?.analytics_consent || false,
        data_processing: userProfile.data?.processing_consent || true,
        third_party_sharing: userProfile.data?.sharing_consent || false
      },
      rights_information: {
        data_export: 'You can request a complete export of your personal data',
        data_deletion: 'You can request deletion of your account and all associated data',
        data_portability: 'Exported data is provided in machine-readable formats',
        consent_withdrawal: 'You can withdraw consent for data processing at any time',
        data_rectification: 'Contact support to correct or update your personal data'
      }
    };
    
    return NextResponse.json({
      success: true,
      user_id: user.id,
      data_summary: dataSummary,
      gdpr_compliance: {
        data_controller: 'LeadLove Maps',
        contact_email: 'privacy@leadlove.app',
        data_retention_policy: '7 years for business data, immediate deletion upon request',
        legal_basis: 'Legitimate business interest and user consent'
      }
    }, {
      headers: rateLimitResult.headers
    });
    
  } catch (error) {
    console.error('Get privacy info error:', error);
    return NextResponse.json(
      sanitizeError(error),
      { status: 500 }
    );
  }
}

// Handle data export request
async function handleDataExport(
  supabase: any,
  userId: string,
  body: any,
  request: NextRequest,
  headers: Record<string, string>
): Promise<NextResponse> {
  const validation = exportRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      sanitizeError(validation.error),
      { status: 400 }
    );
  }
  
  const { includePersonalData, includeLeadData, includeFeedbackData, includeUsageData, format } = validation.data;
  
  const exportData: any = {
    export_metadata: {
      requested_at: new Date().toISOString(),
      user_id: userId,
      format: format,
      includes: {
        personal_data: includePersonalData,
        lead_data: includeLeadData,
        feedback_data: includeFeedbackData,
        usage_data: includeUsageData
      }
    }
  };
  
  try {
    // Personal data
    if (includePersonalData) {
      const { data: profile } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();
      
      exportData.personal_data = {
        user_profile: profile.user,
        extended_profile: userProfile,
        consent_records: {
          marketing_emails: userProfile?.marketing_consent,
          analytics_tracking: userProfile?.analytics_consent,
          data_processing: userProfile?.processing_consent,
          third_party_sharing: userProfile?.sharing_consent
        }
      };
    }
    
    // Lead data
    if (includeLeadData) {
      const { data: leads } = await supabase
        .from('enriched_leads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      exportData.lead_data = leads || [];
    }
    
    // Feedback data
    if (includeFeedbackData) {
      const { data: feedback } = await supabase
        .from('feedback_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      exportData.feedback_data = feedback || [];
    }
    
    // Usage data
    if (includeUsageData) {
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      exportData.usage_data = usage || [];
    }
    
    // Log the export request
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_event_type: 'data_export_requested',
      p_severity: 'medium',
      p_description: `User requested data export in ${format} format`,
      p_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent'),
      p_endpoint: '/api/user/privacy?action=export',
      p_additional_data: { format, includes: validation.data }
    });
    
    return NextResponse.json({
      success: true,
      export_data: exportData,
      export_completed_at: new Date().toISOString(),
      data_retention_notice: 'This data export contains personal information. Please store securely and delete when no longer needed.',
      format: format
    }, { headers });
    
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// Handle data deletion request
async function handleDataDeletion(
  supabase: any,
  userId: string,
  body: any,
  request: NextRequest,
  headers: Record<string, string>
): Promise<NextResponse> {
  const validation = deletionRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      sanitizeError(validation.error),
      { status: 400 }
    );
  }
  
  const { confirmDeletion, reason, deleteLeadData, deleteFeedbackData, deleteApiKeys } = validation.data;
  
  if (!confirmDeletion) {
    return NextResponse.json(
      { error: 'Deletion must be explicitly confirmed' },
      { status: 400 }
    );
  }
  
  try {
    const deletionResults = {
      lead_data: 0,
      feedback_data: 0,
      api_keys: 0,
      user_profile: false
    };
    
    // Delete lead data
    if (deleteLeadData) {
      const { count } = await supabase
        .from('enriched_leads')
        .delete()
        .eq('user_id', userId)
        .select('id', { count: 'exact', head: true });
      deletionResults.lead_data = count || 0;
    }
    
    // Delete feedback data
    if (deleteFeedbackData) {
      const { count } = await supabase
        .from('feedback_responses')
        .delete()
        .eq('user_id', userId)
        .select('id', { count: 'exact', head: true });
      deletionResults.feedback_data = count || 0;
    }
    
    // Delete API keys
    if (deleteApiKeys) {
      const { count } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', userId)
        .select('id', { count: 'exact', head: true });
      deletionResults.api_keys = count || 0;
    }
    
    // Delete user profile (this will cascade to other user-related data)
    const { error: profileDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('auth_id', userId);
    
    deletionResults.user_profile = !profileDeleteError;
    
    // Log the deletion request
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_event_type: 'data_deletion_requested',
      p_severity: 'high',
      p_description: `User requested account deletion. Reason: ${reason || 'No reason provided'}`,
      p_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent'),
      p_endpoint: '/api/user/privacy?action=delete',
      p_additional_data: { 
        reason,
        deleted_counts: deletionResults,
        delete_lead_data: deleteLeadData,
        delete_feedback_data: deleteFeedbackData,
        delete_api_keys: deleteApiKeys
      }
    });
    
    return NextResponse.json({
      success: true,
      deletion_completed: true,
      deletion_results: deletionResults,
      message: 'Your data has been deleted successfully. You will need to create a new account to use our services again.',
      deleted_at: new Date().toISOString()
    }, { headers });
    
  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}

// Handle consent updates
async function handleConsentUpdate(
  supabase: any,
  userId: string,
  body: any,
  request: NextRequest,
  headers: Record<string, string>
): Promise<NextResponse> {
  const validation = consentUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      sanitizeError(validation.error),
      { status: 400 }
    );
  }
  
  const consentUpdates = validation.data;
  
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (consentUpdates.marketing_emails !== undefined) {
      updateData.marketing_consent = consentUpdates.marketing_emails;
    }
    if (consentUpdates.analytics_tracking !== undefined) {
      updateData.analytics_consent = consentUpdates.analytics_tracking;
    }
    if (consentUpdates.data_processing !== undefined) {
      updateData.processing_consent = consentUpdates.data_processing;
    }
    if (consentUpdates.third_party_sharing !== undefined) {
      updateData.sharing_consent = consentUpdates.third_party_sharing;
    }
    
    // Update user consent preferences
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('auth_id', userId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    // Log consent changes
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_event_type: 'consent_updated',
      p_severity: 'medium',
      p_description: 'User updated privacy consent preferences',
      p_ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1',
      p_user_agent: request.headers.get('user-agent'),
      p_endpoint: '/api/user/privacy?action=consent',
      p_additional_data: { consent_changes: consentUpdates }
    });
    
    return NextResponse.json({
      success: true,
      updated_consent: {
        marketing_emails: updatedProfile.marketing_consent,
        analytics_tracking: updatedProfile.analytics_consent,
        data_processing: updatedProfile.processing_consent,
        third_party_sharing: updatedProfile.sharing_consent
      },
      updated_at: updateData.updated_at,
      message: 'Privacy preferences updated successfully'
    }, { headers });
    
  } catch (error) {
    console.error('Consent update error:', error);
    return NextResponse.json(
      sanitizeError(error),
      { status: 500 }
    );
  }
}