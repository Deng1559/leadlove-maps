/**
 * Advanced Mock Server
 * Provides sophisticated mocking for external APIs and services
 */

const express = require('express');
const cors = require('cors');
const TestDataFactory = require('../factories/testDataFactory');

class AdvancedMockServer {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.server = null;
    this.factory = new TestDataFactory(12345); // Consistent seed
    this.scenarios = this.factory.createTestScenarios();
    this.requestLog = [];
    this.responseDelays = new Map();
    this.failureRates = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      this.requestLog.push({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body,
        query: req.query
      });
      next();
    });

    // Response delay simulation
    this.app.use(async (req, res, next) => {
      const delay = this.responseDelays.get(req.path) || 0;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      next();
    });

    // Failure rate simulation
    this.app.use((req, res, next) => {
      const failureRate = this.failureRates.get(req.path) || 0;
      if (Math.random() < failureRate) {
        return res.status(500).json(this.factory.createApiError('server_error'));
      }
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Mock Google Maps Places API
    this.setupGoogleMapsRoutes();
    
    // Mock Supabase API
    this.setupSupabaseRoutes();
    
    // Mock Stripe API
    this.setupStripeRoutes();
    
    // Mock n8n Webhook endpoints
    this.setupN8nRoutes();
    
    // Mock external services
    this.setupExternalServiceRoutes();
    
    // Test utilities
    this.setupTestUtilityRoutes();
  }

  setupGoogleMapsRoutes() {
    // Places Text Search
    this.app.get('/maps/api/place/textsearch/json', (req, res) => {
      const { query, location, radius } = req.query;
      
      if (!query) {
        return res.status(400).json({
          error_message: "Missing required parameter 'query'",
          status: 'INVALID_REQUEST'
        });
      }

      // Simulate different scenarios based on query
      if (query.includes('nonexistent')) {
        return res.json({
          results: [],
          status: 'ZERO_RESULTS'
        });
      }

      const businesses = Array.from({ length: Math.min(20, parseInt(req.query.maxResults) || 10) }, 
        () => this.factory.createBusiness());

      res.json({
        results: businesses,
        status: 'OK',
        next_page_token: Math.random() > 0.7 ? this.factory.faker.string.alphanumeric(20) : undefined
      });
    });

    // Place Details
    this.app.get('/maps/api/place/details/json', (req, res) => {
      const { place_id } = req.query;
      
      if (!place_id) {
        return res.status(400).json({
          error_message: "Missing required parameter 'place_id'",
          status: 'INVALID_REQUEST'
        });
      }

      const business = this.factory.createBusiness({ place_id });
      
      res.json({
        result: business,
        status: 'OK'
      });
    });

    // Geocoding API
    this.app.get('/maps/api/geocode/json', (req, res) => {
      const { address } = req.query;
      
      res.json({
        results: [{
          formatted_address: address,
          geometry: {
            location: {
              lat: this.factory.faker.location.latitude(),
              lng: this.factory.faker.location.longitude()
            }
          },
          place_id: this.factory.faker.string.alphanumeric(27)
        }],
        status: 'OK'
      });
    });
  }

  setupSupabaseRoutes() {
    // Auth endpoints
    this.app.post('/auth/v1/token', (req, res) => {
      const { email, password } = req.body;
      
      if (email && password) {
        const user = this.factory.createUser({ email });
        res.json({
          access_token: this.factory.faker.string.alphanumeric(40),
          refresh_token: this.factory.faker.string.alphanumeric(40),
          user,
          expires_in: 3600
        });
      } else {
        res.status(400).json({ error: 'Invalid credentials' });
      }
    });

    // Database REST API simulation
    this.app.get('/rest/v1/usage', (req, res) => {
      const { limit = 10, offset = 0 } = req.query;
      const usage = Array.from({ length: parseInt(limit) }, () => this.factory.createUsageRecord());
      
      res.json(usage);
    });

    this.app.post('/rest/v1/usage', (req, res) => {
      const usageRecord = this.factory.createUsageRecord(req.body);
      res.status(201).json(usageRecord);
    });

    // User profile
    this.app.get('/rest/v1/profiles', (req, res) => {
      const user = this.factory.createUser();
      res.json([user]);
    });
  }

  setupStripeRoutes() {
    // Create checkout session
    this.app.post('/v1/checkout/sessions', (req, res) => {
      const session = {
        id: `cs_${this.factory.faker.string.alphanumeric(24)}`,
        url: `https://checkout.stripe.com/pay/cs_${this.factory.faker.string.alphanumeric(24)}`,
        payment_status: 'unpaid',
        status: 'open'
      };
      
      res.json(session);
    });

    // Customer portal
    this.app.post('/v1/billing_portal/sessions', (req, res) => {
      const session = {
        id: `bps_${this.factory.faker.string.alphanumeric(24)}`,
        url: `https://billing.stripe.com/p/session/${this.factory.faker.string.alphanumeric(24)}`
      };
      
      res.json(session);
    });

    // Webhooks endpoint
    this.app.post('/stripe/webhooks', (req, res) => {
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      // Simulate webhook processing
      res.json({
        received: true,
        processed: true,
        message: 'Webhook processed successfully'
      });
    });
  }

  setupN8nRoutes() {
    // Webhook endpoints
    this.app.post('/webhook/leadlove-frontend', (req, res) => {
      const { businessType, location, serviceOffering } = req.body;
      
      if (!businessType || !location) {
        return res.status(400).json(this.factory.createApiError('validation'));
      }

      const workflowId = this.factory.faker.string.uuid();
      
      res.json({
        success: true,
        message: 'Workflow initiated successfully',
        workflowId,
        estimatedCompletionTime: 180, // 3 minutes
        data: {
          businessType,
          location,
          serviceOffering,
          timestamp: new Date().toISOString()
        }
      });
    });

    this.app.post('/webhook/business-search-bot', (req, res) => {
      const { message } = req.body?.body || {};
      
      if (!message?.text) {
        return res.status(400).json(this.factory.createApiError('validation'));
      }

      // Parse Telegram message
      const text = message.text;
      const parsed = this.parseTelegramMessage(text);

      res.json({
        success: true,
        message: 'Message processed successfully',
        parsed,
        chatId: message.chat?.id,
        userId: message.from?.id
      });
    });

    this.app.post('/webhook/leadlove-status', (req, res) => {
      const { workflowId } = req.body;
      
      if (!workflowId) {
        return res.status(400).json(this.factory.createApiError('validation'));
      }

      const status = this.factory.createWorkflowStatus({ workflowId });
      res.json({
        success: true,
        ...status
      });
    });
  }

  setupExternalServiceRoutes() {
    // OpenAI API Mock
    this.app.post('/v1/chat/completions', (req, res) => {
      const { messages, model } = req.body;
      
      res.json({
        id: `chatcmpl-${this.factory.faker.string.alphanumeric(29)}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model || 'gpt-3.5-turbo',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: this.generateMockAIResponse(messages)
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: this.factory.faker.number.int({ min: 50, max: 200 }),
          completion_tokens: this.factory.faker.number.int({ min: 20, max: 100 }),
          total_tokens: this.factory.faker.number.int({ min: 70, max: 300 })
        }
      });
    });

    // Email service mock
    this.app.post('/send-email', (req, res) => {
      const { to, subject, html, text } = req.body;
      
      res.json({
        success: true,
        messageId: this.factory.faker.string.alphanumeric(32),
        to,
        subject,
        status: 'sent'
      });
    });
  }

  setupTestUtilityRoutes() {
    // Get request log
    this.app.get('/test/requests', (req, res) => {
      res.json({
        requests: this.requestLog,
        count: this.requestLog.length
      });
    });

    // Clear request log
    this.app.delete('/test/requests', (req, res) => {
      this.requestLog = [];
      res.json({ cleared: true });
    });

    // Set response delays
    this.app.post('/test/delays', (req, res) => {
      const { path, delay } = req.body;
      this.responseDelays.set(path, delay);
      res.json({ set: true, path, delay });
    });

    // Set failure rates
    this.app.post('/test/failures', (req, res) => {
      const { path, rate } = req.body;
      this.failureRates.set(path, rate);
      res.json({ set: true, path, rate });
    });

    // Reset all test configurations
    this.app.post('/test/reset', (req, res) => {
      this.requestLog = [];
      this.responseDelays.clear();
      this.failureRates.clear();
      res.json({ reset: true });
    });

    // Generate test data
    this.app.get('/test/data/:type', (req, res) => {
      const { type } = req.params;
      const { count = 1 } = req.query;
      
      const generators = {
        user: () => this.factory.createUser(),
        business: () => this.factory.createBusiness(),
        usage: () => this.factory.createUsageRecord(),
        request: () => this.factory.createLeadGenerationRequest(),
        workflow: () => this.factory.createWorkflowStatus(),
        error: () => this.factory.createApiError(),
        scenario: () => this.factory.createTestScenarios()
      };

      if (generators[type]) {
        if (type === 'scenario') {
          res.json(generators[type]());
        } else {
          const data = Array.from({ length: parseInt(count) }, generators[type]);
          res.json(count === '1' ? data[0] : data);
        }
      } else {
        res.status(404).json({ error: 'Unknown data type' });
      }
    });
  }

  parseTelegramMessage(text) {
    // Simple parsing logic for Telegram messages
    const parts = text.toLowerCase().split(' for ');
    
    if (parts.length >= 2) {
      const businessTypePart = parts[0].trim();
      const locationAndService = parts[1].trim();
      const serviceStart = locationAndService.indexOf(' for ');
      
      let location = locationAndService;
      let serviceOffering = 'general services';
      
      if (serviceStart !== -1) {
        location = locationAndService.substring(0, serviceStart).trim();
        serviceOffering = locationAndService.substring(serviceStart + 5).trim();
      }

      return {
        businessType: businessTypePart,
        location: location,
        serviceOffering: serviceOffering,
        confidence: 0.85
      };
    }

    return {
      businessType: 'general business',
      location: text,
      serviceOffering: 'general services',
      confidence: 0.3
    };
  }

  generateMockAIResponse(messages) {
    const responses = [
      "Based on the business information provided, here's a personalized email approach that addresses their specific needs and pain points.",
      "After analyzing the customer reviews and business profile, I've identified key opportunities for improvement that would benefit from our services.",
      "The local market analysis suggests this business would be an excellent fit for our digital marketing solutions.",
      "Here's a detailed assessment of their online presence and recommendations for enhancement."
    ];

    return this.factory.faker.helpers.arrayElement(responses);
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🔧 Advanced Mock Server running on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
        console.log('🔧 Advanced Mock Server stopped');
      } else {
        resolve();
      }
    });
  }

  // Test helper methods
  getRequestLog() {
    return this.requestLog;
  }

  clearRequestLog() {
    this.requestLog = [];
  }

  setDelay(path, delay) {
    this.responseDelays.set(path, delay);
  }

  setFailureRate(path, rate) {
    this.failureRates.set(path, rate);
  }

  resetTestConfig() {
    this.requestLog = [];
    this.responseDelays.clear();
    this.failureRates.clear();
  }
}

module.exports = AdvancedMockServer;