-- Create credit system tables for LeadLove Maps
-- Migration: 001_create_credit_system.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'canceled', 'past_due')),
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit packages table
CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  credits_included INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT UNIQUE,
  is_subscription BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  credits_available INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  last_refill_date TIMESTAMP WITH TIME ZONE,
  subscription_credits_per_month INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refill', 'bonus', 'refund')),
  credits_amount INTEGER NOT NULL,
  description TEXT,
  reference_id TEXT, -- For linking to Stripe payments, workflow executions, etc.
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  credits_per_month INTEGER DEFAULT 100,
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL, -- 'leadlove_maps', 'email_generator', etc.
  credits_consumed INTEGER NOT NULL,
  workflow_id TEXT, -- Reference to n8n workflow
  search_query TEXT,
  results_count INTEGER,
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool configurations table
CREATE TABLE public.tool_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_name TEXT UNIQUE NOT NULL,
  credits_per_use INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  max_results_per_use INTEGER DEFAULT 20,
  rate_limit_per_hour INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default credit packages
INSERT INTO public.credit_packages (name, description, credits_included, price_cents, stripe_price_id, is_subscription) VALUES
('Starter Monthly', 'Monthly subscription with 100 credits', 100, 1000, 'price_starter_monthly', TRUE),
('Growth Monthly', 'Monthly subscription with 500 credits', 500, 4000, 'price_growth_monthly', TRUE),
('Enterprise Monthly', 'Monthly subscription with 2000 credits', 2000, 15000, 'price_enterprise_monthly', TRUE),
('Credit Pack 50', 'One-time purchase of 50 credits', 50, 1500, 'price_credits_50', FALSE),
('Credit Pack 200', 'One-time purchase of 200 credits', 200, 5000, 'price_credits_200', FALSE);

-- Insert default tool configurations
INSERT INTO public.tool_configurations (tool_name, credits_per_use, description, max_results_per_use) VALUES
('leadlove_maps', 5, 'Google Maps lead generation with AI email sequences', 20),
('email_generator', 2, 'AI-powered email sequence generation', 5),
('business_analyzer', 1, 'Individual business analysis and scoring', 1);

-- Create indexes for better performance
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_tool ON public.usage_tracking(tool_name);
CREATE INDEX idx_usage_tracking_created ON public.usage_tracking(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- User credits policies
CREATE POLICY user_credits_select_own ON public.user_credits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = user_credits.user_id AND users.auth_id = auth.uid())
);

-- Credit transactions policies
CREATE POLICY credit_transactions_select_own ON public.credit_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = credit_transactions.user_id AND users.auth_id = auth.uid())
);

-- Subscriptions policies
CREATE POLICY subscriptions_select_own ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = subscriptions.user_id AND users.auth_id = auth.uid())
);

-- Usage tracking policies
CREATE POLICY usage_tracking_select_own ON public.usage_tracking FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = usage_tracking.user_id AND users.auth_id = auth.uid())
);

-- Functions for credit management
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT credits_available INTO balance
  FROM public.user_credits
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.consume_credits(
  user_uuid UUID,
  credits_to_consume INTEGER,
  tool_used TEXT,
  reference_id TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  success BOOLEAN := FALSE;
BEGIN
  -- Get current balance
  SELECT credits_available INTO current_balance
  FROM public.user_credits
  WHERE user_id = user_uuid;
  
  -- Check if user has enough credits
  IF current_balance >= credits_to_consume THEN
    -- Update credits
    UPDATE public.user_credits
    SET 
      credits_available = credits_available - credits_to_consume,
      credits_used = credits_used + credits_to_consume,
      updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Record transaction
    INSERT INTO public.credit_transactions (
      user_id, transaction_type, credits_amount, description, reference_id, metadata
    ) VALUES (
      user_uuid, 'usage', -credits_to_consume, 
      'Used ' || credits_to_consume || ' credits for ' || tool_used,
      reference_id, metadata
    );
    
    success := TRUE;
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_credits(
  user_uuid UUID,
  credits_to_add INTEGER,
  transaction_type TEXT DEFAULT 'purchase',
  description TEXT DEFAULT NULL,
  reference_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update credits
  UPDATE public.user_credits
  SET 
    credits_available = credits_available + credits_to_add,
    credits_purchased = credits_purchased + credits_to_add,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, credits_available, credits_purchased)
    VALUES (user_uuid, credits_to_add, credits_to_add);
  END IF;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, transaction_type, credits_amount, description, reference_id
  ) VALUES (
    user_uuid, transaction_type, credits_to_add, 
    COALESCE(description, 'Added ' || credits_to_add || ' credits'),
    reference_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle monthly subscription credit refills
CREATE OR REPLACE FUNCTION public.refill_subscription_credits()
RETURNS INTEGER AS $$
DECLARE
  refilled_count INTEGER := 0;
  sub RECORD;
BEGIN
  FOR sub IN 
    SELECT u.id as user_id, s.credits_per_month
    FROM public.subscriptions s
    JOIN public.users u ON u.id = s.user_id
    WHERE s.status = 'active'
    AND s.current_period_start <= NOW()
    AND s.current_period_end > NOW()
  LOOP
    -- Check if already refilled this period
    IF NOT EXISTS (
      SELECT 1 FROM public.user_credits uc
      WHERE uc.user_id = sub.user_id
      AND uc.last_refill_date >= (
        SELECT current_period_start FROM public.subscriptions
        WHERE user_id = sub.user_id AND status = 'active'
      )
    ) THEN
      -- Refill credits
      UPDATE public.user_credits
      SET 
        credits_available = sub.credits_per_month,
        last_refill_date = NOW(),
        updated_at = NOW()
      WHERE user_id = sub.user_id;
      
      -- Record transaction
      INSERT INTO public.credit_transactions (
        user_id, transaction_type, credits_amount, description
      ) VALUES (
        sub.user_id, 'refill', sub.credits_per_month,
        'Monthly subscription credit refill'
      );
      
      refilled_count := refilled_count + 1;
    END IF;
  END LOOP;
  
  RETURN refilled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER user_credits_updated_at BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER credit_packages_updated_at BEFORE UPDATE ON public.credit_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER tool_configurations_updated_at BEFORE UPDATE ON public.tool_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();