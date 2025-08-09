import { POST } from '../../../src/app/api/leadlove/generate/route';
import { mockUser, mockSession, mockLeadGenerationRequest, mockApiErrors } from '../../utils/mockData';

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
};

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => mockSupabaseClient,
}));

// Mock fetch for n8n webhook calls
global.fetch = jest.fn();

describe('/api/leadlove/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('Web Frontend Access (Credit-based)', () => {
    test('successfully generates leads for authenticated user with sufficient credits', async () => {
      // Setup mocks
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseClient.from().single.mockResolvedValue({
        data: { ...mockUser, credits_available: 100 },
        error: null,
      });

      mockSupabaseClient.rpc.mockResolvedValue({ error: null });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          workflowId: 'wf-12345',
          results: [],
          message: 'Lead generation started successfully',
        }),
      });

      const request = {
        json: () => Promise.resolve(mockLeadGenerationRequest),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.workflowId).toBe('wf-12345');
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('consume_credits', expect.any(Object));
    });

    test('rejects request for unauthenticated user', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = {
        json: () => Promise.resolve(mockLeadGenerationRequest),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Authentication required for web access');
    });

    test('rejects request for user with insufficient credits', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseClient.from().single.mockResolvedValue({
        data: { ...mockUser, credits_available: 1 },
        error: null,
      });

      const request = {
        json: () => Promise.resolve(mockLeadGenerationRequest),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(402);
      expect(responseData.error).toBe('Insufficient credits');
      expect(responseData.required).toBe(3);
      expect(responseData.available).toBe(1);
    });

    test('refunds credits when n8n request fails', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseClient.from().single.mockResolvedValue({
        data: { ...mockUser, credits_available: 100 },
        error: null,
      });

      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ error: null }) // consume_credits
        .mockResolvedValueOnce({ error: null }); // add_credits (refund)

      global.fetch.mockRejectedValue(new Error('n8n service unavailable'));

      const request = {
        json: () => Promise.resolve(mockLeadGenerationRequest),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(503);
      expect(responseData.refunded).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('add_credits', expect.objectContaining({
        transaction_type: 'refund',
      }));
    });
  });

  describe('Private API Access (Telegram)', () => {
    test('successfully generates leads with private API key', async () => {
      process.env.LEADLOVE_PRIVATE_API_KEY = 'secret-key';

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          workflowId: 'wf-12345',
          results: [],
          message: 'Lead generation started successfully',
        }),
      });

      const request = {
        json: () => Promise.resolve({
          ...mockLeadGenerationRequest,
          apiKey: 'secret-key',
          userId: 'telegram-user-123',
        }),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.metadata.creditsConsumed).toBe(0);
      expect(mockSupabaseClient.auth.getSession).not.toHaveBeenCalled();
    });

    test('rejects request with invalid private API key', async () => {
      process.env.LEADLOVE_PRIVATE_API_KEY = 'secret-key';

      const request = {
        json: () => Promise.resolve({
          ...mockLeadGenerationRequest,
          apiKey: 'invalid-key',
        }),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Authentication required for web access');
    });
  });

  describe('Input Validation', () => {
    test('rejects request with missing required fields', async () => {
      const request = {
        json: () => Promise.resolve({
          businessType: '',
          location: '',
        }),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Business type and location are required');
    });

    test('caps maxResults at 50 for safety', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseClient.from().single.mockResolvedValue({
        data: { ...mockUser, credits_available: 100 },
        error: null,
      });

      mockSupabaseClient.rpc.mockResolvedValue({ error: null });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          workflowId: 'wf-12345',
          results: [],
        }),
      });

      const request = {
        json: () => Promise.resolve({
          ...mockLeadGenerationRequest,
          maxResults: 100, // Should be capped at 50
        }),
      };

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"maxResults":50'),
        })
      );
    });
  });
});