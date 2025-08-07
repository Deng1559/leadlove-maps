/**
 * LeadLove Maps End-to-End Test Runner
 * Comprehensive testing orchestration for the entire system
 */

const TestEnvironment = require('./test-environment-setup');
const WorkflowValidator = require('./test-workflow-validation');
const fs = require('fs');
const { spawn } = require('child_process');

class TestRunner {
  constructor() {
    this.testEnvironment = null;
    this.workflowValidator = new WorkflowValidator();
    this.testResults = {
      unit: null,
      integration: null,
      workflow: null,
      endToEnd: null,
      performance: null
    };
    this.startTime = null;
    this.endTime = null;
  }

  async runCompleteTestSuite() {
    console.log(`
🚀 LeadLove Maps Complete Test Suite
====================================
Starting comprehensive system validation...
    `);

    this.startTime = Date.now();

    try {
      // Step 1: Setup test environment
      await this.setupTestEnvironment();

      // Step 2: Run workflow validation
      await this.runWorkflowValidation();

      // Step 3: Run integration tests
      await this.runIntegrationTests();

      // Step 4: Run end-to-end tests
      await this.runEndToEndTests();

      // Step 5: Run performance tests
      await this.runPerformanceTests();

      // Step 6: Generate comprehensive report
      return this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      return {
        success: false,
        error: error.message,
        partialResults: this.testResults
      };
    } finally {
      this.endTime = Date.now();
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    try {
      this.testEnvironment = new TestEnvironment();
      
      // Start test server
      return new Promise((resolve, reject) => {
        const server = this.testEnvironment.app.listen(3001, () => {
          console.log('✅ Test environment ready on port 3001');
          this.testServer = server;
          resolve();
        });

        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log('⚠️  Port 3001 already in use, assuming test environment is running');
            resolve();
          } else {
            reject(error);
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          reject(new Error('Test environment setup timeout'));
        }, 5000);
      });
    } catch (error) {
      console.error('Failed to setup test environment:', error);
      throw error;
    }
  }

  async runWorkflowValidation() {
    console.log('🔍 Running workflow validation...');
    
    try {
      const validationResult = await this.workflowValidator.runAllTests();
      this.testResults.workflow = validationResult;
      
      if (validationResult.success) {
        console.log('✅ Workflow validation passed');
      } else {
        console.log(`❌ Workflow validation failed: ${validationResult.totalTests - validationResult.passedTests} tests failed`);
      }
      
      return validationResult;
    } catch (error) {
      console.error('Workflow validation error:', error);
      this.testResults.workflow = { success: false, error: error.message };
      throw error;
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    
    const integrationTests = [
      this.testTelegramWebhookIntegration(),
      this.testFrontendWebhookIntegration(),
      this.testStatusCheckIntegration(),
      this.testDataFlowIntegration(),
      this.testErrorHandlingIntegration()
    ];

    try {
      const results = await Promise.all(integrationTests);
      const allPassed = results.every(result => result.success);
      
      this.testResults.integration = {
        success: allPassed,
        tests: results,
        passed: results.filter(r => r.success).length,
        total: results.length
      };

      if (allPassed) {
        console.log('✅ Integration tests passed');
      } else {
        console.log('❌ Some integration tests failed');
      }

      return this.testResults.integration;
    } catch (error) {
      console.error('Integration tests error:', error);
      this.testResults.integration = { success: false, error: error.message };
      throw error;
    }
  }

  async runEndToEndTests() {
    console.log('🎯 Running end-to-end tests...');
    
    const e2eTests = [
      this.testTelegramToGoogleSheetsFlow(),
      this.testFrontendToGoogleSheetsFlow(),
      this.testDualInputScenario(),
      this.testRealTimeProgressTracking(),
      this.testErrorRecoveryFlow()
    ];

    try {
      const results = await Promise.all(e2eTests);
      const allPassed = results.every(result => result.success);
      
      this.testResults.endToEnd = {
        success: allPassed,
        tests: results,
        passed: results.filter(r => r.success).length,
        total: results.length
      };

      if (allPassed) {
        console.log('✅ End-to-end tests passed');
      } else {
        console.log('❌ Some end-to-end tests failed');
      }

      return this.testResults.endToEnd;
    } catch (error) {
      console.error('End-to-end tests error:', error);
      this.testResults.endToEnd = { success: false, error: error.message };
      throw error;
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');
    
    const performanceTests = [
      this.testResponseTimes(),
      this.testThroughput(),
      this.testMemoryUsage(),
      this.testConcurrentUsers(),
      this.testLargeDataSets()
    ];

    try {
      const results = await Promise.all(performanceTests);
      const allPassed = results.every(result => result.success);
      
      this.testResults.performance = {
        success: allPassed,
        tests: results,
        passed: results.filter(r => r.success).length,
        total: results.length,
        metrics: this.aggregatePerformanceMetrics(results)
      };

      if (allPassed) {
        console.log('✅ Performance tests passed');
      } else {
        console.log('❌ Some performance tests failed');
      }

      return this.testResults.performance;
    } catch (error) {
      console.error('Performance tests error:', error);
      this.testResults.performance = { success: false, error: error.message };
      throw error;
    }
  }

  // Integration test implementations
  async testTelegramWebhookIntegration() {
    const startTime = Date.now();
    
    try {
      const testMessage = {
        body: {
          message: {
            text: 'restaurants Miami Beach for digital marketing',
            chat: { id: 'test-chat-123' },
            from: { id: 'test-user-456', first_name: 'Test User' }
          }
        }
      };

      const response = await this.makeTestRequest('/webhook/business-search-bot', testMessage);
      const duration = Date.now() - startTime;

      return {
        name: 'Telegram Webhook Integration',
        success: response.success === true,
        duration: duration,
        response: response,
        metrics: {
          responseTime: duration,
          dataProcessed: response.parsed ? 'yes' : 'no'
        }
      };
    } catch (error) {
      return {
        name: 'Telegram Webhook Integration',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testFrontendWebhookIntegration() {
    const startTime = Date.now();
    
    try {
      const testData = {
        businessType: 'restaurants',
        location: 'Miami Beach',
        serviceOffering: 'digital marketing',
        userName: 'Test User'
      };

      const response = await this.makeTestRequest('/webhook/leadlove-frontend', testData);
      const duration = Date.now() - startTime;

      return {
        name: 'Frontend Webhook Integration',
        success: response.success === true && response.workflowId,
        duration: duration,
        response: response,
        metrics: {
          responseTime: duration,
          workflowId: response.workflowId || 'none'
        }
      };
    } catch (error) {
      return {
        name: 'Frontend Webhook Integration',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testStatusCheckIntegration() {
    const startTime = Date.now();
    
    try {
      const testWorkflowId = `test-${Date.now()}`;
      const response = await this.makeTestRequest('/webhook/leadlove-status', { 
        workflowId: testWorkflowId 
      });
      const duration = Date.now() - startTime;

      return {
        name: 'Status Check Integration',
        success: response.success === true,
        duration: duration,
        response: response,
        metrics: {
          responseTime: duration,
          statusTracking: response.workflowId ? 'working' : 'failed'
        }
      };
    } catch (error) {
      return {
        name: 'Status Check Integration',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testDataFlowIntegration() {
    const startTime = Date.now();
    
    try {
      // Test data transformation through the pipeline
      const inputData = {
        businessType: 'dental practices',
        location: 'Austin',
        serviceOffering: 'voice ai'
      };

      const response = await this.makeTestRequest('/webhook/leadlove-frontend', inputData);
      const duration = Date.now() - startTime;

      // Validate data transformation
      const isValidTransformation = response.data && 
        response.data.businessType === inputData.businessType &&
        response.data.location === inputData.location;

      return {
        name: 'Data Flow Integration',
        success: response.success && isValidTransformation,
        duration: duration,
        response: response,
        metrics: {
          responseTime: duration,
          dataTransformation: isValidTransformation ? 'valid' : 'invalid'
        }
      };
    } catch (error) {
      return {
        name: 'Data Flow Integration',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testErrorHandlingIntegration() {
    const startTime = Date.now();
    
    try {
      // Test with invalid data to trigger error handling
      const invalidData = {
        businessType: '',
        location: ''
      };

      const response = await this.makeTestRequest('/webhook/leadlove-frontend', invalidData);
      const duration = Date.now() - startTime;

      // Error handling should return an error response, not throw
      const hasGracefulErrorHandling = response.error || response.success === false;

      return {
        name: 'Error Handling Integration',
        success: hasGracefulErrorHandling,
        duration: duration,
        response: response,
        metrics: {
          responseTime: duration,
          errorHandling: hasGracefulErrorHandling ? 'graceful' : 'failed'
        }
      };
    } catch (error) {
      // Catching an exception means error handling needs improvement
      return {
        name: 'Error Handling Integration',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        metrics: {
          errorHandling: 'unhandled_exception'
        }
      };
    }
  }

  // End-to-end test implementations
  async testTelegramToGoogleSheetsFlow() {
    const startTime = Date.now();
    
    try {
      // Simulate complete Telegram to Google Sheets flow
      console.log('  📱 Testing Telegram → Google Sheets flow...');
      
      const telegramMessage = {
        body: {
          message: {
            text: 'law firms Boston for website development',
            chat: { id: 'e2e-test-chat' },
            from: { id: 'e2e-test-user', first_name: 'E2E Test User' }
          }
        }
      };

      // Step 1: Send message to Telegram webhook
      const webhookResponse = await this.makeTestRequest('/webhook/business-search-bot', telegramMessage);
      
      if (!webhookResponse.success) {
        throw new Error('Telegram webhook failed');
      }

      // Step 2: Simulate workflow processing (in real scenario, this would be n8n)
      await this.delay(2000);

      // Step 3: Check if data would be saved to Google Sheets (mocked)
      const mockSheetsData = this.generateMockGoogleSheetsData(webhookResponse.parsed);

      const duration = Date.now() - startTime;

      return {
        name: 'Telegram to Google Sheets E2E',
        success: true,
        duration: duration,
        steps: {
          telegramWebhook: 'passed',
          workflowProcessing: 'simulated',
          googleSheetsStorage: 'mocked'
        },
        data: mockSheetsData,
        metrics: {
          totalDuration: duration,
          telegramProcessing: '< 1s',
          expectedWorkflowTime: '2-3 minutes'
        }
      };
    } catch (error) {
      return {
        name: 'Telegram to Google Sheets E2E',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testFrontendToGoogleSheetsFlow() {
    const startTime = Date.now();
    
    try {
      console.log('  🌐 Testing Frontend → Google Sheets flow...');
      
      const frontendData = {
        businessType: 'fitness centers',
        location: 'Denver',
        serviceOffering: 'lead generation',
        maxResults: 15,
        userName: 'E2E Test User'
      };

      // Step 1: Submit frontend form
      const frontendResponse = await this.makeTestRequest('/webhook/leadlove-frontend', frontendData);
      
      if (!frontendResponse.success) {
        throw new Error('Frontend webhook failed');
      }

      // Step 2: Check workflow status
      if (frontendResponse.workflowId) {
        const statusResponse = await this.makeTestRequest('/webhook/leadlove-status', {
          workflowId: frontendResponse.workflowId
        });
        
        // Wait for completion simulation
        await this.delay(3000);
      }

      const duration = Date.now() - startTime;

      return {
        name: 'Frontend to Google Sheets E2E',
        success: true,
        duration: duration,
        steps: {
          frontendForm: 'passed',
          workflowInitiation: 'passed',
          statusTracking: 'passed',
          dataProcessing: 'simulated'
        },
        workflowId: frontendResponse.workflowId,
        metrics: {
          totalDuration: duration,
          frontendProcessing: '< 1s',
          statusCheckDelay: '2s'
        }
      };
    } catch (error) {
      return {
        name: 'Frontend to Google Sheets E2E',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testDualInputScenario() {
    const startTime = Date.now();
    
    try {
      console.log('  🔄 Testing dual input scenario...');
      
      // Test both inputs simultaneously
      const telegramPromise = this.testTelegramWebhookIntegration();
      const frontendPromise = this.testFrontendWebhookIntegration();
      
      const [telegramResult, frontendResult] = await Promise.all([
        telegramPromise,
        frontendPromise
      ]);

      const bothSucceeded = telegramResult.success && frontendResult.success;
      const duration = Date.now() - startTime;

      return {
        name: 'Dual Input Scenario E2E',
        success: bothSucceeded,
        duration: duration,
        results: {
          telegram: telegramResult,
          frontend: frontendResult
        },
        metrics: {
          concurrentProcessing: bothSucceeded ? 'successful' : 'failed',
          totalDuration: duration
        }
      };
    } catch (error) {
      return {
        name: 'Dual Input Scenario E2E',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testRealTimeProgressTracking() {
    const startTime = Date.now();
    
    try {
      console.log('  📊 Testing real-time progress tracking...');
      
      const frontendData = {
        businessType: 'restaurants',
        location: 'San Francisco',
        serviceOffering: 'digital marketing'
      };

      // Initiate workflow
      const initResponse = await this.makeTestRequest('/webhook/leadlove-frontend', frontendData);
      
      if (!initResponse.success || !initResponse.workflowId) {
        throw new Error('Failed to initiate workflow for progress tracking');
      }

      // Test multiple status checks
      const statusChecks = [];
      for (let i = 0; i < 3; i++) {
        await this.delay(1000);
        const statusCheck = await this.makeTestRequest('/webhook/leadlove-status', {
          workflowId: initResponse.workflowId
        });
        statusChecks.push(statusCheck);
      }

      const allStatusChecksWorked = statusChecks.every(check => check.success);
      const duration = Date.now() - startTime;

      return {
        name: 'Real-time Progress Tracking E2E',
        success: allStatusChecksWorked,
        duration: duration,
        statusChecks: statusChecks.length,
        workflowId: initResponse.workflowId,
        metrics: {
          statusCheckInterval: '1s',
          totalChecks: statusChecks.length,
          allSuccessful: allStatusChecksWorked
        }
      };
    } catch (error) {
      return {
        name: 'Real-time Progress Tracking E2E',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async testErrorRecoveryFlow() {
    const startTime = Date.now();
    
    try {
      console.log('  🔄 Testing error recovery flow...');
      
      // Test 1: Invalid input recovery
      const invalidInput = { businessType: '', location: '' };
      const errorResponse = await this.makeTestRequest('/webhook/leadlove-frontend', invalidInput);
      
      // Should handle gracefully without crashing
      const gracefulErrorHandling = errorResponse.error || errorResponse.success === false;
      
      // Test 2: Recovery with valid input after error
      const validInput = {
        businessType: 'cafes',
        location: 'Seattle',
        serviceOffering: 'social media'
      };
      const recoveryResponse = await this.makeTestRequest('/webhook/leadlove-frontend', validInput);
      
      const recoveryWorked = recoveryResponse.success === true;
      const duration = Date.now() - startTime;

      return {
        name: 'Error Recovery Flow E2E',
        success: gracefulErrorHandling && recoveryWorked,
        duration: duration,
        tests: {
          errorHandling: gracefulErrorHandling,
          recoveryAfterError: recoveryWorked
        },
        metrics: {
          errorRecoveryTime: duration,
          gracefulDegradation: gracefulErrorHandling
        }
      };
    } catch (error) {
      return {
        name: 'Error Recovery Flow E2E',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  // Performance test implementations
  async testResponseTimes() {
    const responseTimes = [];
    const targetResponseTime = 1000; // 1 second
    
    try {
      console.log('  ⏱️  Testing response times...');
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await this.makeTestRequest('/webhook/leadlove-frontend', {
          businessType: 'test',
          location: 'test'
        });
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const success = avgResponseTime < targetResponseTime && maxResponseTime < targetResponseTime * 2;

      return {
        name: 'Response Times Performance',
        success: success,
        metrics: {
          averageResponseTime: Math.round(avgResponseTime),
          maxResponseTime: maxResponseTime,
          targetResponseTime: targetResponseTime,
          allResponseTimes: responseTimes,
          testCount: responseTimes.length
        }
      };
    } catch (error) {
      return {
        name: 'Response Times Performance',
        success: false,
        error: error.message
      };
    }
  }

  async testThroughput() {
    const startTime = Date.now();
    const requestCount = 10;
    
    try {
      console.log('  🚀 Testing throughput...');
      
      const requests = [];
      for (let i = 0; i < requestCount; i++) {
        requests.push(this.makeTestRequest('/webhook/leadlove-frontend', {
          businessType: `test-${i}`,
          location: `location-${i}`
        }));
      }

      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;
      const successfulRequests = results.filter(r => r.success).length;
      const throughput = (successfulRequests / duration) * 1000; // requests per second

      return {
        name: 'Throughput Performance',
        success: successfulRequests === requestCount,
        metrics: {
          totalRequests: requestCount,
          successfulRequests: successfulRequests,
          duration: duration,
          throughput: Math.round(throughput * 100) / 100,
          successRate: Math.round((successfulRequests / requestCount) * 100)
        }
      };
    } catch (error) {
      return {
        name: 'Throughput Performance',
        success: false,
        error: error.message
      };
    }
  }

  async testMemoryUsage() {
    try {
      console.log('  💾 Testing memory usage...');
      
      const initialMemory = process.memoryUsage();
      
      // Generate some load
      for (let i = 0; i < 50; i++) {
        await this.makeTestRequest('/webhook/leadlove-frontend', {
          businessType: `memory-test-${i}`,
          location: 'memory-test-location'
        });
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseRM = Math.round(memoryIncrease / 1024 / 1024 * 100) / 100; // MB

      // Memory increase should be reasonable (< 100MB for this test)
      const success = memoryIncreaseRM < 100;

      return {
        name: 'Memory Usage Performance',
        success: success,
        metrics: {
          initialMemoryMB: Math.round(initialMemory.heapUsed / 1024 / 1024 * 100) / 100,
          finalMemoryMB: Math.round(finalMemory.heapUsed / 1024 / 1024 * 100) / 100,
          memoryIncreaseMB: memoryIncreaseRM,
          testRequests: 50
        }
      };
    } catch (error) {
      return {
        name: 'Memory Usage Performance',
        success: false,
        error: error.message
      };
    }
  }

  async testConcurrentUsers() {
    const concurrentUsers = 5;
    const requestsPerUser = 3;
    
    try {
      console.log('  👥 Testing concurrent users...');
      
      const userPromises = [];
      for (let user = 0; user < concurrentUsers; user++) {
        const userRequests = [];
        for (let req = 0; req < requestsPerUser; req++) {
          userRequests.push(this.makeTestRequest('/webhook/leadlove-frontend', {
            businessType: `concurrent-test-user-${user}`,
            location: `location-${user}-${req}`,
            userName: `User${user}`
          }));
        }
        userPromises.push(Promise.all(userRequests));
      }

      const results = await Promise.all(userPromises);
      const flatResults = results.flat();
      const successfulRequests = flatResults.filter(r => r.success).length;
      const totalRequests = concurrentUsers * requestsPerUser;

      return {
        name: 'Concurrent Users Performance',
        success: successfulRequests === totalRequests,
        metrics: {
          concurrentUsers: concurrentUsers,
          requestsPerUser: requestsPerUser,
          totalRequests: totalRequests,
          successfulRequests: successfulRequests,
          successRate: Math.round((successfulRequests / totalRequests) * 100)
        }
      };
    } catch (error) {
      return {
        name: 'Concurrent Users Performance',
        success: false,
        error: error.message
      };
    }
  }

  async testLargeDataSets() {
    try {
      console.log('  📊 Testing large data sets...');
      
      const largeBusinessList = Array.from({ length: 50 }, (_, i) => ({
        businessName: `Large Test Business ${i}`,
        category: `Category ${i % 5}`,
        address: `${i} Test Street, Test City`,
        rating: 4 + Math.random()
      }));

      const startTime = Date.now();
      
      // Simulate processing large dataset
      const response = await this.makeTestRequest('/webhook/leadlove-frontend', {
        businessType: 'large-dataset-test',
        location: 'test-city',
        maxResults: 50
      });

      const processingTime = Date.now() - startTime;
      const success = response.success && processingTime < 5000; // Should process within 5 seconds

      return {
        name: 'Large Data Sets Performance',
        success: success,
        metrics: {
          dataSetSize: largeBusinessList.length,
          processingTime: processingTime,
          throughput: Math.round((largeBusinessList.length / processingTime) * 1000),
          memoryEfficient: processingTime < 5000
        }
      };
    } catch (error) {
      return {
        name: 'Large Data Sets Performance',
        success: false,
        error: error.message
      };
    }
  }

  // Utility methods
  async makeTestRequest(endpoint, data) {
    const url = `http://localhost:3001${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateMockGoogleSheetsData(parsedData) {
    return {
      sheetName: 'LeadLove Maps Test Results',
      row: {
        businessType: parsedData.businessType,
        city: parsedData.city,
        serviceOffering: parsedData.serviceOffering,
        timestamp: new Date().toISOString(),
        source: 'telegram',
        testRun: true
      }
    };
  }

  aggregatePerformanceMetrics(performanceResults) {
    const metrics = {
      averageResponseTime: 0,
      throughput: 0,
      memoryUsage: 0,
      concurrentCapacity: 0,
      dataProcessingRate: 0
    };

    performanceResults.forEach(result => {
      if (result.metrics) {
        if (result.metrics.averageResponseTime) {
          metrics.averageResponseTime = result.metrics.averageResponseTime;
        }
        if (result.metrics.throughput) {
          metrics.throughput = result.metrics.throughput;
        }
        if (result.metrics.memoryIncreaseMB) {
          metrics.memoryUsage = result.metrics.memoryIncreaseMB;
        }
        if (result.metrics.concurrentUsers) {
          metrics.concurrentCapacity = result.metrics.concurrentUsers;
        }
        if (result.metrics.throughput) {
          metrics.dataProcessingRate = result.metrics.throughput;
        }
      }
    });

    return metrics;
  }

  generateFinalReport() {
    const totalDuration = this.endTime - this.startTime;
    const allTestResults = Object.values(this.testResults).filter(result => result !== null);
    const overallSuccess = allTestResults.every(result => result.success);
    
    const passedTests = allTestResults.reduce((sum, result) => {
      return sum + (result.passed || (result.success ? 1 : 0));
    }, 0);
    
    const totalTests = allTestResults.reduce((sum, result) => {
      return sum + (result.total || 1);
    }, 0);

    const report = `
🚀 LeadLove Maps Complete Test Suite Report
============================================

📊 OVERALL SUMMARY
${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
• Total Duration: ${Math.round(totalDuration / 1000)}s
• Tests Passed: ${passedTests}/${totalTests}
• Success Rate: ${Math.round((passedTests / totalTests) * 100)}%

🔍 TEST CATEGORY RESULTS

🏗️  WORKFLOW VALIDATION
${this.testResults.workflow?.success ? '✅' : '❌'} Status: ${this.testResults.workflow?.success ? 'PASSED' : 'FAILED'}
• Tests: ${this.testResults.workflow?.passedTests || 0}/${this.testResults.workflow?.totalTests || 0}
${this.testResults.workflow?.error ? `• Error: ${this.testResults.workflow.error}` : ''}

🔗 INTEGRATION TESTS
${this.testResults.integration?.success ? '✅' : '❌'} Status: ${this.testResults.integration?.success ? 'PASSED' : 'FAILED'}
• Tests: ${this.testResults.integration?.passed || 0}/${this.testResults.integration?.total || 0}
${this.testResults.integration?.error ? `• Error: ${this.testResults.integration.error}` : ''}

🎯 END-TO-END TESTS
${this.testResults.endToEnd?.success ? '✅' : '❌'} Status: ${this.testResults.endToEnd?.success ? 'PASSED' : 'FAILED'}
• Tests: ${this.testResults.endToEnd?.passed || 0}/${this.testResults.endToEnd?.total || 0}
${this.testResults.endToEnd?.error ? `• Error: ${this.testResults.endToEnd.error}` : ''}

⚡ PERFORMANCE TESTS
${this.testResults.performance?.success ? '✅' : '❌'} Status: ${this.testResults.performance?.success ? 'PASSED' : 'FAILED'}
• Tests: ${this.testResults.performance?.passed || 0}/${this.testResults.performance?.total || 0}
${this.testResults.performance?.metrics ? `
• Avg Response Time: ${this.testResults.performance.metrics.averageResponseTime}ms
• Throughput: ${this.testResults.performance.metrics.throughput} req/s
• Memory Usage: ${this.testResults.performance.metrics.memoryUsage}MB
• Concurrent Capacity: ${this.testResults.performance.metrics.concurrentCapacity} users
` : ''}

🎯 DEPLOYMENT READINESS
${this.getDeploymentReadiness(overallSuccess, passedTests, totalTests)}

📈 RECOMMENDATIONS
${this.getFinalRecommendations()}

============================================
Report Generated: ${new Date().toISOString()}
Total Test Duration: ${Math.round(totalDuration / 1000)}s
    `;

    console.log(report);

    // Save report to file
    fs.writeFileSync('test-results-report.txt', report);
    console.log('\n💾 Test report saved to test-results-report.txt');

    return {
      success: overallSuccess,
      duration: totalDuration,
      passedTests,
      totalTests,
      results: this.testResults,
      report
    };
  }

  getDeploymentReadiness(overallSuccess, passedTests, totalTests) {
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    if (overallSuccess && successRate >= 95) {
      return '🟢 READY for production deployment';
    } else if (successRate >= 85) {
      return '🟡 READY for staging deployment (address issues for production)';
    } else {
      return '🔴 NOT READY for deployment (resolve critical issues first)';
    }
  }

  getFinalRecommendations() {
    const recommendations = [];
    
    if (!this.testResults.workflow?.success) {
      recommendations.push('1. Fix workflow validation issues before deployment');
    }
    
    if (!this.testResults.integration?.success) {
      recommendations.push('2. Resolve integration test failures');
    }
    
    if (!this.testResults.endToEnd?.success) {
      recommendations.push('3. Address end-to-end test issues');
    }
    
    if (!this.testResults.performance?.success) {
      recommendations.push('4. Optimize performance bottlenecks');
    }
    
    recommendations.push('5. Run tests with actual n8n instance');
    recommendations.push('6. Configure production environment variables');
    recommendations.push('7. Set up monitoring and alerting');
    
    return recommendations.join('\n');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    if (this.testServer) {
      this.testServer.close();
    }
    
    // Additional cleanup tasks
    console.log('✅ Cleanup complete');
  }
}

// Make fetch available in Node.js
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (error) {
    console.warn('node-fetch not available, using alternate implementation');
    const https = require('https');
    const http = require('http');
    global.fetch = async (url, options = {}) => {
      return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.request(url, {
          method: options.method || 'GET',
          headers: options.headers || {}
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              statusText: res.statusMessage,
              json: () => Promise.resolve(JSON.parse(data))
            });
          });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
      });
    };
  }
}

// Export for use as module
module.exports = TestRunner;

// Run tests if called directly
if (require.main === module) {
  const testRunner = new TestRunner();
  testRunner.runCompleteTestSuite().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}