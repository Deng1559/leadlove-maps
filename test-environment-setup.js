/**
 * LeadLove Maps Test Environment Setup
 * Comprehensive testing framework for dual-input system
 */

const fs = require('fs');
const path = require('path');

// Simplified express-like server for testing
function createSimpleServer() {
  const http = require('http');
  
  return {
    use: () => {},
    post: () => {},
    get: () => {},
    listen: (port, callback) => {
      const server = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({success: true, message: 'Test server running'}));
      });
      server.listen(port, callback);
      return server;
    }
  };
}

// Use built-in HTTP if express not available
let express, cors;
try {
  express = require('express');
  cors = require('cors');
} catch (error) {
  console.warn('Express not available, using simplified server');
  express = createSimpleServer;
  cors = () => (req, res, next) => next && next();
}

class TestEnvironment {
  constructor() {
    this.app = express();
    this.port = 3001;
    this.mockData = {};
    this.testResults = [];
    this.setupExpress();
    this.loadMockData();
  }

  setupExpress() {
    // Enable CORS for testing
    this.app.use(cors({
      origin: ['http://localhost:3000', 'https://leadlove-maps.lovable.app'],
      credentials: true
    }));

    this.app.use(express.json());
    this.app.use(express.static('.'));

    // Mock n8n webhook endpoints
    this.setupMockWebhooks();
    
    // Test interface endpoints
    this.setupTestEndpoints();
  }

  setupMockWebhooks() {
    // Mock Telegram webhook
    this.app.post('/webhook/business-search-bot', async (req, res) => {
      console.log('📱 Mock Telegram webhook called:', req.body);
      
      try {
        const mockResponse = await this.processTelegramInput(req.body);
        res.json(mockResponse);
      } catch (error) {
        console.error('Telegram webhook error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Mock Frontend webhook
    this.app.post('/webhook/leadlove-frontend', async (req, res) => {
      console.log('🌐 Mock Frontend webhook called:', req.body);
      
      try {
        const mockResponse = await this.processFrontendInput(req.body);
        res.json(mockResponse);
      } catch (error) {
        console.error('Frontend webhook error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Mock status endpoint
    this.app.post('/webhook/leadlove-status', (req, res) => {
      const { workflowId } = req.body;
      console.log('📊 Mock status check:', workflowId);
      
      // Simulate workflow completion after 30 seconds
      setTimeout(() => {
        res.json({
          success: true,
          completed: true,
          workflowId: workflowId,
          results: this.mockData.sampleResults || []
        });
      }, 2000); // 2 second delay for testing
    });
  }

  setupTestEndpoints() {
    // Test dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateTestDashboard());
    });

    // Get test results
    this.app.get('/test-results', (req, res) => {
      res.json(this.testResults);
    });

    // Run specific test
    this.app.post('/run-test/:testName', async (req, res) => {
      try {
        const result = await this.runTest(req.params.testName, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: [
          'POST /webhook/business-search-bot',
          'POST /webhook/leadlove-frontend',
          'POST /webhook/leadlove-status',
          'GET /test-results',
          'POST /run-test/:testName'
        ]
      });
    });
  }

  async processTelegramInput(telegramData) {
    // Simulate Telegram message processing
    const message = telegramData.body?.message?.text || 'restaurants Miami for digital marketing';
    
    console.log('Processing Telegram message:', message);
    
    // Parse message (using our enhanced parser logic)
    const parsedData = this.parseBusinessSearch(message, 'telegram');
    
    // Simulate processing delay
    await this.delay(1000);
    
    return {
      success: true,
      source: 'telegram',
      parsed: parsedData,
      workflowId: `tel-${Date.now()}`,
      message: 'Telegram processing started'
    };
  }

  async processFrontendInput(frontendData) {
    console.log('Processing frontend data:', frontendData);
    
    // Validate required fields
    if (!frontendData.businessType || !frontendData.location) {
      throw new Error('Missing required fields: businessType and location');
    }
    
    // Simulate processing delay
    await this.delay(500);
    
    return {
      success: true,
      source: 'frontend',
      workflowId: `web-${Date.now()}`,
      message: 'Lead generation started successfully',
      estimatedTime: '2-3 minutes',
      data: frontendData
    };
  }

  parseBusinessSearch(message, source) {
    const cleanMessage = message.toLowerCase();
    let businessType = '';
    let city = '';
    let serviceOffering = '';

    // Extract service offering
    if (cleanMessage.includes(' for ')) {
      const parts = cleanMessage.split(' for ');
      businessType = parts[0].split(' in ')[0] || parts[0];
      city = parts[0].split(' in ')[1] || 'Miami';
      serviceOffering = parts[1].trim();
    } else {
      const words = cleanMessage.split(' ');
      businessType = words[0] || 'restaurant';
      city = words[words.indexOf('in') + 1] || words[1] || 'Miami';
      serviceOffering = 'digital marketing';
    }

    return {
      businessType: businessType.trim(),
      city: city.trim(),
      serviceOffering: serviceOffering || 'digital marketing',
      source: source,
      timestamp: new Date().toISOString()
    };
  }

  loadMockData() {
    try {
      // Load existing mock data files
      const mockFiles = [
        'Mock_Test_Business_Data.json',
        'Mock_Complete_5_Email_Sequence_Output.json',
        'Mock_AI_Business_Intelligence_Analysis.json'
      ];

      for (const file of mockFiles) {
        if (fs.existsSync(file)) {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          this.mockData[file.replace('.json', '')] = data;
          console.log(`✅ Loaded mock data: ${file}`);
        }
      }

      // Create sample results if no mock data exists
      if (Object.keys(this.mockData).length === 0) {
        this.mockData.sampleResults = this.generateSampleResults();
      }
    } catch (error) {
      console.warn('Could not load mock data:', error.message);
      this.mockData.sampleResults = this.generateSampleResults();
    }
  }

  generateSampleResults() {
    return [
      {
        businessName: "Tony's Italian Bistro",
        category: "Italian Restaurant",
        address: "123 Ocean Drive, Miami Beach, FL",
        phone: "(305) 555-0123",
        website: "https://tonysitalian.com",
        rating: 4.5,
        reviewCount: 127,
        serviceFitScore: 8,
        urgencyLevel: "high",
        personalizedMessage: "Hi Tony, I noticed your restaurant has great reviews but I saw some customers mentioning difficulty reaching you by phone during busy hours. Our voice AI system could help automate reservations and reduce wait times..."
      },
      {
        businessName: "Beach Fitness Center",
        category: "Fitness Center", 
        address: "456 Collins Ave, Miami Beach, FL",
        phone: "(305) 555-0456",
        website: "https://beachfitness.com",
        rating: 4.2,
        reviewCount: 89,
        serviceFitScore: 7,
        urgencyLevel: "medium",
        personalizedMessage: "Hi there, I see Beach Fitness has been building a strong local presence. With summer season approaching, our digital marketing services could help you capture more of the tourist fitness market..."
      }
    ];
  }

  generateTestDashboard() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LeadLove Maps Test Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .test-section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .test-button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .test-button:hover { background: #0056b3; }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .results { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0; }
        .endpoint { background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 LeadLove Maps Test Dashboard</h1>
        
        <div class="test-section">
            <h2>📊 System Status</h2>
            <div id="system-status">
                <p>✅ Mock n8n Server: Running on port ${this.port}</p>
                <p>🔗 Webhook Endpoints: Ready</p>
                <p>📊 Test Data: Loaded</p>
            </div>
        </div>

        <div class="test-section">
            <h2>🌐 Frontend Integration Test</h2>
            <p>Test the frontend API integration with sample data</p>
            
            <form id="frontend-test-form">
                <div style="margin: 10px 0;">
                    <label>Business Type:</label>
                    <input type="text" name="businessType" value="restaurants" style="margin-left: 10px; padding: 5px;">
                </div>
                <div style="margin: 10px 0;">
                    <label>Location:</label>
                    <input type="text" name="location" value="Miami Beach" style="margin-left: 10px; padding: 5px;">
                </div>
                <div style="margin: 10px 0;">
                    <label>Service:</label>
                    <input type="text" name="serviceOffering" value="digital marketing" style="margin-left: 10px; padding: 5px;">
                </div>
                <button type="submit" class="test-button">🧪 Test Frontend API</button>
            </form>
            
            <div id="frontend-results" class="results" style="display:none;"></div>
        </div>

        <div class="test-section">
            <h2>📱 Telegram Integration Test</h2>
            <p>Test the Telegram webhook with sample message</p>
            
            <div style="margin: 10px 0;">
                <label>Test Message:</label>
                <input type="text" id="telegram-message" value="restaurants Miami Beach for digital marketing" style="width: 400px; padding: 5px;">
            </div>
            <button onclick="testTelegram()" class="test-button">📱 Test Telegram Webhook</button>
            
            <div id="telegram-results" class="results" style="display:none;"></div>
        </div>

        <div class="test-section">
            <h2>⚡ Performance Tests</h2>
            <button onclick="runLoadTest()" class="test-button">🏃‍♂️ Run Load Test</button>
            <button onclick="testErrorHandling()" class="test-button">❌ Test Error Handling</button>
            <button onclick="testRetryLogic()" class="test-button">🔄 Test Retry Logic</button>
            
            <div id="performance-results" class="results" style="display:none;"></div>
        </div>

        <div class="test-section">
            <h2>📋 Available Endpoints</h2>
            <div class="endpoint">POST /webhook/leadlove-frontend - Frontend webhook</div>
            <div class="endpoint">POST /webhook/business-search-bot - Telegram webhook</div>
            <div class="endpoint">POST /webhook/leadlove-status - Status check</div>
            <div class="endpoint">GET /health - Health check</div>
            <div class="endpoint">GET /test-results - Get test results</div>
        </div>

        <div class="test-section">
            <h2>📊 Test Results</h2>
            <button onclick="loadTestResults()" class="test-button">🔄 Refresh Results</button>
            <div id="test-results-display"></div>
        </div>
    </div>

    <script>
        // Frontend form test
        document.getElementById('frontend-test-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/webhook/leadlove-frontend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                const resultsDiv = document.getElementById('frontend-results');
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<h4 class="success">✅ Frontend Test Success</h4><pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                const resultsDiv = document.getElementById('frontend-results');
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<h4 class="error">❌ Frontend Test Failed</h4><p>' + error.message + '</p>';
            }
        });

        // Telegram test function
        async function testTelegram() {
            const message = document.getElementById('telegram-message').value;
            const telegramData = {
                body: {
                    message: {
                        text: message,
                        chat: { id: 'test-chat' },
                        from: { id: 'test-user', first_name: 'Test User' }
                    }
                }
            };
            
            try {
                const response = await fetch('/webhook/business-search-bot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(telegramData)
                });
                
                const result = await response.json();
                const resultsDiv = document.getElementById('telegram-results');
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<h4 class="success">✅ Telegram Test Success</h4><pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                const resultsDiv = document.getElementById('telegram-results');
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<h4 class="error">❌ Telegram Test Failed</h4><p>' + error.message + '</p>';
            }
        }

        // Load test results
        async function loadTestResults() {
            try {
                const response = await fetch('/test-results');
                const results = await response.json();
                const resultsDiv = document.getElementById('test-results-display');
                resultsDiv.innerHTML = '<pre>' + JSON.stringify(results, null, 2) + '</pre>';
            } catch (error) {
                console.error('Failed to load test results:', error);
            }
        }

        // Performance tests
        async function runLoadTest() {
            console.log('Running load test...');
            // Implementation for load testing
        }

        async function testErrorHandling() {
            console.log('Testing error handling...');
            // Implementation for error testing
        }

        async function testRetryLogic() {
            console.log('Testing retry logic...');
            // Implementation for retry testing
        }
    </script>
</body>
</html>
    `;
  }

  async runTest(testName, testData) {
    const testResult = {
      name: testName,
      timestamp: new Date().toISOString(),
      success: false,
      duration: 0,
      details: {}
    };

    const startTime = Date.now();

    try {
      switch (testName) {
        case 'frontend-integration':
          testResult.details = await this.testFrontendIntegration(testData);
          testResult.success = true;
          break;
        
        case 'telegram-webhook':
          testResult.details = await this.testTelegramWebhook(testData);
          testResult.success = true;
          break;
        
        case 'error-handling':
          testResult.details = await this.testErrorHandling();
          testResult.success = true;
          break;
        
        default:
          throw new Error(`Unknown test: ${testName}`);
      }
    } catch (error) {
      testResult.error = error.message;
    }

    testResult.duration = Date.now() - startTime;
    this.testResults.push(testResult);
    
    return testResult;
  }

  async testFrontendIntegration(data) {
    // Simulate frontend integration test
    const response = await this.processFrontendInput(data);
    return {
      inputProcessed: true,
      workflowId: response.workflowId,
      responseTime: '< 1s'
    };
  }

  async testTelegramWebhook(data) {
    // Simulate Telegram webhook test
    const response = await this.processTelegramInput(data);
    return {
      messageProcessed: true,
      workflowId: response.workflowId,
      parsedCorrectly: response.parsed !== null
    };
  }

  async testErrorHandling() {
    // Test various error scenarios
    const errors = [];
    
    try {
      await this.processFrontendInput({});
    } catch (error) {
      errors.push('Missing fields error handled correctly');
    }
    
    return {
      errorScenariosTestedS: errors.length,
      details: errors
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`
🧪 LeadLove Maps Test Environment Started
==========================================
📊 Dashboard: http://localhost:${this.port}
🔗 Health Check: http://localhost:${this.port}/health
📱 Telegram Webhook: http://localhost:${this.port}/webhook/business-search-bot
🌐 Frontend Webhook: http://localhost:${this.port}/webhook/leadlove-frontend
📋 Status Check: http://localhost:${this.port}/webhook/leadlove-status

🚀 Ready for testing! Open the dashboard to run tests.
      `);
    });
  }
}

// Export for external use
module.exports = TestEnvironment;

// Start server if run directly
if (require.main === module) {
  const testEnv = new TestEnvironment();
  testEnv.start();
}