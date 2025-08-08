import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { parse } from 'node-html-parser';

// Types for the enrichment process
interface EnrichmentRequest {
  batchId: string;
  leads: RawLead[];
  options?: EnrichmentOptions;
}

interface RawLead {
  business_name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
}

interface EnrichmentOptions {
  skipDomainCheck?: boolean;
  skipGoogleReviews?: boolean;
  maxConcurrent?: number;
}

interface EnrichedLead extends RawLead {
  google_rating?: number;
  review_count?: number;
  review_freshness_score?: number;
  keywords?: string[];
  business_description?: string;
  category?: string;
  domain_found: boolean;
  domain_status: 'active' | 'parked' | 'expired' | 'not_found';
  social_media_presence?: Record<string, string>;
  risk_tag: 'risky' | 'trusted' | 'opportunity';
  risk_score: number;
  risk_factors: string[];
  lead_quality_score: number;
  completeness_score: number;
}

// Domain checking utility
async function checkDomainStatus(domain: string): Promise<{ found: boolean; status: string; error?: string }> {
  if (!domain) return { found: false, status: 'not_found' };
  
  try {
    const timeout = parseInt(process.env.DOMAIN_CHECK_TIMEOUT || '5000');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'LeadLove-Bot/1.0 (+https://leadlove.app)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      // Check if it's a parked domain by looking for common parking indicators
      const fullResponse = await fetch(`https://${domain}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'LeadLove-Bot/1.0 (+https://leadlove.app)' }
      });
      
      if (fullResponse.ok) {
        const html = await fullResponse.text();
        const doc = parse(html);
        const title = doc.querySelector('title')?.text?.toLowerCase() || '';
        const body = doc.querySelector('body')?.text?.toLowerCase() || '';
        
        const parkingIndicators = [
          'domain for sale',
          'parked domain',
          'this domain may be for sale',
          'under construction',
          'coming soon',
          'domain parking'
        ];
        
        const isParked = parkingIndicators.some(indicator => 
          title.includes(indicator) || body.includes(indicator)
        );
        
        return {
          found: true,
          status: isParked ? 'parked' : 'active'
        };
      }
    }
    
    return { found: false, status: 'not_found' };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { found: false, status: 'not_found', error: 'timeout' };
    }
    return { found: false, status: 'not_found', error: error instanceof Error ? error.message : 'unknown' };
  }
}

// Google Places API integration for reviews and details
async function fetchGooglePlaceDetails(placeId: string): Promise<{
  rating?: number;
  review_count?: number;
  business_description?: string;
  category?: string;
  review_freshness_score?: number;
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !placeId) return {};
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews,types,editorial_summary&key=${apiKey}`
    );
    
    if (!response.ok) return {};
    
    const data = await response.json();
    const place = data.result;
    
    if (!place) return {};
    
    // Calculate review freshness score (1-10 based on recent review activity)
    let freshness_score = 5; // default middle score
    if (place.reviews && Array.isArray(place.reviews)) {
      const now = Date.now() / 1000;
      const recentReviews = place.reviews.filter((review: any) => 
        now - review.time < (90 * 24 * 60 * 60) // Reviews in last 90 days
      );
      freshness_score = Math.min(10, Math.max(1, Math.floor(recentReviews.length * 2)));
    }
    
    return {
      rating: place.rating,
      review_count: place.user_ratings_total || 0,
      business_description: place.editorial_summary?.overview || '',
      category: place.types?.[0] || '',
      review_freshness_score: freshness_score
    };
  } catch (error) {
    console.error('Google Places API error:', error);
    return {};
  }
}

// Extract keywords from business description and name
function extractKeywords(businessName: string, description: string = ''): string[] {
  const text = `${businessName} ${description}`.toLowerCase();
  
  // Common business keywords to extract
  const businessTerms = [
    'restaurant', 'cafe', 'bar', 'hotel', 'shop', 'store', 'service', 'repair',
    'dental', 'medical', 'law', 'legal', 'accounting', 'consulting', 'marketing',
    'design', 'construction', 'real estate', 'insurance', 'fitness', 'beauty',
    'automotive', 'retail', 'wholesale', 'manufacturing', 'technology', 'software'
  ];
  
  const keywords = businessTerms.filter(term => text.includes(term));
  
  // Add location-based keywords if present
  const locationTerms = ['local', 'downtown', 'mall', 'center', 'plaza'];
  keywords.push(...locationTerms.filter(term => text.includes(term)));
  
  return [...new Set(keywords)]; // Remove duplicates
}

// Risk assessment algorithm
function assessRisk(lead: Partial<EnrichedLead>): { risk_tag: 'risky' | 'trusted' | 'opportunity'; risk_score: number; risk_factors: string[] } {
  const factors: string[] = [];
  let riskScore = 0.5; // Start with neutral risk
  
  // Domain factors
  if (!lead.domain_found) {
    factors.push('No website found');
    riskScore += 0.2;
  } else if (lead.domain_status === 'parked') {
    factors.push('Parked domain');
    riskScore += 0.15;
  }
  
  // Google Reviews factors
  if (!lead.google_rating || lead.google_rating < 3.0) {
    factors.push('Low or missing Google rating');
    riskScore += 0.1;
  }
  
  if (!lead.review_count || lead.review_count < 5) {
    factors.push('Few customer reviews');
    riskScore += 0.1;
  }
  
  // Contact information factors
  if (!lead.email && !lead.phone) {
    factors.push('Missing contact information');
    riskScore += 0.15;
  }
  
  // Data completeness factor
  if (lead.completeness_score && lead.completeness_score < 0.5) {
    factors.push('Incomplete business information');
    riskScore += 0.1;
  }
  
  // Positive factors (reduce risk)
  if (lead.google_rating && lead.google_rating >= 4.0) {
    riskScore -= 0.1;
  }
  
  if (lead.review_count && lead.review_count >= 20) {
    riskScore -= 0.1;
  }
  
  if (lead.domain_found && lead.domain_status === 'active') {
    riskScore -= 0.1;
  }
  
  // Clamp risk score between 0 and 1
  riskScore = Math.max(0, Math.min(1, riskScore));
  
  // Determine risk tag
  let risk_tag: 'risky' | 'trusted' | 'opportunity';
  if (riskScore > 0.7) {
    risk_tag = 'risky';
  } else if (riskScore < 0.3) {
    risk_tag = 'trusted';
  } else {
    risk_tag = 'opportunity';
  }
  
  return { risk_tag, risk_score: riskScore, risk_factors: factors };
}

// Calculate data completeness score
function calculateCompleteness(lead: Partial<EnrichedLead>): number {
  const fields = [
    'business_name', 'address', 'phone', 'email', 'website',
    'google_rating', 'review_count', 'business_description', 'category'
  ];
  
  let presentFields = 0;
  fields.forEach(field => {
    if (lead[field as keyof typeof lead] && lead[field as keyof typeof lead] !== '') {
      presentFields++;
    }
  });
  
  return presentFields / fields.length;
}

// Calculate lead quality score using the database function logic
function calculateLeadQuality(lead: EnrichedLead): number {
  const domainBonus = lead.domain_found ? 0.2 : 0;
  const ratingScore = lead.google_rating ? (lead.google_rating / 5.0) * 0.25 : 0;
  const reviewScore = lead.review_count ? Math.min(lead.review_count / 100.0, 1.0) * 0.15 : 0;
  const completenessScore = lead.completeness_score * 0.3;
  const riskPenalty = lead.risk_score * 0.1;
  
  const qualityScore = completenessScore + domainBonus + ratingScore + reviewScore - riskPenalty;
  return Math.max(0.0, Math.min(1.0, qualityScore));
}

// Main enrichment function for a single lead
async function enrichLead(rawLead: RawLead, options: EnrichmentOptions = {}): Promise<EnrichedLead> {
  // Initialize enriched lead with raw data
  const enriched: Partial<EnrichedLead> = { ...rawLead };
  
  // Domain checking
  if (!options.skipDomainCheck && rawLead.website) {
    try {
      const domain = rawLead.website.replace(/^https?:\/\//, '').split('/')[0];
      const domainCheck = await checkDomainStatus(domain);
      enriched.domain_found = domainCheck.found;
      enriched.domain_status = domainCheck.status as any;
    } catch (error) {
      enriched.domain_found = false;
      enriched.domain_status = 'not_found';
    }
  } else {
    enriched.domain_found = !!rawLead.website;
    enriched.domain_status = rawLead.website ? 'active' : 'not_found';
  }
  
  // Google Places details
  if (!options.skipGoogleReviews && rawLead.place_id) {
    const placeDetails = await fetchGooglePlaceDetails(rawLead.place_id);
    Object.assign(enriched, placeDetails);
  }
  
  // Keyword extraction
  enriched.keywords = extractKeywords(
    rawLead.business_name,
    enriched.business_description
  );
  
  // Calculate completeness
  enriched.completeness_score = calculateCompleteness(enriched);
  
  // Risk assessment
  const riskAssessment = assessRisk(enriched);
  enriched.risk_tag = riskAssessment.risk_tag;
  enriched.risk_score = riskAssessment.risk_score;
  enriched.risk_factors = riskAssessment.risk_factors;
  
  // Social media placeholder (could be enhanced with actual social media detection)
  enriched.social_media_presence = {};
  
  // Calculate final lead quality score
  enriched.lead_quality_score = calculateLeadQuality(enriched as EnrichedLead);
  
  return enriched as EnrichedLead;
}

// POST /api/enrichment/process
export async function POST(request: NextRequest) {
  try {
    const body: EnrichmentRequest = await request.json();
    const { batchId, leads, options = {} } = body;
    
    if (!batchId || !leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId and leads array' },
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
    
    // Process enrichment with concurrency control
    const maxConcurrent = options.maxConcurrent || 
      parseInt(process.env.ENRICHMENT_MAX_CONCURRENT || '5');
    
    const processedLeads: EnrichedLead[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    
    // Process leads in batches
    for (let i = 0; i < leads.length; i += maxConcurrent) {
      const batch = leads.slice(i, i + maxConcurrent);
      const promises = batch.map(async (lead, batchIndex) => {
        const leadIndex = i + batchIndex;
        try {
          const enriched = await enrichLead(lead, options);
          return { index: leadIndex, result: enriched };
        } catch (error) {
          return { 
            index: leadIndex, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, batchIndex) => {
        if (result.status === 'fulfilled') {
          if ('result' in result.value) {
            processedLeads.push(result.value.result);
          } else if ('error' in result.value) {
            errors.push({
              index: result.value.index,
              error: result.value.error
            });
          }
        } else {
          errors.push({
            index: i + batchIndex,
            error: result.reason?.message || 'Processing failed'
          });
        }
      });
    }
    
    // Save enriched leads to database
    const leadRecords = processedLeads.map(lead => ({
      user_id: user.id,
      batch_id: batchId,
      
      // Basic info
      business_name: lead.business_name,
      address: lead.address,
      phone: lead.phone,
      email: lead.email,
      website: lead.website,
      latitude: lead.latitude,
      longitude: lead.longitude,
      place_id: lead.place_id,
      
      // Enriched data
      google_rating: lead.google_rating,
      review_count: lead.review_count,
      review_freshness_score: lead.review_freshness_score,
      keywords: lead.keywords,
      business_description: lead.business_description,
      category: lead.category,
      
      // Domain analysis
      domain_found: lead.domain_found,
      domain_status: lead.domain_status,
      social_media_presence: lead.social_media_presence || {},
      
      // Risk and quality
      risk_tag: lead.risk_tag,
      risk_score: lead.risk_score,
      risk_factors: lead.risk_factors,
      lead_quality_score: lead.lead_quality_score,
      completeness_score: lead.completeness_score,
      
      // Status
      enrichment_status: 'completed',
      enrichment_started_at: new Date().toISOString(),
      enrichment_completed_at: new Date().toISOString()
    }));
    
    if (leadRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('enriched_leads')
        .insert(leadRecords);
      
      if (insertError) {
        console.error('Database insert error:', insertError);
        return NextResponse.json(
          { 
            error: 'Failed to save enriched leads',
            details: insertError.message
          },
          { status: 500 }
        );
      }
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      batch_id: batchId,
      processed_count: processedLeads.length,
      error_count: errors.length,
      results: {
        processed_leads: processedLeads,
        errors: errors
      },
      statistics: {
        risky_count: processedLeads.filter(l => l.risk_tag === 'risky').length,
        trusted_count: processedLeads.filter(l => l.risk_tag === 'trusted').length,
        opportunity_count: processedLeads.filter(l => l.risk_tag === 'opportunity').length,
        avg_quality_score: processedLeads.reduce((sum, l) => sum + l.lead_quality_score, 0) / processedLeads.length || 0,
        domain_found_count: processedLeads.filter(l => l.domain_found).length
      }
    });
    
  } catch (error) {
    console.error('Enrichment process error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/enrichment/process - Get enrichment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    
    if (!batchId) {
      return NextResponse.json(
        { error: 'Missing batchId parameter' },
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
    
    // Get batch status
    const { data: leads, error } = await supabase
      .from('enriched_leads')
      .select('enrichment_status, risk_tag, lead_quality_score')
      .eq('batch_id', batchId)
      .eq('user_id', user.id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch batch status' },
        { status: 500 }
      );
    }
    
    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }
    
    const statistics = {
      total_count: leads.length,
      completed_count: leads.filter(l => l.enrichment_status === 'completed').length,
      failed_count: leads.filter(l => l.enrichment_status === 'failed').length,
      risky_count: leads.filter(l => l.risk_tag === 'risky').length,
      trusted_count: leads.filter(l => l.risk_tag === 'trusted').length,
      opportunity_count: leads.filter(l => l.risk_tag === 'opportunity').length,
      avg_quality_score: leads.reduce((sum, l) => sum + (l.lead_quality_score || 0), 0) / leads.length
    };
    
    return NextResponse.json({
      batch_id: batchId,
      status: statistics.completed_count === statistics.total_count ? 'completed' : 
              statistics.failed_count === statistics.total_count ? 'failed' : 'processing',
      statistics
    });
    
  } catch (error) {
    console.error('Get enrichment status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}