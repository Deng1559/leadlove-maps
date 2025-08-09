import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import axios from 'axios';
import { stringify } from 'csv-stringify/sync';

// Types for Snov.io integration
interface SnovExportRequest {
  batchId: string;
  campaignName: string;
  onlyTrustedLeads?: boolean;
  excludeRiskyLeads?: boolean;
  minQualityScore?: number;
  maxRiskScore?: number;
  verifyEmails?: boolean;
  createCampaign?: boolean;
  emailTemplate?: string;
}

interface SnovLead {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  phone?: string;
  website?: string;
  customFields?: Record<string, string>;
}

interface SnovCampaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

// Initialize Snov.io API client
class SnovAPIClient {
  private baseUrl: string;
  private apiKey: string;
  private clientId?: string;
  private clientSecret?: string;

  constructor() {
    this.baseUrl = process.env.SNOV_API_URL || 'https://api.snov.io';
    this.apiKey = process.env.SNOV_API_KEY || '';
    this.clientId = process.env.SNOV_CLIENT_ID;
    this.clientSecret = process.env.SNOV_CLIENT_SECRET;

    if (!this.apiKey) {
      throw new Error('SNOV_API_KEY environment variable not set');
    }
  }

  // Make authenticated API request
  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        ...(data && { data })
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Snov.io API error:', error.response?.data);
        throw new Error(`Snov.io API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Verify email address
  async verifyEmail(email: string): Promise<{ 
    email: string; 
    result: 'valid' | 'invalid' | 'unknown'; 
    confidence: number;
    reason?: string;
  }> {
    try {
      const response = await this.makeRequest('/v1/email-verifier/verify', 'POST', { email });
      
      return {
        email,
        result: response.result === 'valid' ? 'valid' : 
                response.result === 'invalid' ? 'invalid' : 'unknown',
        confidence: response.confidence || 0,
        reason: response.reason
      };
    } catch (error) {
      console.warn(`Email verification failed for ${email}:`, error);
      return { email, result: 'unknown', confidence: 0, reason: 'verification_failed' };
    }
  }

  // Bulk verify emails
  async verifyEmails(emails: string[]): Promise<Array<{
    email: string;
    result: 'valid' | 'invalid' | 'unknown';
    confidence: number;
    reason?: string;
  }>> {
    try {
      // Snov.io typically has batch limits, process in chunks
      const chunkSize = 100;
      const results = [];

      for (let i = 0; i < emails.length; i += chunkSize) {
        const chunk = emails.slice(i, i + chunkSize);
        
        const response = await this.makeRequest('/v1/email-verifier/verify-bulk', 'POST', {
          emails: chunk
        });

        if (response.results) {
          results.push(...response.results);
        }

        // Add delay to respect rate limits
        if (i + chunkSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error) {
      console.error('Bulk email verification failed:', error);
      // Fallback to individual verification
      return Promise.all(emails.map(email => this.verifyEmail(email)));
    }
  }

  // Create prospect list
  async createProspectList(name: string, prospects: SnovLead[]): Promise<{ listId: string; name: string }> {
    try {
      const response = await this.makeRequest('/v1/prospect-lists', 'POST', {
        name,
        prospects
      });

      return {
        listId: response.id || response.listId,
        name: response.name
      };
    } catch (error) {
      console.error('Failed to create prospect list:', error);
      throw new Error('Failed to create Snov.io prospect list');
    }
  }

  // Add prospects to existing list
  async addProspectsToList(listId: string, prospects: SnovLead[]): Promise<{ added: number }> {
    try {
      const response = await this.makeRequest(`/v1/prospect-lists/${listId}/prospects`, 'POST', {
        prospects
      });

      return {
        added: response.added || prospects.length
      };
    } catch (error) {
      console.error('Failed to add prospects to list:', error);
      throw new Error('Failed to add prospects to Snov.io list');
    }
  }

  // Create email campaign
  async createCampaign(
    name: string,
    listId: string,
    template?: string
  ): Promise<SnovCampaign> {
    try {
      const campaignData = {
        name,
        listId,
        ...(template && { template })
      };

      const response = await this.makeRequest('/v1/campaigns', 'POST', campaignData);

      return {
        id: response.id,
        name: response.name,
        status: response.status || 'draft',
        created_at: response.created_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw new Error('Failed to create Snov.io campaign');
    }
  }

  // Get account info
  async getAccountInfo(): Promise<{ 
    credits: number; 
    plan: string; 
    email_credits: number; 
    verification_credits: number;
  }> {
    try {
      const response = await this.makeRequest('/v1/account-info');
      
      return {
        credits: response.credits || 0,
        plan: response.plan || 'unknown',
        email_credits: response.email_credits || 0,
        verification_credits: response.verification_credits || 0
      };
    } catch (error) {
      console.warn('Failed to get account info:', error);
      return { credits: 0, plan: 'unknown', email_credits: 0, verification_credits: 0 };
    }
  }
}

// Convert enriched leads to Snov.io format
function convertLeadsToSnovFormat(leads: any[]): SnovLead[] {
  return leads.map(lead => {
    // Extract first name and last name from business name or use business name as company
    const businessName = lead.business_name || '';
    
    return {
      email: lead.email || '',
      firstName: '', // Could be enhanced to extract from business contact info
      lastName: '',
      company: businessName,
      position: '', // Could be inferred from business category
      phone: lead.phone || '',
      website: lead.website || '',
      customFields: {
        'Business Category': lead.category || '',
        'Google Rating': lead.google_rating ? lead.google_rating.toString() : '',
        'Review Count': lead.review_count ? lead.review_count.toString() : '0',
        'Risk Tag': lead.risk_tag || '',
        'Risk Score': lead.risk_score ? (lead.risk_score * 100).toFixed(1) + '%' : '',
        'Quality Score': lead.lead_quality_score ? (lead.lead_quality_score * 100).toFixed(1) + '%' : '',
        'Domain Status': lead.domain_status || '',
        'Address': lead.address || '',
        'Keywords': Array.isArray(lead.keywords) ? lead.keywords.join(', ') : '',
        'LeadLove Batch ID': lead.batch_id
      }
    };
  }).filter(lead => lead.email); // Only include leads with email addresses
}

// Export leads to CSV format for manual Snov.io import
function exportToCsv(leads: SnovLead[]): string {
  const csvData = leads.map(lead => ({
    'Email': lead.email,
    'First Name': lead.firstName || '',
    'Last Name': lead.lastName || '',
    'Company': lead.company || '',
    'Position': lead.position || '',
    'Phone': lead.phone || '',
    'Website': lead.website || '',
    'Business Category': lead.customFields?.['Business Category'] || '',
    'Google Rating': lead.customFields?.['Google Rating'] || '',
    'Review Count': lead.customFields?.['Review Count'] || '',
    'Risk Tag': lead.customFields?.['Risk Tag'] || '',
    'Quality Score': lead.customFields?.['Quality Score'] || '',
    'Address': lead.customFields?.['Address'] || ''
  }));

  return stringify(csvData, {
    header: true,
    columns: [
      'Email', 'First Name', 'Last Name', 'Company', 'Position', 'Phone', 'Website',
      'Business Category', 'Google Rating', 'Review Count', 'Risk Tag', 'Quality Score', 'Address'
    ]
  });
}

// POST /api/snov/export
export async function POST(request: NextRequest) {
  try {
    const body: SnovExportRequest = await request.json();
    const {
      batchId,
      campaignName,
      onlyTrustedLeads = false,
      excludeRiskyLeads = true,
      minQualityScore = 0.3,
      maxRiskScore = 0.7,
      verifyEmails = true,
      createCampaign = false,
      emailTemplate
    } = body;

    if (!batchId || !campaignName) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId and campaignName' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build query with filters
    let query = supabase
      .from('enriched_leads')
      .select('*')
      .eq('batch_id', batchId)
      .eq('user_id', user.id)
      .eq('enrichment_status', 'completed')
      .not('email', 'is', null)
      .neq('email', '');

    // Apply risk and quality filters
    if (onlyTrustedLeads) {
      query = query.eq('risk_tag', 'trusted');
    } else if (excludeRiskyLeads) {
      query = query.neq('risk_tag', 'risky');
    }

    if (minQualityScore > 0) {
      query = query.gte('lead_quality_score', minQualityScore);
    }

    if (maxRiskScore < 1) {
      query = query.lte('risk_score', maxRiskScore);
    }

    const { data: leads, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'No qualified leads found for export' },
        { status: 404 }
      );
    }

    // Initialize Snov.io client
    const snovClient = new SnovAPIClient();

    // Get account info to check credits
    const accountInfo = await snovClient.getAccountInfo();

    // Convert leads to Snov format
    const snovLeads = convertLeadsToSnovFormat(leads);

    if (snovLeads.length === 0) {
      return NextResponse.json(
        { error: 'No leads with valid email addresses found' },
        { status: 404 }
      );
    }

    let verificationResults: Array<{
      email: string;
      result: 'valid' | 'invalid' | 'unknown';
      confidence: number;
      reason?: string;
    }> = [];

    // Email verification if requested
    if (verifyEmails) {
      const emailsToVerify = snovLeads.map(lead => lead.email);
      verificationResults = await snovClient.verifyEmails(emailsToVerify);

      // Filter out invalid emails
      const validEmails = new Set(
        verificationResults
          .filter(result => result.result === 'valid' || (result.result === 'unknown' && result.confidence > 0.5))
          .map(result => result.email)
      );

      // Update snovLeads to only include verified emails
      const originalCount = snovLeads.length;
      const verifiedLeads = snovLeads.filter(lead => validEmails.has(lead.email));
      
      console.log(`Email verification: ${originalCount} → ${verifiedLeads.length} leads`);
    }

    // Create prospect list in Snov.io
    const { listId } = await snovClient.createProspectList(campaignName, snovLeads);

    let campaign: SnovCampaign | undefined;

    // Create campaign if requested
    if (createCampaign) {
      campaign = await snovClient.createCampaign(campaignName, listId, emailTemplate);
    }

    // Generate CSV export for manual use
    const csvExport = exportToCsv(snovLeads);

    // Save campaign data to database
    const { error: insertError } = await supabase
      .from('snov_campaigns')
      .insert({
        user_id: user.id,
        campaign_name: campaignName,
        snov_campaign_id: campaign?.id,
        campaign_status: campaign?.status || 'list_created',
        lead_batch_ids: [batchId],
        risk_filter: onlyTrustedLeads ? ['trusted'] : excludeRiskyLeads ? ['trusted', 'opportunity'] : ['trusted', 'opportunity', 'risky'],
        min_quality_score: minQualityScore,
        total_leads_exported: snovLeads.length,
        verified_leads_count: verifyEmails ? verificationResults.filter(r => r.result === 'valid').length : snovLeads.length,
        risky_leads_count: leads.filter(l => l.risk_tag === 'risky').length,
        exported_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to save campaign data:', insertError);
      // Don't fail the request for this
    }

    // Update leads to mark as exported to Snov
    const { error: updateError } = await supabase
      .from('enriched_leads')
      .update({
        exported_to_snov: true,
        snov_export_at: new Date().toISOString()
      })
      .eq('batch_id', batchId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update export status:', updateError);
      // Don't fail the request for this
    }

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      campaign_name: campaignName,
      snov_list_id: listId,
      snov_campaign_id: campaign?.id,
      campaign_status: campaign?.status || 'list_created',
      
      // Export statistics
      export_statistics: {
        total_qualified_leads: snovLeads.length,
        original_lead_count: leads.length,
        verified_emails: verifyEmails ? verificationResults.filter(r => r.result === 'valid').length : 'not_verified',
        invalid_emails: verifyEmails ? verificationResults.filter(r => r.result === 'invalid').length : 'not_verified',
        risky_leads_excluded: excludeRiskyLeads ? leads.filter(l => l.risk_tag === 'risky').length : 0
      },

      // Filters applied
      filters_applied: {
        only_trusted_leads: onlyTrustedLeads,
        exclude_risky_leads: excludeRiskyLeads,
        min_quality_score: minQualityScore,
        max_risk_score: maxRiskScore,
        email_verification_enabled: verifyEmails
      },

      // Account info
      snov_account: {
        remaining_credits: accountInfo.credits,
        plan: accountInfo.plan,
        email_credits: accountInfo.email_credits,
        verification_credits: accountInfo.verification_credits
      },

      // CSV export for manual import
      csv_export: csvExport,

      // Verification results if performed
      ...(verifyEmails && {
        email_verification_results: verificationResults.map(result => ({
          email: result.email,
          status: result.result,
          confidence: result.confidence,
          reason: result.reason
        }))
      }),

      export_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Snov.io export error:', error);
    return NextResponse.json(
      {
        error: 'Export to Snov.io failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/snov/export - Get campaign status or account info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const batchId = searchParams.get('batchId');
    const accountInfo = searchParams.get('accountInfo') === 'true';

    const supabase = createClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (accountInfo) {
      // Return Snov.io account information
      try {
        const snovClient = new SnovAPIClient();
        const account = await snovClient.getAccountInfo();
        
        return NextResponse.json({
          account: account,
          api_connected: true
        });
      } catch (error) {
        return NextResponse.json({
          account: null,
          api_connected: false,
          error: error instanceof Error ? error.message : 'Connection failed'
        });
      }
    }

    if (batchId) {
      // Get export status for batch
      const { data: campaigns, error } = await supabase
        .from('snov_campaigns')
        .select('*')
        .contains('lead_batch_ids', [batchId])
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch campaign status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        batch_id: batchId,
        campaigns: campaigns || [],
        has_exports: (campaigns?.length || 0) > 0
      });
    }

    if (campaignId) {
      // Get specific campaign details
      const { data: campaign, error } = await supabase
        .from('snov_campaigns')
        .select('*')
        .eq('snov_campaign_id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (error || !campaign) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        campaign: campaign
      });
    }

    return NextResponse.json(
      { error: 'Please provide campaignId, batchId, or set accountInfo=true' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get Snov info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}