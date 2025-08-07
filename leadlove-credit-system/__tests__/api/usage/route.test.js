import { GET, POST } from '../../../src/app/api/usage/route';
import { mockUser, mockSession, mockUsageHistory } from '../../utils/mockData';

const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => mockSupabaseClient,
}));

describe('/api/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - Fetch Usage History', () => {
    test('successfully fetches usage history for authenticated user', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseClient.from().mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockUsageHistory,
          error: null,
        }),
      }).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { credits_consumed: 3, success: true },
            { credits_consumed: 0, success: true },
            { credits_consumed: 2, success: false },
          ],
          error: null,
        }),
      });

      const request = {
        url: 'http://localhost:3000/api/usage?limit=10&offset=0',
      };

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.records).toEqual(mockUsageHistory);
      expect(responseData.summary.totalGenerations).toBe(3);
      expect(responseData.summary.successfulGenerations).toBe(2);
      expect(responseData.summary.totalCreditsSpent).toBe(5);
      expect(responseData.summary.successRate).toBe(67);
    });

    test('rejects request for unauthenticated user', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = {
        url: 'http://localhost:3000/api/usage',
      };

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Authentication required');
    });

    test('handles query parameters correctly', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockUsageHistory.slice(0, 5),
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        });

      const request = {
        url: 'http://localhost:3000/api/usage?limit=5&offset=0&tool=leadlove_maps',
      };

      await GET(request);

      expect(mockQuery.eq).toHaveBeenCalledWith('tool_name', 'leadlove_maps');
      expect(mockQuery.range).toHaveBeenCalledWith(0, 4); // offset to offset + limit - 1
    });
  });

  describe('POST - Record Usage', () => {
    test('successfully records usage for authenticated user', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseClient.from().mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'usage-123',
            user_id: mockSession.user.id,
            tool_name: 'leadlove_maps',
            credits_consumed: 3,
          },
          error: null,
        }),
      });

      const usageData = {
        tool_name: 'leadlove_maps',
        credits_consumed: 3,
        search_query: 'test query',
        results_count: 10,
        processing_time_ms: 2000,
        success: true,
        workflow_id: 'wf-123',
        metadata: { source: 'web_frontend' },
      };

      const request = {
        json: () => Promise.resolve(usageData),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.record.tool_name).toBe('leadlove_maps');
    });

    test('rejects request for unauthenticated user', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = {
        json: () => Promise.resolve({ tool_name: 'leadlove_maps' }),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Authentication required');
    });

    test('rejects request with missing tool_name', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const request = {
        json: () => Promise.resolve({ credits_consumed: 3 }),
      };

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('tool_name is required');
    });
  });
});