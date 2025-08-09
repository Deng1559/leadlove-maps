// Mock data for testing

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  credits_available: 100,
  subscription_status: 'active',
  subscription_tier: 'starter',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000,
  user: {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
    },
  },
};

export const mockLeadGenerationRequest = {
  businessType: 'restaurants',
  location: 'Miami Beach, FL',
  serviceOffering: 'digital marketing',
  countryCode: 'us',
  maxResults: 20,
};

export const mockLeadGenerationResponse = {
  success: true,
  workflowId: 'wf-12345',
  results: [
    {
      name: 'Joe\'s Pizza',
      address: '123 Ocean Dr, Miami Beach, FL',
      phone: '+1-305-555-0123',
      website: 'https://joespizza.com',
      rating: 4.5,
      email: 'info@joespizza.com',
      generatedEmail: {
        subject: 'Boost Your Restaurant\'s Digital Presence',
        body: 'Hi there! We noticed Joe\'s Pizza has great reviews...',
      },
    },
    {
      name: 'Sunset Grill',
      address: '456 Collins Ave, Miami Beach, FL',
      phone: '+1-305-555-0456',
      website: 'https://sunsetgrill.com',
      rating: 4.2,
      email: 'contact@sunsetgrill.com',
      generatedEmail: {
        subject: 'Increase Your Restaurant Revenue with Digital Marketing',
        body: 'Hello! Sunset Grill looks like an amazing restaurant...',
      },
    },
  ],
  metadata: {
    processingTime: 2500,
    creditsConsumed: 3,
    creditsRemaining: 97,
    source: 'web_frontend',
    timestamp: '2024-01-01T12:00:00Z',
  },
};

export const mockUsageHistory = [
  {
    id: 'usage-1',
    user_id: 'user-123',
    tool_name: 'leadlove_maps',
    credits_consumed: 3,
    search_query: 'restaurants in Miami Beach, FL for digital marketing',
    results_count: 20,
    processing_time_ms: 2500,
    success: true,
    created_at: '2024-01-01T12:00:00Z',
    workflow_id: 'wf-12345',
    metadata: {
      businessType: 'restaurants',
      location: 'Miami Beach, FL',
      serviceOffering: 'digital marketing',
      source: 'web_frontend',
    },
  },
  {
    id: 'usage-2',
    user_id: 'user-123',
    tool_name: 'leadlove_maps',
    credits_consumed: 0,
    search_query: 'law firms in New York for voice AI automation',
    results_count: 15,
    processing_time_ms: 1800,
    success: true,
    created_at: '2024-01-01T11:00:00Z',
    workflow_id: 'wf-12346',
    metadata: {
      businessType: 'law firms',
      location: 'New York',
      serviceOffering: 'voice AI automation',
      source: 'private_api',
      isPrivateAccess: true,
    },
  },
];

export const mockCreditTransaction = {
  id: 'tx-123',
  user_id: 'user-123',
  amount: 100,
  transaction_type: 'purchase',
  description: 'Starter subscription monthly refill',
  reference_id: 'sub_123',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockStripeCustomer = {
  id: 'cus_123',
  email: 'test@example.com',
  name: 'Test User',
  metadata: {
    supabase_user_id: 'user-123',
  },
};

export const mockStripeSubscription = {
  id: 'sub_123',
  customer: 'cus_123',
  status: 'active',
  items: {
    data: [
      {
        price: {
          id: 'price_starter',
          unit_amount: 1000, // $10.00
          recurring: {
            interval: 'month',
          },
        },
      },
    ],
  },
  current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
};

export const mockStripeWebhookEvent = {
  id: 'evt_123',
  type: 'customer.subscription.created',
  data: {
    object: mockStripeSubscription,
  },
  created: Math.floor(Date.now() / 1000),
};

export const mockN8nWebhookResponse = {
  success: true,
  workflowId: 'wf-12345',
  status: 'processing',
  message: 'Lead generation started successfully',
  estimatedTime: '2-3 minutes',
};

export const mockCreditCosts = {
  leadlove_maps_10: 3,
  leadlove_maps_20: 3,
  leadlove_maps_30: 5,
  leadlove_maps_50: 8,
  email_generator: 1,
  business_analyzer: 1,
};

export const mockFormValidationErrors = {
  businessType: 'Business type is required',
  location: 'Location is required',
  maxResults: 'Max results must be between 10 and 50',
};

export const mockApiErrors = {
  unauthorized: {
    error: 'Authentication required',
    status: 401,
  },
  insufficientCredits: {
    error: 'Insufficient credits',
    required: 3,
    available: 1,
    status: 402,
  },
  serverError: {
    error: 'Internal server error',
    status: 500,
  },
  n8nTimeout: {
    error: 'Lead generation service is currently unavailable',
    status: 503,
  },
};