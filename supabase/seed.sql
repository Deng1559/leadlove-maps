-- Seed data for LeadLove Maps Credit System
-- This file contains sample data for development and testing

-- Sample users (these will be created when users sign up via Supabase Auth)
-- The auth_id will be populated automatically when users register

-- Sample credit packages (additional to the defaults in migration)
INSERT INTO public.credit_packages (name, description, credits_included, price_cents, is_subscription, is_active) VALUES
('Trial Pack', 'Free trial with 10 credits', 10, 0, FALSE, TRUE),
('Starter Pack', 'Perfect for small businesses', 25, 750, FALSE, TRUE),
('Business Pack', 'For growing agencies', 100, 2500, FALSE, TRUE);

-- Update tool configurations for scaled pricing
UPDATE public.tool_configurations 
SET credits_per_use = 3 
WHERE tool_name = 'leadlove_maps';

UPDATE public.tool_configurations 
SET credits_per_use = 1 
WHERE tool_name = 'email_generator';

-- Add more tool configurations for future features
INSERT INTO public.tool_configurations (tool_name, credits_per_use, description, max_results_per_use) VALUES
('competitor_analysis', 2, 'Analyze competitors in target market', 10),
('market_research', 3, 'Local market research and trends', 15),
('review_analyzer', 1, 'Analyze business reviews for insights', 1),
('contact_enrichment', 1, 'Enrich business contact information', 1);

-- Sample webhook endpoints configuration for different environments
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  webhook_url TEXT NOT NULL,
  api_key TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.webhook_configs (environment, webhook_url, is_active) VALUES
('development', 'http://localhost:5678/webhook/leadlove-credit-system', TRUE),
('staging', 'https://staging-n8n.your-domain.com/webhook/leadlove-credit-system', FALSE),
('production', 'https://n8n.your-domain.com/webhook/leadlove-credit-system', FALSE);

-- Sample subscription tiers with scaled pricing
UPDATE public.credit_packages 
SET 
  price_cents = 1000,  -- $10/month instead of $20
  description = 'Starter tier - Perfect for testing and small projects'
WHERE name = 'Starter Monthly';

UPDATE public.credit_packages 
SET 
  price_cents = 3500,  -- $35/month instead of $70  
  credits_included = 350,  -- Reduced from 500
  description = 'Growth tier - For expanding businesses'
WHERE name = 'Growth Monthly';

UPDATE public.credit_packages 
SET 
  price_cents = 12500,  -- $125/month instead of $250
  credits_included = 1500,  -- Reduced from 2000
  description = 'Enterprise tier - For agencies and high-volume users'
WHERE name = 'Enterprise Monthly';

-- Create a function to initialize new users with trial credits
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert user record
  INSERT INTO public.users (auth_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  RETURNING id INTO new_user_id;
  
  -- Give new user trial credits (10 free credits)
  INSERT INTO public.user_credits (user_id, credits_available, credits_purchased)
  VALUES (new_user_id, 10, 0);
  
  -- Record the trial credit transaction
  INSERT INTO public.credit_transactions (
    user_id, transaction_type, credits_amount, description
  ) VALUES (
    new_user_id, 'bonus', 10, 'Welcome bonus - 10 free trial credits'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically set up new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample usage data for testing
-- This will be populated as users interact with the system

-- Create a function to simulate usage for testing
CREATE OR REPLACE FUNCTION public.simulate_usage_test_data()
RETURNS VOID AS $$
DECLARE
  test_user_id UUID;
BEGIN
  -- This function can be called manually in development to create test data
  -- Get first user ID (if any exist)
  SELECT id INTO test_user_id FROM public.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Add some test usage data
    INSERT INTO public.usage_tracking (
      user_id, tool_name, credits_consumed, search_query, results_count, 
      processing_time_ms, success, metadata
    ) VALUES 
    (test_user_id, 'leadlove_maps', 3, 'restaurants Miami for digital marketing', 18, 45000, TRUE, '{"businessType": "restaurants", "location": "Miami"}'),
    (test_user_id, 'email_generator', 1, 'Generate follow-up sequence', 5, 12000, TRUE, '{"sequenceType": "follow-up"}'),
    (test_user_id, 'business_analyzer', 1, 'Analyze Tony''s Italian Bistro', 1, 8000, TRUE, '{"businessName": "Tony''s Italian Bistro"}');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy credit balance checking
CREATE OR REPLACE VIEW public.user_credit_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.subscription_status,
  uc.credits_available,
  uc.credits_used,
  uc.credits_purchased,
  uc.last_refill_date,
  s.credits_per_month as subscription_credits,
  s.status as subscription_active
FROM public.users u
LEFT JOIN public.user_credits uc ON u.id = uc.user_id
LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status = 'active';

-- Grant access to the view
GRANT SELECT ON public.user_credit_summary TO authenticated;

-- Create a function to get user usage statistics
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_credits_used', COALESCE(SUM(credits_consumed), 0),
    'total_searches', COUNT(*),
    'success_rate', ROUND(
      (COUNT(*) FILTER (WHERE success = TRUE)::numeric / 
       GREATEST(COUNT(*), 1) * 100), 2
    ),
    'avg_processing_time_ms', ROUND(AVG(processing_time_ms)),
    'tools_used', json_agg(DISTINCT tool_name),
    'last_used', MAX(created_at)
  ) INTO stats
  FROM public.usage_tracking
  WHERE user_id = user_uuid;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_webhook_configs_environment ON public.webhook_configs(environment);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_active ON public.webhook_configs(is_active);

-- RLS policies for new tables
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

-- Allow read access to webhook configs for authenticated users (they need this for frontend integration)
CREATE POLICY webhook_configs_select ON public.webhook_configs FOR SELECT TO authenticated USING (TRUE);