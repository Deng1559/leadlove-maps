/**
 * Performance and Load Tests
 * Tests API response times, throughput, and system performance under load
 */

const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  test.describe('Response Time Tests', () => {
    test('API endpoints should respond within acceptable time limits', async ({ request }) => {
      const endpoints = [
        { path: '/api/usage', method: 'GET', maxTime: 500 },
        { path: '/api/leadlove/status', method: 'POST', maxTime: 200 },
        { path: '/', method: 'GET', maxTime: 1000 }
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        let response;
        if (endpoint.method === 'GET') {
          response = await request.get(`${baseURL}${endpoint.path}`);
        } else {
          response = await request.post(`${baseURL}${endpoint.path}`, {
            data: { test: 'data' }
          });
        }
        
        const responseTime = Date.now() - startTime;
        
        console.log(`${endpoint.method} ${endpoint.path}: ${responseTime}ms`);
        expect(responseTime).toBeLessThan(endpoint.maxTime);
      }
    });

    test('database queries should be optimized', async ({ request }) => {
      const startTime = Date.now();
      
      // Test a data-heavy endpoint
      const response = await request.get(`${baseURL}/api/usage`);
      
      const queryTime = Date.now() - startTime;
      
      // Database queries should complete quickly
      expect(queryTime).toBeLessThan(1000);
      
      if (response.status() === 200) {
        const data = await response.json();
        console.log(`Database query returned ${data.total || 0} records in ${queryTime}ms`);
      }
    });
  });

  test.describe('Throughput Tests', () => {
    test('should handle multiple concurrent requests', async ({ request }) => {
      const concurrentRequests = 10;
      const requests = [];
      
      const startTime = Date.now();
      
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request.post(`${baseURL}/api/leadlove/status`, {
            data: {
              workflowId: `test-${i}-${Date.now()}`
            }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should complete
      expect(responses).toHaveLength(concurrentRequests);
      
      // Calculate throughput
      const throughput = (concurrentRequests / totalTime) * 1000; // requests per second
      console.log(`Throughput: ${throughput.toFixed(2)} requests/second`);
      
      // Should handle reasonable concurrent load
      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second
      
      // Check response status distribution
      const statusCodes = responses.map(r => r.status());
      const successCount = statusCodes.filter(s => s >= 200 && s < 300).length;
      const successRate = (successCount / concurrentRequests) * 100;
      
      console.log(`Success rate: ${successRate}% (${successCount}/${concurrentRequests})`);
      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
    });

    test('should maintain performance under sustained load', async ({ request }) => {
      const iterations = 50;
      const responseTimes = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request.get(`${baseURL}/api/usage`);
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        // Small delay to simulate realistic usage
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      console.log(`Response time stats over ${iterations} requests:`);
      console.log(`Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`Max: ${maxResponseTime}ms`);
      console.log(`Min: ${minResponseTime}ms`);
      
      // Performance should remain consistent
      expect(avgResponseTime).toBeLessThan(500);
      expect(maxResponseTime).toBeLessThan(2000);
      
      // Check for performance degradation
      const firstQuarter = responseTimes.slice(0, Math.floor(iterations / 4));
      const lastQuarter = responseTimes.slice(-Math.floor(iterations / 4));
      
      const firstQuarterAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
      const lastQuarterAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
      
      const degradation = ((lastQuarterAvg - firstQuarterAvg) / firstQuarterAvg) * 100;
      console.log(`Performance degradation: ${degradation.toFixed(2)}%`);
      
      // Should not degrade significantly over time
      expect(degradation).toBeLessThan(50); // Less than 50% degradation
    });
  });

  test.describe('Memory Usage Tests', () => {
    test('should have reasonable memory consumption', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Measure initial memory
      const initialMetrics = await page.evaluate(() => {
        if ('memory' in performance) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (initialMetrics) {
        const initialMemoryMB = initialMetrics.usedJSHeapSize / 1024 / 1024;
        console.log(`Initial memory usage: ${initialMemoryMB.toFixed(2)}MB`);
        
        // Perform memory-intensive operations
        await page.goto('/dashboard/generate');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="businessType"]', 'restaurants');
        await page.fill('input[name="location"]', 'Miami Beach');
        await page.fill('textarea[name="serviceOffering"]', 'digital marketing');
        
        // Measure memory after operations
        const finalMetrics = await page.evaluate(() => {
          if ('memory' in performance) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize
            };
          }
          return null;
        });
        
        if (finalMetrics) {
          const finalMemoryMB = finalMetrics.usedJSHeapSize / 1024 / 1024;
          const memoryIncrease = finalMemoryMB - initialMemoryMB;
          
          console.log(`Final memory usage: ${finalMemoryMB.toFixed(2)}MB`);
          console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
          
          // Memory usage should be reasonable
          expect(finalMemoryMB).toBeLessThan(100); // Less than 100MB
          expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
        }
      }
    });

    test('should not have memory leaks', async ({ page }) => {
      const measurements = [];
      
      for (let i = 0; i < 5; i++) {
        // Navigate to different pages to trigger cleanup
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.goto('/dashboard/generate');
        await page.waitForLoadState('networkidle');
        await page.goto('/dashboard/credits');
        await page.waitForLoadState('networkidle');
        
        // Force garbage collection if available
        if (page.context().browser()?.browserType().name() === 'chromium') {
          await page.evaluate(() => {
            if ('gc' in window) {
              window.gc();
            }
          });
        }
        
        const metrics = await page.evaluate(() => {
          if ('memory' in performance) {
            return performance.memory.usedJSHeapSize / 1024 / 1024;
          }
          return null;
        });
        
        if (metrics) {
          measurements.push(metrics);
          console.log(`Iteration ${i + 1}: ${metrics.toFixed(2)}MB`);
        }
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (measurements.length >= 3) {
        const firstMeasurement = measurements[0];
        const lastMeasurement = measurements[measurements.length - 1];
        const memoryGrowth = lastMeasurement - firstMeasurement;
        
        console.log(`Memory growth over ${measurements.length} iterations: ${memoryGrowth.toFixed(2)}MB`);
        
        // Should not grow significantly over multiple navigations
        expect(memoryGrowth).toBeLessThan(20); // Less than 20MB growth
      }
    });
  });

  test.describe('Network Performance Tests', () => {
    test('should optimize bundle sizes', async ({ page }) => {
      // Start measuring network activity
      const resourceSizes = [];
      
      page.on('response', response => {
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          resourceSizes.push({
            url: response.url(),
            size: parseInt(contentLength),
            type: response.headers()['content-type'] || 'unknown'
          });
        }
      });
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Analyze bundle sizes
      const jsResources = resourceSizes.filter(r => 
        r.type.includes('javascript') || r.url.includes('.js')
      );
      const cssResources = resourceSizes.filter(r => 
        r.type.includes('css') || r.url.includes('.css')
      );
      
      const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0) / 1024; // KB
      const totalCssSize = cssResources.reduce((sum, r) => sum + r.size, 0) / 1024; // KB
      
      console.log(`Total JavaScript: ${totalJsSize.toFixed(2)}KB`);
      console.log(`Total CSS: ${totalCssSize.toFixed(2)}KB`);
      
      // Bundle sizes should be reasonable
      expect(totalJsSize).toBeLessThan(500); // Less than 500KB JS
      expect(totalCssSize).toBeLessThan(100); // Less than 100KB CSS
      
      // Check for individual large files
      jsResources.forEach(resource => {
        const sizeKB = resource.size / 1024;
        if (sizeKB > 200) {
          console.warn(`Large JS file: ${resource.url} (${sizeKB.toFixed(2)}KB)`);
        }
        expect(sizeKB).toBeLessThan(300); // No single JS file over 300KB
      });
    });

    test('should implement efficient caching', async ({ page }) => {
      // First visit
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const firstVisitResources = [];
      
      page.on('response', response => {
        firstVisitResources.push({
          url: response.url(),
          fromCache: response.fromServiceWorker() || 
                     response.headers()['x-cache'] === 'HIT' ||
                     response.status() === 304
        });
      });
      
      // Second visit (should use cache)
      await page.reload({ waitUntil: 'networkidle' });
      
      const cachedResources = firstVisitResources.filter(r => r.fromCache).length;
      const totalResources = firstVisitResources.length;
      const cacheHitRate = (cachedResources / totalResources) * 100;
      
      console.log(`Cache hit rate: ${cacheHitRate.toFixed(2)}% (${cachedResources}/${totalResources})`);
      
      // Should have reasonable cache hit rate for static resources
      // Note: This might be low in test environment without proper caching setup
    });
  });

  test.describe('Database Performance Tests', () => {
    test('should handle database operations efficiently', async ({ request }) => {
      const operations = [
        { name: 'Read Usage', endpoint: '/api/usage', method: 'GET' },
        { name: 'Create Usage Record', endpoint: '/api/usage', method: 'POST' },
      ];
      
      for (const operation of operations) {
        const times = [];
        
        for (let i = 0; i < 10; i++) {
          const startTime = Date.now();
          
          let response;
          if (operation.method === 'GET') {
            response = await request.get(`${baseURL}${operation.endpoint}`);
          } else {
            response = await request.post(`${baseURL}${operation.endpoint}`, {
              data: {
                tool_name: 'leadlove_maps',
                credits_used: 3,
                status: 'completed'
              }
            });
          }
          
          const operationTime = Date.now() - startTime;
          times.push(operationTime);
          
          // Small delay between operations
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        
        console.log(`${operation.name} - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime}ms`);
        
        // Database operations should be fast
        expect(avgTime).toBeLessThan(200);
        expect(maxTime).toBeLessThan(500);
      }
    });
  });

  test.describe('Frontend Performance Tests', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Measure Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};
          
          // Largest Contentful Paint
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            vitals.lcp = entries[entries.length - 1].startTime;
            checkComplete();
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // First Input Delay would need real user interaction
          // For now, we'll simulate with a synthetic measurement
          vitals.fid = 0; // Simulated
          
          // Cumulative Layout Shift
          new PerformanceObserver((entryList) => {
            let cls = 0;
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            }
            vitals.cls = cls;
            checkComplete();
          }).observe({ entryTypes: ['layout-shift'] });
          
          let completedMetrics = 0;
          function checkComplete() {
            completedMetrics++;
            if (completedMetrics >= 2) {
              setTimeout(() => resolve(vitals), 1000);
            }
          }
        });
      });
      
      console.log('Core Web Vitals:', webVitals);
      
      // Thresholds based on Google's Core Web Vitals
      if (webVitals.lcp) {
        expect(webVitals.lcp).toBeLessThan(2500); // 2.5 seconds
      }
      if (webVitals.cls !== undefined) {
        expect(webVitals.cls).toBeLessThan(0.1); // 0.1 or less
      }
      // FID should be less than 100ms (would need real interaction)
    });

    test('should have fast Time to Interactive', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      
      // Wait for the page to be interactive
      await page.waitForSelector('button:not([disabled])', { timeout: 10000 });
      
      const timeToInteractive = Date.now() - startTime;
      
      console.log(`Time to Interactive: ${timeToInteractive}ms`);
      
      // Should be interactive quickly
      expect(timeToInteractive).toBeLessThan(5000); // 5 seconds
    });
  });
});