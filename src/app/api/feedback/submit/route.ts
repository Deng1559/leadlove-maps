import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Types for feedback submission
interface FeedbackSubmissionRequest {
  // Lead identification
  enrichedLeadId?: string;
  snovCampaignId?: string;
  batchId?: string;
  businessName?: string; // For cases where lead ID isn't available
  
  // Campaign outcomes
  emailSent?: boolean;
  emailDelivered?: boolean;
  emailOpened?: boolean;
  emailReplied?: boolean;
  repliedPositively?: boolean;
  
  // Conversion tracking
  meetingScheduled?: boolean;
  dealClosed?: boolean;
  dealValue?: number;
  
  // Quality ratings (1-5)
  responseQuality?: number;
  leadQualityRating?: number;
  
  // Additional feedback
  feedbackNotes?: string;
  responseDate?: string;
  feedbackSource?: 'manual' | 'snov_webhook' | 'api';
}

interface BulkFeedbackRequest {
  feedbacks: FeedbackSubmissionRequest[];
  campaignId?: string;
}

// Validate feedback data
function validateFeedback(feedback: FeedbackSubmissionRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Must have at least one way to identify the lead
  if (!feedback.enrichedLeadId && !feedback.snovCampaignId && !feedback.batchId && !feedback.businessName) {
    errors.push('Must provide at least one of: enrichedLeadId, snovCampaignId, batchId, or businessName');
  }
  
  // Rating validations
  if (feedback.responseQuality !== undefined && (feedback.responseQuality < 1 || feedback.responseQuality > 5)) {
    errors.push('responseQuality must be between 1 and 5');
  }
  
  if (feedback.leadQualityRating !== undefined && (feedback.leadQualityRating < 1 || feedback.leadQualityRating > 5)) {
    errors.push('leadQualityRating must be between 1 and 5');
  }
  
  // Deal value validation
  if (feedback.dealValue !== undefined && feedback.dealValue < 0) {
    errors.push('dealValue must be non-negative');
  }
  
  return { isValid: errors.length === 0, errors };
}

// Find matching lead in database
async function findMatchingLead(
  supabase: any, 
  userId: string, 
  feedback: FeedbackSubmissionRequest
): Promise<string | null> {
  
  // Direct lead ID match
  if (feedback.enrichedLeadId) {
    const { data: lead } = await supabase
      .from('enriched_leads')
      .select('id')
      .eq('id', feedback.enrichedLeadId)
      .eq('user_id', userId)
      .single();
    
    return lead?.id || null;
  }
  
  // Match by batch ID and business name
  if (feedback.batchId && feedback.businessName) {
    const { data: lead } = await supabase
      .from('enriched_leads')
      .select('id')
      .eq('batch_id', feedback.batchId)
      .eq('user_id', userId)
      .ilike('business_name', `%${feedback.businessName}%`)
      .limit(1)
      .single();
    
    return lead?.id || null;
  }
  
  // Match by business name (fuzzy search within recent leads)
  if (feedback.businessName) {
    const { data: lead } = await supabase
      .from('enriched_leads')
      .select('id')
      .eq('user_id', userId)
      .ilike('business_name', `%${feedback.businessName}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return lead?.id || null;
  }
  
  return null;
}

// POST /api/feedback/submit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's bulk feedback or single feedback
    const isBulk = 'feedbacks' in body;
    const feedbacks: FeedbackSubmissionRequest[] = isBulk ? body.feedbacks : [body];
    
    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json(
        { error: 'No feedback data provided' },
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
    
    // Validate all feedback entries
    const validationResults = feedbacks.map((feedback, index) => ({
      index,
      ...validateFeedback(feedback)
    }));
    
    const invalidFeedbacks = validationResults.filter(result => !result.isValid);
    
    if (invalidFeedbacks.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid feedback data',
          details: invalidFeedbacks.map(result => ({
            index: result.index,
            errors: result.errors
          }))
        },
        { status: 400 }
      );
    }
    
    // Process each feedback
    const processedFeedbacks = [];
    const errors = [];
    
    for (let i = 0; i < feedbacks.length; i++) {
      const feedback = feedbacks[i];
      
      try {
        // Find matching lead
        const leadId = await findMatchingLead(supabase, user.id, feedback);
        
        // Find matching campaign if provided
        let campaignId = null;
        if (feedback.snovCampaignId) {
          const { data: campaign } = await supabase
            .from('snov_campaigns')
            .select('id')
            .eq('snov_campaign_id', feedback.snovCampaignId)
            .eq('user_id', user.id)
            .single();
          
          campaignId = campaign?.id || null;
        }
        
        // Prepare feedback record
        const feedbackRecord = {
          user_id: user.id,
          enriched_lead_id: leadId,
          snov_campaign_id: campaignId,
          
          // Campaign outcomes
          email_sent: feedback.emailSent || false,
          email_delivered: feedback.emailDelivered || false,
          email_opened: feedback.emailOpened || false,
          email_replied: feedback.emailReplied || false,
          replied_positively: feedback.repliedPositively || false,
          
          // Conversion tracking
          meeting_scheduled: feedback.meetingScheduled || false,
          deal_closed: feedback.dealClosed || false,
          deal_value: feedback.dealValue || null,
          
          // Quality ratings
          response_quality: feedback.responseQuality || null,
          lead_quality_rating: feedback.leadQualityRating || null,
          
          // Additional info
          feedback_notes: feedback.feedbackNotes || null,
          response_date: feedback.responseDate ? new Date(feedback.responseDate).toISOString() : null,
          feedback_source: feedback.feedbackSource || 'manual'
        };
        
        // Insert feedback
        const { data: insertedFeedback, error: insertError } = await supabase
          .from('feedback_responses')
          .insert(feedbackRecord)
          .select()
          .single();
        
        if (insertError) {
          errors.push({
            index: i,
            error: `Failed to save feedback: ${insertError.message}`,
            feedback: feedback
          });
        } else {
          processedFeedbacks.push({
            index: i,
            feedback_id: insertedFeedback.id,
            lead_id: leadId,
            campaign_id: campaignId,
            matched_lead: !!leadId,
            matched_campaign: !!campaignId
          });
        }
        
      } catch (processingError) {
        errors.push({
          index: i,
          error: processingError instanceof Error ? processingError.message : 'Unknown processing error',
          feedback: feedback
        });
      }
    }
    
    // Update campaign statistics if bulk feedback for a campaign
    if (isBulk && body.campaignId) {
      try {
        const campaignFeedbacks = processedFeedbacks.filter(pf => pf.campaign_id);
        
        if (campaignFeedbacks.length > 0) {
          // Aggregate statistics
          const emailsSent = feedbacks.filter(f => f.emailSent).length;
          const emailsOpened = feedbacks.filter(f => f.emailOpened).length;
          const emailsReplied = feedbacks.filter(f => f.emailReplied).length;
          const conversions = feedbacks.filter(f => f.dealClosed).length;
          
          // Update campaign record
          await supabase
            .from('snov_campaigns')
            .update({
              emails_sent: emailsSent,
              emails_opened: emailsOpened,
              emails_replied: emailsReplied,
              conversions: conversions,
              updated_at: new Date().toISOString()
            })
            .eq('id', body.campaignId)
            .eq('user_id', user.id);
        }
      } catch (campaignUpdateError) {
        console.warn('Failed to update campaign statistics:', campaignUpdateError);
        // Don't fail the request for this
      }
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      processed_count: processedFeedbacks.length,
      error_count: errors.length,
      results: {
        processed: processedFeedbacks,
        errors: errors
      },
      statistics: {
        total_submissions: feedbacks.length,
        successful_submissions: processedFeedbacks.length,
        leads_matched: processedFeedbacks.filter(pf => pf.matched_lead).length,
        campaigns_matched: processedFeedbacks.filter(pf => pf.matched_campaign).length,
        conversion_rate: feedbacks.length > 0 ? 
          (feedbacks.filter(f => f.dealClosed).length / feedbacks.length * 100).toFixed(1) + '%' : '0%'
      }
    });
    
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/feedback/submit - Get feedback statistics or history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const campaignId = searchParams.get('campaignId');
    const batchId = searchParams.get('batchId');
    const statistics = searchParams.get('statistics') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (statistics) {
      // Return overall feedback statistics
      const { data: feedbacks, error: statsError } = await supabase
        .from('feedback_responses')
        .select(`
          email_sent,
          email_delivered,
          email_opened,
          email_replied,
          replied_positively,
          meeting_scheduled,
          deal_closed,
          deal_value,
          response_quality,
          lead_quality_rating,
          created_at
        `)
        .eq('user_id', user.id);
      
      if (statsError) {
        return NextResponse.json(
          { error: 'Failed to fetch statistics' },
          { status: 500 }
        );
      }
      
      const stats = {
        total_feedback_entries: feedbacks?.length || 0,
        email_performance: {
          emails_sent: feedbacks?.filter(f => f.email_sent).length || 0,
          emails_delivered: feedbacks?.filter(f => f.email_delivered).length || 0,
          emails_opened: feedbacks?.filter(f => f.email_opened).length || 0,
          emails_replied: feedbacks?.filter(f => f.email_replied).length || 0,
          positive_replies: feedbacks?.filter(f => f.replied_positively).length || 0
        },
        conversion_metrics: {
          meetings_scheduled: feedbacks?.filter(f => f.meeting_scheduled).length || 0,
          deals_closed: feedbacks?.filter(f => f.deal_closed).length || 0,
          total_deal_value: feedbacks?.reduce((sum, f) => sum + (f.deal_value || 0), 0) || 0,
          avg_deal_value: 0
        },
        quality_ratings: {
          avg_response_quality: 0,
          avg_lead_quality: 0,
          total_rated_responses: feedbacks?.filter(f => f.response_quality).length || 0,
          total_rated_leads: feedbacks?.filter(f => f.lead_quality_rating).length || 0
        }
      };
      
      // Calculate averages
      if (stats.conversion_metrics.deals_closed > 0) {
        stats.conversion_metrics.avg_deal_value = 
          stats.conversion_metrics.total_deal_value / stats.conversion_metrics.deals_closed;
      }
      
      if (stats.quality_ratings.total_rated_responses > 0) {
        stats.quality_ratings.avg_response_quality = 
          (feedbacks?.filter(f => f.response_quality)
            .reduce((sum, f) => sum + f.response_quality!, 0) || 0) / stats.quality_ratings.total_rated_responses;
      }
      
      if (stats.quality_ratings.total_rated_leads > 0) {
        stats.quality_ratings.avg_lead_quality = 
          (feedbacks?.filter(f => f.lead_quality_rating)
            .reduce((sum, f) => sum + f.lead_quality_rating!, 0) || 0) / stats.quality_ratings.total_rated_leads;
      }
      
      return NextResponse.json(stats);
    }
    
    // Build query based on filters
    let query = supabase
      .from('feedback_responses')
      .select(`
        *,
        enriched_leads:enriched_lead_id (
          business_name,
          batch_id,
          risk_tag,
          lead_quality_score
        ),
        snov_campaigns:snov_campaign_id (
          campaign_name,
          campaign_status
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Apply filters
    if (leadId) {
      query = query.eq('enriched_lead_id', leadId);
    }
    
    if (campaignId) {
      query = query.eq('snov_campaign_id', campaignId);
    }
    
    if (batchId) {
      // Need to join with enriched_leads to filter by batch_id
      query = query.not('enriched_lead_id', 'is', null);
    }
    
    const { data: feedbacks, error: fetchError } = await query;
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch feedback history' },
        { status: 500 }
      );
    }
    
    // Filter by batch_id if specified (post-query filter)
    let filteredFeedbacks = feedbacks || [];
    if (batchId) {
      filteredFeedbacks = filteredFeedbacks.filter(
        feedback => feedback.enriched_leads?.batch_id === batchId
      );
    }
    
    return NextResponse.json({
      feedbacks: filteredFeedbacks,
      total_count: filteredFeedbacks.length,
      filters_applied: {
        lead_id: leadId,
        campaign_id: campaignId,
        batch_id: batchId,
        limit: limit
      }
    });
    
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}