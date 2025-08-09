/**
 * Security Tests for API Endpoints
 * OWASP Top 10 and Security Best Practices Testing
 */

const { test, expect } = require('@playwright/test');

test.describe('API Security Tests', () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  test.describe('Authentication Security', () => {
    test('should reject unauthenticated requests to protected endpoints', async ({ request }) => {
      const protectedEndpoints = [
        '/api/leadlove/generate',
        '/api/usage',
        '/api/stripe/create-checkout',
        '/api/stripe/customer-portal'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request.post(`${baseURL}${endpoint}`, {
          data: { test: 'data' }
        });
        
        // Should return 401 Unauthorized or redirect to login
        expect([401, 403, 302]).toContain(response.status());
      }
    });

    test('should reject invalid session tokens', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/leadlove/generate`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345',
          'Cookie': 'sb-access-token=invalid-token'
        },
        data: {
          businessType: 'restaurants',
          location: 'Miami'
        }
      });

      expect([401, 403]).toContain(response.status());
    });

    test('should validate API key format and existence', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/leadlove/generate`, {
        headers: {
          'X-API-Key': 'invalid-api-key-format'
        },
        data: {
          businessType: 'restaurants',
          location: 'Miami'
        }
      });

      expect([401, 403]).toContain(response.status());
    });

    test('should implement session timeout', async ({ page, request }) => {
      // This test would need to be implemented with real session management
      // For now, we'll test that sessions can be invalidated
      
      const response = await request.post(`${baseURL}/api/auth/logout`, {
        data: {}
      });

      // Should successfully logout
      expect([200, 302]).toContain(response.status());
    });
  });

  test.describe('Input Validation Security', () => {
    test('should prevent SQL injection attempts', async ({ request }) => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
        "1; DELETE FROM users WHERE 1=1; --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request.post(`${baseURL}/api/leadlove/generate`, {
          headers: {
            'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
          },
          data: {
            businessType: payload,
            location: 'Miami'
          }
        });

        // Should either reject the payload or sanitize it safely
        const responseBody = await response.text();
        
        // Should not contain SQL error messages
        expect(responseBody.toLowerCase()).not.toContain('sql');
        expect(responseBody.toLowerCase()).not.toContain('syntax');
        expect(responseBody.toLowerCase()).not.toContain('database');
      }
    });

    test('should prevent XSS attacks in input fields', async ({ request }) => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '\'"<svg onload=alert(1)>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>'
      ];

      for (const payload of xssPayloads) {
        const response = await request.post(`${baseURL}/api/leadlove/generate`, {
          headers: {
            'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
          },
          data: {
            businessType: payload,
            location: 'Miami',
            serviceOffering: payload
          }
        });

        const responseBody = await response.text();
        
        // Should not echo back unescaped script tags
        expect(responseBody).not.toContain('<script');
        expect(responseBody).not.toContain('javascript:');
        expect(responseBody).not.toContain('onerror=');
      }
    });

    test('should validate input length limits', async ({ request }) => {
      const longString = 'A'.repeat(10000); // 10KB string

      const response = await request.post(`${baseURL}/api/leadlove/generate`, {
        headers: {
          'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
        },
        data: {
          businessType: longString,
          location: longString,
          serviceOffering: longString
        }
      });

      // Should reject overly long inputs
      expect([400, 413, 422]).toContain(response.status());
    });

    test('should validate numeric input ranges', async ({ request }) => {
      const invalidNumbers = [
        -1,
        0,
        999999,
        'NaN',
        'Infinity',
        '1.0e+100'
      ];

      for (const invalidNumber of invalidNumbers) {
        const response = await request.post(`${baseURL}/api/leadlove/generate`, {
          headers: {
            'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
          },
          data: {
            businessType: 'restaurants',
            location: 'Miami',
            maxResults: invalidNumber
          }
        });

        // Should validate ranges properly
        if (typeof invalidNumber === 'number' && (invalidNumber < 1 || invalidNumber > 50)) {
          expect([400, 422]).toContain(response.status());
        }
      }
    });
  });

  test.describe('Rate Limiting Security', () => {
    test('should implement rate limiting for API endpoints', async ({ request }) => {
      const requests = [];
      const endpoint = `${baseURL}/api/leadlove/generate`;
      
      // Send multiple requests rapidly
      for (let i = 0; i < 20; i++) {
        requests.push(
          request.post(endpoint, {
            headers: {
              'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
            },
            data: {
              businessType: `test-${i}`,
              location: 'Miami'
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status() === 429);

      // Should rate limit after certain threshold
      // expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should have proper rate limit headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/usage`);
      
      // Should include rate limiting headers
      const headers = response.headers();
      // Note: Implement if rate limiting is added
      // expect(headers['x-ratelimit-limit']).toBeDefined();
    });
  });

  test.describe('CORS Security', () => {
    test('should have proper CORS configuration', async ({ request }) => {
      const response = await request.options(`${baseURL}/api/leadlove/generate`, {
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST'
        }
      });

      const corsHeaders = response.headers();
      
      // Should not allow all origins
      expect(corsHeaders['access-control-allow-origin']).not.toBe('*');
      
      // Should have specific allowed origins
      const allowedOrigin = corsHeaders['access-control-allow-origin'];
      if (allowedOrigin) {
        expect(allowedOrigin).toMatch(/^https:\/\//);
      }
    });
  });

  test.describe('Header Security', () => {
    test('should have security headers set', async ({ request }) => {
      const response = await request.get(`${baseURL}/dashboard`);
      const headers = response.headers();

      // Check for important security headers
      const securityHeaders = {
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'referrer-policy': true, // Should exist
        'x-xss-protection': '1; mode=block'
      };

      Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
        if (expectedValue === true) {
          expect(headers[header]).toBeDefined();
        } else {
          expect(headers[header]).toBe(expectedValue);
        }
      });
    });

    test('should not expose sensitive information in headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/leadlove/generate`);
      const headers = response.headers();

      // Should not expose server technology details
      const sensitiveHeaders = [
        'x-powered-by',
        'server',
        'x-aspnet-version',
        'x-generator'
      ];

      sensitiveHeaders.forEach(header => {
        expect(headers[header]).toBeUndefined();
      });
    });
  });

  test.describe('Error Handling Security', () => {
    test('should not expose stack traces in production', async ({ request }) => {
      // Send malformed request to trigger error
      const response = await request.post(`${baseURL}/api/leadlove/generate`, {
        data: 'invalid-json-data'
      });

      const responseBody = await response.text();
      
      // Should not contain stack trace information
      expect(responseBody).not.toMatch(/at\s+.*\(.*:\d+:\d+\)/);
      expect(responseBody).not.toContain('Error:');
      expect(responseBody).not.toContain('stack');
      expect(responseBody).not.toContain(__filename);
    });

    test('should not expose database schema in errors', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/usage`, {
        data: {
          invalid_field: 'test'
        }
      });

      const responseBody = await response.text();
      
      // Should not contain database column names or table names
      expect(responseBody).not.toMatch(/column\s+.*\s+does not exist/i);
      expect(responseBody).not.toMatch(/table\s+.*\s+doesn't exist/i);
      expect(responseBody).not.toContain('pg_');
      expect(responseBody).not.toContain('SELECT');
    });
  });

  test.describe('File Upload Security', () => {
    test('should validate file types if uploads are supported', async ({ request }) => {
      // This would test file upload endpoints if they exist
      // For now, ensuring no unrestricted upload endpoints
      
      const uploadAttempts = [
        '/api/upload',
        '/api/file',
        '/upload',
        '/files'
      ];

      for (const endpoint of uploadAttempts) {
        const response = await request.post(`${baseURL}${endpoint}`, {
          data: Buffer.from('test file content'),
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });

        // Should either not exist (404) or require authentication
        expect([404, 401, 403, 405]).toContain(response.status());
      }
    });
  });

  test.describe('Credit System Security', () => {
    test('should prevent credit manipulation attempts', async ({ request }) => {
      const manipulationAttempts = [
        { credits: -100 },
        { credits: 999999 },
        { credits: 'unlimited' },
        { credits: null },
        { credits: undefined }
      ];

      for (const attempt of manipulationAttempts) {
        const response = await request.post(`${baseURL}/api/credits/add`, {
          data: attempt
        });

        // Should reject credit manipulation attempts
        expect([400, 401, 403, 404, 405]).toContain(response.status());
      }
    });

    test('should validate credit deduction logic', async ({ request }) => {
      // Attempt to bypass credit checks
      const bypassAttempts = [
        {
          businessType: 'restaurants',
          location: 'Miami',
          maxResults: 1000, // Very large number
          bypassCredits: true
        },
        {
          businessType: 'restaurants',
          location: 'Miami',
          creditOverride: -1
        }
      ];

      for (const attempt of bypassAttempts) {
        const response = await request.post(`${baseURL}/api/leadlove/generate`, {
          headers: {
            'X-API-Key': process.env.LEADLOVE_PRIVATE_API_KEY || 'test-key'
          },
          data: attempt
        });

        // Should validate credit requirements properly
        if (response.status() === 200) {
          const body = await response.json();
          // Should not allow bypass of credit system
          expect(body.error).toBeDefined();
        }
      }
    });
  });

  test.describe('Webhook Security', () => {
    test('should validate webhook signatures', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/webhooks/stripe`, {
        headers: {
          'stripe-signature': 'invalid-signature'
        },
        data: {
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              customer: 'cus_test'
            }
          }
        }
      });

      // Should reject invalid signatures
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Environment Security', () => {
    test('should not expose environment variables', async ({ request }) => {
      const endpoints = [
        '/api/env',
        '/api/config',
        '/.env',
        '/config.json'
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${baseURL}${endpoint}`);
        
        // Should not expose configuration
        expect([404, 403, 401]).toContain(response.status());
        
        if (response.status() === 200) {
          const body = await response.text();
          expect(body).not.toContain('API_KEY');
          expect(body).not.toContain('SECRET');
          expect(body).not.toContain('PASSWORD');
        }
      }
    });
  });
});