/**
 * API Contract Tests
 * Validates API contracts, schemas, and integration compatibility
 */

const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

test.describe('API Contract Tests', () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  // API Response Schemas
  const schemas = {
    leadGeneration: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        workflowId: { type: 'string' },
        estimatedCompletionTime: { type: 'number' },
        creditsCost: { type: 'number' },
        creditsRemaining: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            businessType: { type: 'string' },
            location: { type: 'string' },
            serviceOffering: { type: 'string' },
            maxResults: { type: 'number' },
            userName: { type: 'string' }
          },
          required: ['businessType', 'location']
        }
      },
      required: ['success', 'message'],
      additionalProperties: false
    },

    usageHistory: {
      type: 'object',
      properties: {
        usage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tool_name: { type: 'string' },
              credits_used: { type: 'number' },
              created_at: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
              metadata: { type: 'object' }
            },
            required: ['id', 'tool_name', 'credits_used', 'created_at', 'status']
          }
        },
        total: { type: 'number' },
        totalCreditsUsed: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      },
      required: ['usage', 'total', 'totalCreditsUsed'],
      additionalProperties: false
    },

    statusCheck: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        workflowId: { type: 'string' },
        status: { 
          type: 'string', 
          enum: ['pending', 'in_progress', 'completed', 'failed', 'not_found'] 
        },
        progress: { type: 'number', minimum: 0, maximum: 100 },
        message: { type: 'string' },
        estimatedTimeRemaining: { type: 'number' },
        results: { type: 'object' }
      },
      required: ['success', 'workflowId', 'status'],
      additionalProperties: false
    },

    errorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: false },
        error: { type: 'string' },
        message: { type: 'string' },
        code: { type: 'string' },
        details: { type: 'object' }
      },
      required: ['success', 'error'],
      additionalProperties: false
    },

    stripeWebhook: {
      type: 'object',
      properties: {
        received: { type: 'boolean' },
        processed: { type: 'boolean' },
        message: { type: 'string' }
      },
      required: ['received'],
      additionalProperties: false
    }
  };

  test.describe('Lead Generation API Contract', () => {
    test('should return valid contract for successful generation', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/leadlove/generate`, {
        headers: {
          'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
        },
        data: {
          businessType: 'restaurants',
          location: 'Miami Beach',
          serviceOffering: 'digital marketing',
          maxResults: 5,
          userName: 'Test User'
        }
      });

      const responseBody = await response.json();
      
      // Validate response structure
      const validate = ajv.compile(schemas.leadGeneration);
      const valid = validate(responseBody);
      
      if (!valid) {
        console.error('Schema validation errors:', validate.errors);
        console.error('Response body:', responseBody);
      }
      
      expect(valid).toBeTruthy();
      
      // Additional contract validations
      if (responseBody.success) {
        expect(responseBody.workflowId).toBeDefined();
        expect(responseBody.creditsCost).toBeGreaterThan(0);
        expect(responseBody.data.businessType).toBe('restaurants');
        expect(responseBody.data.location).toBe('Miami Beach');
      }
    });

    test('should return valid error contract for invalid input', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/leadlove/generate`, {
        headers: {
          'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
        },
        data: {
          businessType: '', // Invalid empty value
          location: '',     // Invalid empty value
        }
      });

      const responseBody = await response.json();
      
      // Should return error contract
      const validate = ajv.compile(schemas.errorResponse);
      const valid = validate(responseBody);
      
      if (!valid) {
        console.error('Error schema validation failed:', validate.errors);
      }
      
      expect(valid).toBeTruthy();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBeDefined();
    });

    test('should maintain backward compatibility', async ({ request }) => {
      // Test with minimal required fields (v1 compatibility)
      const response = await request.post(`${baseURL}/api/leadlove/generate`, {
        headers: {
          'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
        },
        data: {
          businessType: 'cafes',
          location: 'Austin'
          // Missing optional fields
        }
      });

      const responseBody = await response.json();
      
      // Should still work with minimal fields
      const validate = ajv.compile(schemas.leadGeneration);
      const valid = validate(responseBody);
      
      expect(valid).toBeTruthy();
    });

    test('should validate input parameter constraints', async ({ request }) => {
      const testCases = [
        {
          name: 'maxResults upper bound',
          data: { businessType: 'restaurants', location: 'Miami', maxResults: 100 },
          expectError: true
        },
        {
          name: 'maxResults lower bound',
          data: { businessType: 'restaurants', location: 'Miami', maxResults: 0 },
          expectError: true
        },
        {
          name: 'valid maxResults',
          data: { businessType: 'restaurants', location: 'Miami', maxResults: 10 },
          expectError: false
        },
        {
          name: 'long service offering',
          data: { 
            businessType: 'restaurants', 
            location: 'Miami',
            serviceOffering: 'A'.repeat(1000) // Very long text
          },
          expectError: true
        }
      ];

      for (const testCase of testCases) {
        const response = await request.post(`${baseURL}/api/leadlove/generate`, {
          headers: {
            'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
          },
          data: testCase.data
        });

        const responseBody = await response.json();

        if (testCase.expectError) {
          expect(responseBody.success).toBe(false);
          expect(responseBody.error).toBeDefined();
        } else {
          expect(responseBody.success).toBe(true);
        }

        // All responses should follow contract
        const schema = responseBody.success ? schemas.leadGeneration : schemas.errorResponse;
        const validate = ajv.compile(schema);
        const valid = validate(responseBody);
        
        expect(valid).toBeTruthy();
      }
    });
  });

  test.describe('Usage API Contract', () => {
    test('should return valid usage history contract', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/usage`);
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        
        const validate = ajv.compile(schemas.usageHistory);
        const valid = validate(responseBody);
        
        if (!valid) {
          console.error('Usage schema validation errors:', validate.errors);
        }
        
        expect(valid).toBeTruthy();
        
        // Validate data integrity
        expect(responseBody.usage).toBeInstanceOf(Array);
        expect(typeof responseBody.total).toBe('number');
        expect(typeof responseBody.totalCreditsUsed).toBe('number');
        
        // Validate usage records structure
        responseBody.usage.forEach(record => {
          expect(record.id).toBeDefined();
          expect(record.tool_name).toBeDefined();
          expect(typeof record.credits_used).toBe('number');
          expect(record.credits_used).toBeGreaterThan(0);
          expect(new Date(record.created_at)).toBeInstanceOf(Date);
          expect(['pending', 'completed', 'failed']).toContain(record.status);
        });
      }
    });

    test('should handle pagination parameters', async ({ request }) => {
      const paginationTests = [
        { page: 1, limit: 10 },
        { page: 2, limit: 5 },
        { page: 1, limit: 50 }
      ];

      for (const params of paginationTests) {
        const response = await request.get(`${baseURL}/api/usage?page=${params.page}&limit=${params.limit}`);
        
        if (response.status() === 200) {
          const responseBody = await response.json();
          
          const validate = ajv.compile(schemas.usageHistory);
          const valid = validate(responseBody);
          
          expect(valid).toBeTruthy();
          
          // Validate pagination
          if (responseBody.page !== undefined) {
            expect(responseBody.page).toBe(params.page);
          }
          if (responseBody.limit !== undefined) {
            expect(responseBody.limit).toBe(params.limit);
          }
          
          // Should not exceed limit
          expect(responseBody.usage.length).toBeLessThanOrEqual(params.limit);
        }
      }
    });
  });

  test.describe('Status Check API Contract', () => {
    test('should return valid status contract', async ({ request }) => {
      const testWorkflowId = `test-workflow-${Date.now()}`;
      
      const response = await request.post(`${baseURL}/api/leadlove/status`, {
        data: {
          workflowId: testWorkflowId
        }
      });

      const responseBody = await response.json();
      
      const validate = ajv.compile(schemas.statusCheck);
      const valid = validate(responseBody);
      
      if (!valid) {
        console.error('Status schema validation errors:', validate.errors);
        console.error('Response body:', responseBody);
      }
      
      expect(valid).toBeTruthy();
      
      // Validate status values
      expect(['pending', 'in_progress', 'completed', 'failed', 'not_found'])
        .toContain(responseBody.status);
      
      if (responseBody.progress !== undefined) {
        expect(responseBody.progress).toBeGreaterThanOrEqual(0);
        expect(responseBody.progress).toBeLessThanOrEqual(100);
      }
    });

    test('should handle missing workflow ID', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/leadlove/status`, {
        data: {} // Missing workflowId
      });

      const responseBody = await response.json();
      
      // Should return error response
      const validate = ajv.compile(schemas.errorResponse);
      const valid = validate(responseBody);
      
      expect(valid).toBeTruthy();
      expect(responseBody.success).toBe(false);
    });
  });

  test.describe('Webhook Contract Tests', () => {
    test('should return valid Stripe webhook contract', async ({ request }) => {
      // This would normally require a valid Stripe signature
      // For contract testing, we focus on response structure
      
      const response = await request.post(`${baseURL}/api/webhooks/stripe`, {
        headers: {
          'stripe-signature': 'test-signature'
        },
        data: {
          type: 'customer.subscription.created',
          data: {
            object: {
              customer: 'cus_test123'
            }
          }
        }
      });

      const responseBody = await response.json();
      
      const validate = ajv.compile(schemas.stripeWebhook);
      const valid = validate(responseBody);
      
      if (!valid) {
        console.error('Webhook schema validation errors:', validate.errors);
      }
      
      expect(valid).toBeTruthy();
    });
  });

  test.describe('API Versioning Contract', () => {
    test('should handle API version headers', async ({ request }) => {
      const versions = ['v1', 'v2', 'latest'];
      
      for (const version of versions) {
        const response = await request.get(`${baseURL}/api/usage`, {
          headers: {
            'API-Version': version
          }
        });

        // Should handle version gracefully
        expect([200, 400, 404]).toContain(response.status());
        
        if (response.status() === 200) {
          const responseBody = await response.json();
          
          // Should still follow contract regardless of version
          const validate = ajv.compile(schemas.usageHistory);
          const valid = validate(responseBody);
          
          expect(valid).toBeTruthy();
        }
      }
    });

    test('should maintain content-type consistency', async ({ request }) => {
      const endpoints = [
        '/api/leadlove/generate',
        '/api/usage',
        '/api/leadlove/status'
      ];

      for (const endpoint of endpoints) {
        const response = await request.post(`${baseURL}${endpoint}`, {
          headers: {
            'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
          },
          data: { test: 'data' }
        });

        // Should return JSON content type
        const contentType = response.headers()['content-type'];
        expect(contentType).toMatch(/application\/json/);
      }
    });
  });

  test.describe('Error Contract Consistency', () => {
    test('should return consistent error formats', async ({ request }) => {
      const errorScenarios = [
        {
          name: 'Invalid JSON',
          endpoint: '/api/leadlove/generate',
          headers: { 'X-API-Key': 'test-key', 'Content-Type': 'application/json' },
          body: 'invalid-json'
        },
        {
          name: 'Missing Content-Type',
          endpoint: '/api/leadlove/generate',
          headers: { 'X-API-Key': 'test-key' },
          body: 'plain text'
        },
        {
          name: 'Unauthorized',
          endpoint: '/api/leadlove/generate',
          headers: {},
          body: JSON.stringify({ test: 'data' })
        }
      ];

      for (const scenario of errorScenarios) {
        const response = await request.post(`${baseURL}${scenario.endpoint}`, {
          headers: scenario.headers,
          data: scenario.body
        });

        // Should return error status
        expect(response.status()).toBeGreaterThanOrEqual(400);

        if (response.headers()['content-type']?.includes('application/json')) {
          const responseBody = await response.json();
          
          // Should follow error contract
          const validate = ajv.compile(schemas.errorResponse);
          const valid = validate(responseBody);
          
          expect(valid).toBeTruthy();
          expect(responseBody.success).toBe(false);
          expect(responseBody.error).toBeDefined();
        }
      }
    });
  });

  test.describe('Field Validation Contract', () => {
    test('should validate required fields consistently', async ({ request }) => {
      const requiredFieldTests = [
        {
          endpoint: '/api/leadlove/generate',
          missingFields: ['businessType'],
          data: { location: 'Miami' }
        },
        {
          endpoint: '/api/leadlove/generate', 
          missingFields: ['location'],
          data: { businessType: 'restaurants' }
        },
        {
          endpoint: '/api/leadlove/status',
          missingFields: ['workflowId'],
          data: {}
        }
      ];

      for (const test of requiredFieldTests) {
        const response = await request.post(`${baseURL}${test.endpoint}`, {
          headers: {
            'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
          },
          data: test.data
        });

        const responseBody = await response.json();
        
        // Should return validation error
        expect(responseBody.success).toBe(false);
        expect(responseBody.error).toBeDefined();
        
        // Error should mention missing fields
        const errorMessage = responseBody.error.toLowerCase();
        test.missingFields.forEach(field => {
          expect(errorMessage).toContain(field.toLowerCase());
        });
      }
    });
  });
});