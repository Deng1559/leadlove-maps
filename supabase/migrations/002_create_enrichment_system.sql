-- =====================================================
-- LeadLove Maps - Enrichment System Database Schema
-- Migration: 002_create_enrichment_system.sql
-- Phase: 2-4 Implementation (Data Enrichment, Snov.io, Feedback Loop)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Phase 2: Data Enrichment Tables
-- =====================================================

-- Table: enriched_leads
-- Stores enriched business data from Google Maps with AI-powered analysis
CREATE TABLE public.enriched_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Original lead generation metadata
    leadlove_workflow_id TEXT,
    generation_request_id UUID,
    batch_id UUID NOT NULL,
    
    -- Basic business information
    business_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Location data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    place_id TEXT, -- Google Places ID
    
    -- Enrichment data
    google_rating DECIMAL(2, 1),
    review_count INTEGER DEFAULT 0,
    review_freshness_score INTEGER, -- 1-10 based on recent review activity
    
    -- Business analysis
    keywords TEXT[], -- Extracted keywords from description
    business_description TEXT,
    category TEXT,
    opening_hours JSONB,
    
    -- Domain and online presence
    domain_found BOOLEAN DEFAULT false,
    domain_status TEXT, -- 'active', 'parked', 'expired', 'not_found'
    social_media_presence JSONB, -- {facebook: url, instagram: url, linkedin: url}
    
    -- AI-powered risk assessment
    risk_tag TEXT CHECK (risk_tag IN ('risky', 'trusted', 'opportunity')),
    risk_score DECIMAL(3, 2), -- 0.00 to 1.00
    risk_factors TEXT[], -- Array of identified risk factors
    
    -- Quality scoring
    lead_quality_score DECIMAL(3, 2), -- 0.00 to 1.00
    completeness_score DECIMAL(3, 2), -- Data completeness percentage
    
    -- Processing metadata
    enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'processing', 'completed', 'failed')),
    enrichment_started_at TIMESTAMP WITH TIME ZONE,
    enrichment_completed_at TIMESTAMP WITH TIME ZONE,
    enrichment_error TEXT,
    
    -- Export tracking
    exported_to_sheets BOOLEAN DEFAULT false,
    exported_to_drive BOOLEAN DEFAULT false,
    exported_to_snov BOOLEAN DEFAULT false,
    sheets_export_at TIMESTAMP WITH TIME ZONE,
    drive_export_at TIMESTAMP WITH TIME ZONE,
    snov_export_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security for enriched_leads
ALTER TABLE public.enriched_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enriched leads" ON public.enriched_leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enriched leads" ON public.enriched_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enriched leads" ON public.enriched_leads
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_enriched_leads_user_id ON public.enriched_leads(user_id);
CREATE INDEX idx_enriched_leads_batch_id ON public.enriched_leads(batch_id);
CREATE INDEX idx_enriched_leads_status ON public.enriched_leads(enrichment_status);
CREATE INDEX idx_enriched_leads_risk_tag ON public.enriched_leads(risk_tag);
CREATE INDEX idx_enriched_leads_created_at ON public.enriched_leads(created_at DESC);

-- =====================================================
-- Phase 3: Snov.io Integration Tables
-- =====================================================

-- Table: snov_campaigns
-- Tracks Snov.io campaign exports and status
CREATE TABLE public.snov_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Campaign details
    campaign_name TEXT NOT NULL,
    snov_campaign_id TEXT, -- ID from Snov.io API
    campaign_status TEXT DEFAULT 'draft' CHECK (campaign_status IN ('draft', 'active', 'paused', 'completed')),
    
    -- Lead filtering
    lead_batch_ids UUID[], -- Array of batch_ids from enriched_leads
    risk_filter TEXT[], -- Which risk tags to include
    min_quality_score DECIMAL(3, 2), -- Minimum lead quality score
    
    -- Export metadata
    total_leads_exported INTEGER DEFAULT 0,
    verified_leads_count INTEGER DEFAULT 0,
    risky_leads_count INTEGER DEFAULT 0,
    
    -- Campaign performance (filled by feedback loop)
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exported_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security for snov_campaigns
ALTER TABLE public.snov_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own snov campaigns" ON public.snov_campaigns
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_snov_campaigns_user_id ON public.snov_campaigns(user_id);
CREATE INDEX idx_snov_campaigns_status ON public.snov_campaigns(campaign_status);

-- =====================================================
-- Phase 4: Feedback Loop and Feature Voting Tables
-- =====================================================

-- Table: feedback_responses
-- Stores campaign outcome feedback for AI learning
CREATE TABLE public.feedback_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Lead tracking
    enriched_lead_id UUID REFERENCES public.enriched_leads(id) ON DELETE CASCADE,
    snov_campaign_id UUID REFERENCES public.snov_campaigns(id) ON DELETE CASCADE,
    
    -- Campaign outcome
    email_sent BOOLEAN DEFAULT false,
    email_delivered BOOLEAN DEFAULT false,
    email_opened BOOLEAN DEFAULT false,
    email_replied BOOLEAN DEFAULT false,
    replied_positively BOOLEAN DEFAULT false,
    
    -- Conversion tracking
    meeting_scheduled BOOLEAN DEFAULT false,
    deal_closed BOOLEAN DEFAULT false,
    deal_value DECIMAL(10, 2), -- Revenue generated
    
    -- Feedback details
    response_quality INTEGER CHECK (response_quality BETWEEN 1 AND 5),
    lead_quality_rating INTEGER CHECK (lead_quality_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    
    -- Metadata
    response_date TIMESTAMP WITH TIME ZONE,
    feedback_source TEXT DEFAULT 'manual' CHECK (feedback_source IN ('manual', 'snov_webhook', 'api')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security for feedback_responses
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own feedback responses" ON public.feedback_responses
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_feedback_responses_user_id ON public.feedback_responses(user_id);
CREATE INDEX idx_feedback_responses_lead_id ON public.feedback_responses(enriched_lead_id);
CREATE INDEX idx_feedback_responses_campaign_id ON public.feedback_responses(snov_campaign_id);

-- Table: feature_requests
-- User-driven feature voting system
CREATE TABLE public.feature_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Feature details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('enrichment', 'integration', 'ui', 'analytics', 'api', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Development tracking
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected')),
    estimated_effort TEXT CHECK (estimated_effort IN ('small', 'medium', 'large', 'epic')),
    target_phase INTEGER, -- Which phase this belongs to
    
    -- Voting metrics
    votes_count INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    
    -- Metadata
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public read access for feature requests (voting system)
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature requests" ON public.feature_requests
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can submit feature requests" ON public.feature_requests
    FOR INSERT TO authenticated WITH CHECK (true);

-- Table: feature_votes
-- Individual user votes on features
CREATE TABLE public.feature_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_request_id UUID NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
    
    -- Vote details
    vote_weight INTEGER DEFAULT 1, -- Future: premium users get more weight
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate votes
    UNIQUE(user_id, feature_request_id)
);

-- Row Level Security for feature_votes
ALTER TABLE public.feature_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own votes" ON public.feature_votes
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_feature_votes_user_id ON public.feature_votes(user_id);
CREATE INDEX idx_feature_votes_feature_id ON public.feature_votes(feature_request_id);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function: Update enriched_leads updated_at timestamp
CREATE OR REPLACE FUNCTION update_enriched_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_enriched_leads_updated_at
    BEFORE UPDATE ON public.enriched_leads
    FOR EACH ROW EXECUTE FUNCTION update_enriched_leads_updated_at();

-- Function: Update feature request vote counts
CREATE OR REPLACE FUNCTION update_feature_request_votes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update vote counts for the affected feature request
    UPDATE public.feature_requests 
    SET 
        votes_count = (
            SELECT COALESCE(SUM(vote_weight), 0) 
            FROM public.feature_votes 
            WHERE feature_request_id = COALESCE(NEW.feature_request_id, OLD.feature_request_id)
        ),
        unique_voters = (
            SELECT COUNT(DISTINCT user_id) 
            FROM public.feature_votes 
            WHERE feature_request_id = COALESCE(NEW.feature_request_id, OLD.feature_request_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.feature_request_id, OLD.feature_request_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_request_votes
    AFTER INSERT OR UPDATE OR DELETE ON public.feature_votes
    FOR EACH ROW EXECUTE FUNCTION update_feature_request_votes();

-- Function: Calculate lead quality score based on enrichment data
CREATE OR REPLACE FUNCTION calculate_lead_quality_score(
    p_domain_found BOOLEAN,
    p_google_rating DECIMAL,
    p_review_count INTEGER,
    p_completeness_score DECIMAL,
    p_risk_score DECIMAL
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    quality_score DECIMAL(3,2) := 0.0;
BEGIN
    -- Base score from data completeness (0-0.3)
    quality_score := quality_score + (p_completeness_score * 0.3);
    
    -- Domain presence bonus (0-0.2)
    IF p_domain_found THEN
        quality_score := quality_score + 0.2;
    END IF;
    
    -- Google rating component (0-0.25)
    IF p_google_rating IS NOT NULL AND p_google_rating > 0 THEN
        quality_score := quality_score + (p_google_rating / 5.0) * 0.25;
    END IF;
    
    -- Review count component (0-0.15)
    IF p_review_count > 0 THEN
        quality_score := quality_score + LEAST(p_review_count / 100.0, 1.0) * 0.15;
    END IF;
    
    -- Risk adjustment (subtract risk impact, 0-0.1 penalty)
    quality_score := quality_score - (p_risk_score * 0.1);
    
    -- Ensure score is between 0 and 1
    RETURN GREATEST(0.0, LEAST(1.0, quality_score));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Initial Data and Configuration
-- =====================================================

-- Insert some default feature categories
INSERT INTO public.feature_requests (title, description, category, priority, status, estimated_effort, target_phase) VALUES
('Enhanced Google Reviews Analysis', 'Analyze sentiment and keywords from Google Reviews text', 'enrichment', 'medium', 'approved', 'medium', 2),
('Slack Integration', 'Export leads and notifications to Slack channels', 'integration', 'medium', 'submitted', 'small', 3),
('Advanced Lead Scoring', 'ML-powered lead scoring based on historical conversion data', 'enrichment', 'high', 'approved', 'large', 4),
('Bulk CSV Import', 'Allow users to import existing lead lists for enrichment', 'ui', 'medium', 'submitted', 'medium', 2),
('API Rate Limiting Dashboard', 'Visual dashboard for API usage and rate limits', 'api', 'low', 'submitted', 'small', 5);

-- =====================================================
-- Views for Reporting and Analytics
-- =====================================================

-- View: Enrichment pipeline performance
CREATE VIEW public.enrichment_pipeline_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE enrichment_status = 'completed') as completed_leads,
    COUNT(*) FILTER (WHERE enrichment_status = 'failed') as failed_leads,
    AVG(lead_quality_score) FILTER (WHERE enrichment_status = 'completed') as avg_quality_score,
    AVG(EXTRACT(EPOCH FROM (enrichment_completed_at - enrichment_started_at))/60) as avg_processing_minutes
FROM public.enriched_leads 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- View: Feature request leaderboard
CREATE VIEW public.feature_request_leaderboard AS
SELECT 
    fr.id,
    fr.title,
    fr.category,
    fr.status,
    fr.votes_count,
    fr.unique_voters,
    fr.submitted_at
FROM public.feature_requests fr
WHERE fr.status IN ('submitted', 'reviewing', 'approved', 'in_progress')
ORDER BY fr.votes_count DESC, fr.submitted_at DESC;

-- Grant necessary permissions
GRANT SELECT ON public.enrichment_pipeline_stats TO authenticated;
GRANT SELECT ON public.feature_request_leaderboard TO authenticated;

-- =====================================================
-- Security Infrastructure Tables
-- =====================================================

-- Table: user_api_keys (secure storage for user's third-party API keys)
CREATE TABLE public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL CHECK (service IN ('google', 'snov', 'openai', 'stripe', 'custom')),
    key_name TEXT NOT NULL DEFAULT 'default',
    encrypted_value TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, service, key_name)
);

-- Row Level Security for user_api_keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for user_api_keys
CREATE INDEX idx_user_api_keys_user_service ON public.user_api_keys(user_id, service);
CREATE INDEX idx_user_api_keys_active ON public.user_api_keys(is_active, expires_at);

-- Table: user_rate_limits (rate limiting per user per endpoint category)
CREATE TABLE public.user_rate_limits (
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

-- Row Level Security for user_rate_limits
ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits" ON public.user_rate_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Indexes for user_rate_limits
CREATE INDEX idx_rate_limits_user_category ON public.user_rate_limits(user_id, endpoint_category);
CREATE INDEX idx_rate_limits_cleanup ON public.user_rate_limits(created_at);
CREATE INDEX idx_rate_limits_blocked ON public.user_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Security audit log table
CREATE TABLE public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'auth_failure', 'rate_limit_exceeded', 'suspicious_activity', etc.
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    endpoint TEXT,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for security_audit_log
CREATE INDEX idx_security_audit_user ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_severity ON public.security_audit_log(severity);
CREATE INDEX idx_security_audit_type ON public.security_audit_log(event_type);
CREATE INDEX idx_security_audit_created ON public.security_audit_log(created_at DESC);

-- Row Level Security for security_audit_log (admin access only in production)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- For development, allow users to see their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.security_audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- Security Functions
-- =====================================================

-- Function: Log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_endpoint TEXT DEFAULT NULL,
    p_additional_data JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        event_type,
        severity,
        description,
        ip_address,
        user_agent,
        endpoint,
        additional_data
    ) VALUES (
        p_user_id,
        p_event_type,
        p_severity,
        p_description,
        p_ip_address,
        p_user_agent,
        p_endpoint,
        p_additional_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update user_api_keys timestamp
CREATE OR REPLACE FUNCTION update_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_api_keys_updated_at
    BEFORE UPDATE ON public.user_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_user_api_keys_updated_at();

-- Function: Clean up old rate limit records (called by cron job)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_rate_limits 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user security summary
CREATE OR REPLACE FUNCTION get_user_security_summary(p_user_id UUID)
RETURNS TABLE (
    active_api_keys INTEGER,
    recent_violations INTEGER,
    last_login TIMESTAMP WITH TIME ZONE,
    risk_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.user_api_keys WHERE user_id = p_user_id AND is_active = true),
        (SELECT COUNT(*)::INTEGER FROM public.user_rate_limits WHERE user_id = p_user_id AND violations_count > 0 AND created_at > NOW() - INTERVAL '7 days'),
        (SELECT MAX(created_at) FROM public.security_audit_log WHERE user_id = p_user_id AND event_type = 'login_success'),
        CASE 
            WHEN (SELECT COUNT(*) FROM public.security_audit_log WHERE user_id = p_user_id AND severity IN ('high', 'critical') AND created_at > NOW() - INTERVAL '7 days') > 0 THEN 0.8
            WHEN (SELECT COUNT(*) FROM public.user_rate_limits WHERE user_id = p_user_id AND violations_count > 2) > 0 THEN 0.6
            ELSE 0.2
        END::DECIMAL(3,2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Migration Complete
-- =====================================================