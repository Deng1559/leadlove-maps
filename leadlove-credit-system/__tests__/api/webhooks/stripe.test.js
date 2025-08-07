import { POST } from '../../../src/app/api/webhooks/stripe/route';
import { mockStripeWebhookEvent, mockStripeSubscription, mockUser } from '../../utils/mockData';

// Mock Stripe
const mockStripe = {
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn(() => mockStripe);
});

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
};

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => mockSupabaseClient,
}));

describe('/api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  test('successfully processes subscription created webhook', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      ...mockStripeWebhookEvent,
      type: 'customer.subscription.created',
    });

    mockSupabaseClient.from().single.mockResolvedValue({
      data: mockUser,
      error: null,
    });

    mockSupabaseClient.rpc.mockResolvedValue({ error: null });

    const request = {
      text: () => Promise.resolve(JSON.stringify(mockStripeWebhookEvent)),
      headers: {
        get: jest.fn((header) => {
          if (header === 'stripe-signature') return 'test-signature';
          return null;
        }),
      },
    };

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('add_credits', expect.any(Object));
  });

  test('successfully processes subscription updated webhook', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      ...mockStripeWebhookEvent,
      type: 'customer.subscription.updated',
    });

    mockSupabaseClient.from().single.mockResolvedValue({
      data: mockUser,
      error: null,
    });

    const request = {
      text: () => Promise.resolve(JSON.stringify(mockStripeWebhookEvent)),
      headers: {
        get: jest.fn(() => 'test-signature'),
      },
    };

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockSupabaseClient.from().mockReturnValue).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.any(Function),
      })
    );
  });

  test('successfully processes subscription deleted webhook', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      ...mockStripeWebhookEvent,
      type: 'customer.subscription.deleted',
    });

    mockSupabaseClient.from().single.mockResolvedValue({
      data: mockUser,
      error: null,
    });

    const request = {
      text: () => Promise.resolve(JSON.stringify(mockStripeWebhookEvent)),
      headers: {
        get: jest.fn(() => 'test-signature'),
      },
    };

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  test('successfully processes invoice payment succeeded webhook', async () => {
    const invoiceEvent = {
      ...mockStripeWebhookEvent,
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_123',
          customer: 'cus_123',
          subscription: 'sub_123',
          amount_paid: 1000,
          billing_reason: 'subscription_cycle',
        },
      },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(invoiceEvent);

    mockSupabaseClient.from().single.mockResolvedValue({
      data: mockUser,
      error: null,
    });

    mockSupabaseClient.rpc.mockResolvedValue({ error: null });

    const request = {
      text: () => Promise.resolve(JSON.stringify(invoiceEvent)),
      headers: {
        get: jest.fn(() => 'test-signature'),
      },
    };

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('add_credits', expect.objectContaining({
      transaction_type: 'subscription_payment',
    }));
  });

  test('handles invalid webhook signature', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = {
      text: () => Promise.resolve('invalid-payload'),
      headers: {
        get: jest.fn(() => 'invalid-signature'),
      },
    };

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  test('ignores unknown webhook events', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      ...mockStripeWebhookEvent,
      type: 'unknown.event.type',
    });

    const request = {
      text: () => Promise.resolve(JSON.stringify(mockStripeWebhookEvent)),
      headers: {
        get: jest.fn(() => 'test-signature'),
      },
    };

    const response = await POST(request);

    expect(response.status).toBe(200);
    // Should not call any Supabase operations for unknown events
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  test('handles missing user in database', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      ...mockStripeWebhookEvent,
      type: 'customer.subscription.created',
    });

    mockSupabaseClient.from().single.mockResolvedValue({
      data: null,
      error: { message: 'User not found' },
    });

    const request = {
      text: () => Promise.resolve(JSON.stringify(mockStripeWebhookEvent)),
      headers: {
        get: jest.fn(() => 'test-signature'),
      },
    };

    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  test('handles database errors gracefully', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      ...mockStripeWebhookEvent,
      type: 'customer.subscription.created',
    });

    mockSupabaseClient.from().single.mockResolvedValue({
      data: mockUser,
      error: null,
    });

    mockSupabaseClient.rpc.mockResolvedValue({
      error: { message: 'Database error' },
    });

    const request = {
      text: () => Promise.resolve(JSON.stringify(mockStripeWebhookEvent)),
      headers: {
        get: jest.fn(() => 'test-signature'),
      },
    };

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});