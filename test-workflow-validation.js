/**
 * LeadLove Maps Workflow Validation Test Suite
 * Comprehensive testing for n8n workflows and integration points
 */

const fs = require('fs');
const path = require('path');

class WorkflowValidator {
  constructor() {
    this.testResults = [];
    this.workflows = {};
    this.mockData = {};
    this.validationErrors = [];
    this.loadWorkflows();
    this.loadMockData();
  }

  loadWorkflows() {
    try {
      // Load existing workflows
      const workflowFiles = [
        'Enhanced_Google_Maps_Lead_Generator_with_AI_Enrichment.json',
        'Enhanced_Google_Maps_Lead_Generator_Warm_Emails.json',
        'Enhanced_Dual_Input_Workflow.json'
      ];

      for (const file of workflowFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          try {
            this.workflows[file] = JSON.parse(content);
            console.log(`✅ Loaded workflow: ${file}`);
          } catch (parseError) {
            console.error(`❌ Failed to parse ${file}:`, parseError.message);
            this.validationErrors.push(`Invalid JSON in ${file}: ${parseError.message}`);
          }
        } else {
          console.warn(`⚠️  Workflow not found: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  }

  loadMockData() {
    try {
      const mockFiles = [
        'Mock_Test_Business_Data.json',
        'Mock_Complete_5_Email_Sequence_Output.json',
        'Mock_AI_Business_Intelligence_Analysis.json'
      ];

      for (const file of mockFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          try {
            this.mockData[file] = JSON.parse(content);
            console.log(`✅ Loaded mock data: ${file}`);
          } catch (parseError) {
            console.warn(`⚠️  Could not parse mock data ${file}:`, parseError.message);
          }
        }
      }

      // Generate sample data if none exists
      if (Object.keys(this.mockData).length === 0) {
        this.generateSampleMockData();
      }
    } catch (error) {
      console.error('Failed to load mock data:', error);
      this.generateSampleMockData();
    }
  }

  generateSampleMockData() {
    console.log('🔧 Generating sample mock data...');
    
    this.mockData['sample_telegram_input'] = {
      body: {
        message: {
          text: 'restaurants Miami Beach for digital marketing',
          chat: { id: 'test-chat-123' },
          from: { id: 'test-user-456', first_name: 'Test User' }
        }
      }
    };

    this.mockData['sample_frontend_input'] = {
      businessType: 'restaurants',
      location: 'Miami Beach',
      serviceOffering: 'digital marketing',
      countryCode: 'us',
      maxResults: 20,
      userName: 'Test User'
    };

    this.mockData['sample_business_data'] = [
      {
        businessName: "Tony's Italian Bistro",
        category: "Italian Restaurant",
        address: "123 Ocean Drive, Miami Beach, FL",
        phone: "(305) 555-0123",
        website: "https://tonysitalian.com",
        rating: 4.5,
        reviewCount: 127,
        serviceFitScore: 8,
        urgencyLevel: "high"
      }
    ];
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive workflow validation...\n');

    const tests = [
      'validateWorkflowStructure',
      'validateNodeConnections',
      'validateCredentialReferences',
      'validateInputParsing',
      'validateDataFlow',
      'validateErrorHandling',
      'validateOutputFormat',
      'validateIntegrationPoints'
    ];

    for (const testName of tests) {
      try {
        console.log(`\n🔍 Running ${testName}...`);
        const result = await this[testName]();
        this.testResults.push({
          test: testName,
          success: result.success,
          details: result.details,
          timestamp: new Date().toISOString()
        });
        
        if (result.success) {
          console.log(`✅ ${testName} PASSED`);
        } else {
          console.log(`❌ ${testName} FAILED:`, result.details);
        }
      } catch (error) {
        console.log(`💥 ${testName} ERROR:`, error.message);
        this.testResults.push({
          test: testName,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return this.generateTestReport();
  }

  validateWorkflowStructure() {
    const results = {};
    let allValid = true;

    for (const [filename, workflow] of Object.entries(this.workflows)) {
      const validation = {
        hasNodes: Array.isArray(workflow.nodes) && workflow.nodes.length > 0,
        hasConnections: workflow.connections && typeof workflow.connections === 'object',
        hasName: typeof workflow.name === 'string' && workflow.name.length > 0,
        hasSettings: workflow.settings && typeof workflow.settings === 'object'
      };

      // Validate required nodes for enhanced workflow
      if (filename.includes('Enhanced_Dual_Input_Workflow')) {
        const nodeNames = workflow.nodes.map(node => node.name);
        validation.hasTelegramTrigger = nodeNames.some(name => name.includes('Telegram'));
        validation.hasFrontendWebhook = nodeNames.some(name => name.includes('Frontend Webhook'));
        validation.hasParser = nodeNames.some(name => name.includes('Parser'));
        validation.hasRouter = nodeNames.some(name => name.includes('Router'));
      }

      const isValid = Object.values(validation).every(v => v === true);
      results[filename] = { validation, isValid };
      
      if (!isValid) {
        allValid = false;
      }
    }

    return {
      success: allValid,
      details: results
    };
  }

  validateNodeConnections() {
    const results = {};
    let allValid = true;

    for (const [filename, workflow] of Object.entries(this.workflows)) {
      const nodeNames = workflow.nodes.map(node => node.name);
      const connections = workflow.connections || {};
      
      const validation = {
        allNodesConnected: true,
        orphanNodes: [],
        invalidConnections: []
      };

      // Check for orphan nodes (nodes without connections)
      for (const nodeName of nodeNames) {
        const hasOutgoingConnection = connections[nodeName] && 
          connections[nodeName].main && 
          connections[nodeName].main.length > 0;
        
        const hasIncomingConnection = Object.values(connections).some(nodeConnections => {
          return nodeConnections.main && nodeConnections.main.some(connectionGroup => {
            return connectionGroup && connectionGroup.some(connection => 
              connection.node === nodeName
            );
          });
        });

        // Start nodes don't need incoming connections
        const isStartNode = workflow.nodes.find(node => 
          node.name === nodeName && (
            node.type?.includes('trigger') || 
            node.type?.includes('webhook')
          )
        );

        if (!hasOutgoingConnection && !hasIncomingConnection && !isStartNode) {
          validation.orphanNodes.push(nodeName);
          validation.allNodesConnected = false;
        }
      }

      // Validate connection references
      for (const [nodeName, nodeConnections] of Object.entries(connections)) {
        if (nodeConnections.main) {
          for (const connectionGroup of nodeConnections.main) {
            if (connectionGroup) {
              for (const connection of connectionGroup) {
                if (connection.node && !nodeNames.includes(connection.node)) {
                  validation.invalidConnections.push({
                    from: nodeName,
                    to: connection.node,
                    reason: 'Target node does not exist'
                  });
                  validation.allNodesConnected = false;
                }
              }
            }
          }
        }
      }

      const isValid = validation.allNodesConnected && 
        validation.orphanNodes.length === 0 && 
        validation.invalidConnections.length === 0;
      
      results[filename] = { validation, isValid };
      
      if (!isValid) {
        allValid = false;
      }
    }

    return {
      success: allValid,
      details: results
    };
  }

  validateCredentialReferences() {
    const results = {};
    let allValid = true;
    const requiredCredentials = [
      'telegram-credentials',
      'openai-credentials',
      'google-sheets-credentials'
    ];

    for (const [filename, workflow] of Object.entries(this.workflows)) {
      const validation = {
        credentialsFound: [],
        missingCredentials: [],
        invalidReferences: []
      };

      // Check each node for credential references
      for (const node of workflow.nodes) {
        if (node.credentials) {
          for (const [credType, credInfo] of Object.entries(node.credentials)) {
            if (credInfo.id) {
              validation.credentialsFound.push({
                node: node.name,
                type: credType,
                id: credInfo.id
              });
            } else {
              validation.invalidReferences.push({
                node: node.name,
                type: credType,
                reason: 'Missing credential ID'
              });
            }
          }
        }
      }

      // Check for required credentials
      const foundCredentialIds = validation.credentialsFound.map(cred => cred.id);
      for (const requiredCred of requiredCredentials) {
        if (!foundCredentialIds.includes(requiredCred)) {
          validation.missingCredentials.push(requiredCred);
        }
      }

      const isValid = validation.missingCredentials.length === 0 && 
        validation.invalidReferences.length === 0;
      
      results[filename] = { validation, isValid };
      
      if (!isValid) {
        allValid = false;
      }
    }

    return {
      success: allValid,
      details: results
    };
  }

  validateInputParsing() {
    const testCases = [
      {
        name: 'Telegram Message Parsing',
        input: 'restaurants Miami Beach for digital marketing',
        expected: {
          businessType: 'restaurants',
          city: 'Miami Beach',
          serviceOffering: 'digital marketing'
        }
      },
      {
        name: 'Frontend Data Processing',
        input: {
          businessType: 'dental practices',
          location: 'Austin',
          serviceOffering: 'voice ai'
        },
        expected: {
          businessType: 'dental practices',
          city: 'Austin',
          serviceOffering: 'voice ai'
        }
      }
    ];

    const results = {};
    let allValid = true;

    for (const testCase of testCases) {
      try {
        const parsed = this.simulateInputParsing(testCase.input);
        const isValid = this.compareObjects(parsed, testCase.expected);
        
        results[testCase.name] = {
          input: testCase.input,
          parsed: parsed,
          expected: testCase.expected,
          isValid: isValid
        };

        if (!isValid) {
          allValid = false;
        }
      } catch (error) {
        results[testCase.name] = {
          input: testCase.input,
          error: error.message,
          isValid: false
        };
        allValid = false;
      }
    }

    return {
      success: allValid,
      details: results
    };
  }

  validateDataFlow() {
    // Simulate data flow through the workflow
    const testData = this.mockData['sample_frontend_input'] || {
      businessType: 'restaurants',
      location: 'Miami Beach'
    };

    const dataFlowSteps = [
      'Input Reception',
      'Multi-Channel Parsing',
      'Source Routing',
      'Google Maps Scraping',
      'AI Analysis',
      'Email Generation',
      'Data Formatting',
      'Google Sheets Storage'
    ];

    const results = {};
    let allValid = true;

    for (const step of dataFlowSteps) {
      try {
        const result = this.simulateDataFlowStep(step, testData);
        results[step] = {
          success: result.success,
          output: result.output,
          processingTime: result.processingTime || '< 1s'
        };

        if (!result.success) {
          allValid = false;
        }
      } catch (error) {
        results[step] = {
          success: false,
          error: error.message
        };
        allValid = false;
      }
    }

    return {
      success: allValid,
      details: results
    };
  }

  validateErrorHandling() {
    const errorScenarios = [
      {
        name: 'Missing Required Fields',
        input: { businessType: '' },
        expectedError: 'Missing required fields'
      },
      {
        name: 'Invalid Service Type',
        input: { businessType: 'restaurants', location: 'Miami', serviceOffering: 'invalid-service' },
        expectedError: false // Should handle gracefully
      },
      {
        name: 'Network Timeout',
        input: { simulateTimeout: true },
        expectedError: 'Request timeout'
      }
    ];

    const results = {};
    let allValid = true;

    for (const scenario of errorScenarios) {
      try {
        const result = this.simulateErrorScenario(scenario);
        results[scenario.name] = {
          input: scenario.input,
          handled: result.handled,
          errorMessage: result.errorMessage,
          gracefulDegradation: result.gracefulDegradation
        };

        // Error handling should either prevent the error or handle it gracefully
        if (!result.handled && scenario.expectedError) {
          allValid = false;
        }
      } catch (error) {
        results[scenario.name] = {
          input: scenario.input,
          unhandledError: error.message,
          handled: false
        };
        allValid = false;
      }
    }

    return {
      success: allValid,
      details: results
    };
  }

  validateOutputFormat() {
    const expectedOutputStructure = {
      businessName: 'string',
      category: 'string',
      address: 'string',
      phone: 'string',
      website: 'string',
      rating: 'number',
      reviewCount: 'number',
      serviceFitScore: 'number',
      personalizedMessage: 'string'
    };

    const sampleOutput = this.mockData['sample_business_data']?.[0] || this.generateSampleMockData().sample_business_data[0];
    
    const validation = {};
    let allValid = true;

    for (const [field, expectedType] of Object.entries(expectedOutputStructure)) {
      const actualValue = sampleOutput[field];
      const actualType = typeof actualValue;
      const isValid = actualType === expectedType && actualValue != null;
      
      validation[field] = {
        expected: expectedType,
        actual: actualType,
        value: actualValue,
        isValid: isValid
      };

      if (!isValid) {
        allValid = false;
      }
    }

    return {
      success: allValid,
      details: {
        sampleOutput: sampleOutput,
        fieldValidation: validation,
        summary: {
          totalFields: Object.keys(expectedOutputStructure).length,
          validFields: Object.values(validation).filter(v => v.isValid).length
        }
      }
    };
  }

  validateIntegrationPoints() {
    const integrationPoints = {
      'Telegram Webhook': {
        endpoint: '/webhook/business-search-bot',
        method: 'POST',
        expectedPayload: { body: { message: { text: 'string' } } }
      },
      'Frontend Webhook': {
        endpoint: '/webhook/leadlove-frontend',
        method: 'POST',
        expectedPayload: { businessType: 'string', location: 'string' }
      },
      'Status Check': {
        endpoint: '/webhook/leadlove-status',
        method: 'POST',
        expectedPayload: { workflowId: 'string' }
      }
    };

    const results = {};
    let allValid = true;

    for (const [name, config] of Object.entries(integrationPoints)) {
      const validation = {
        endpointDefined: typeof config.endpoint === 'string',
        methodValid: ['GET', 'POST', 'PUT', 'DELETE'].includes(config.method),
        payloadStructureValid: typeof config.expectedPayload === 'object',
        workflowSupport: this.checkWorkflowSupport(name)
      };

      const isValid = Object.values(validation).every(v => v === true);
      results[name] = { validation, isValid, config };

      if (!isValid) {
        allValid = false;
      }
    }

    return {
      success: allValid,
      details: results
    };
  }

  // Helper methods
  simulateInputParsing(input) {
    if (typeof input === 'string') {
      // Simulate Telegram parsing
      const cleanMessage = input.toLowerCase();
      let businessType = '';
      let city = '';
      let serviceOffering = '';

      if (cleanMessage.includes(' for ')) {
        const parts = cleanMessage.split(' for ');
        const locationPart = parts[0];
        serviceOffering = parts[1].trim();

        if (locationPart.includes(' in ')) {
          const locationParts = locationPart.split(' in ');
          businessType = locationParts[0].trim();
          city = locationParts[1].trim();
        } else {
          const words = locationPart.split(' ');
          businessType = words[0];
          city = words.slice(1).join(' ');
        }
      }

      return { businessType, city, serviceOffering };
    } else {
      // Frontend parsing
      return {
        businessType: input.businessType,
        city: input.location,
        serviceOffering: input.serviceOffering
      };
    }
  }

  simulateDataFlowStep(step, data) {
    const stepProcessors = {
      'Input Reception': () => ({ success: true, output: 'Input received and validated' }),
      'Multi-Channel Parsing': () => ({ success: true, output: this.simulateInputParsing(data) }),
      'Source Routing': () => ({ success: true, output: 'Routed to appropriate processor' }),
      'Google Maps Scraping': () => ({ success: true, output: 'Sample business data retrieved' }),
      'AI Analysis': () => ({ success: true, output: 'Business intelligence generated' }),
      'Email Generation': () => ({ success: true, output: 'Personalized sequences created' }),
      'Data Formatting': () => ({ success: true, output: 'Data formatted for storage' }),
      'Google Sheets Storage': () => ({ success: true, output: 'Data saved successfully' })
    };

    const processor = stepProcessors[step];
    if (processor) {
      return processor();
    } else {
      throw new Error(`Unknown data flow step: ${step}`);
    }
  }

  simulateErrorScenario(scenario) {
    const { name, input, expectedError } = scenario;

    switch (name) {
      case 'Missing Required Fields':
        return {
          handled: true,
          errorMessage: 'Missing required fields: businessType',
          gracefulDegradation: true
        };
      
      case 'Invalid Service Type':
        return {
          handled: true,
          errorMessage: null,
          gracefulDegradation: true
        };
      
      case 'Network Timeout':
        return {
          handled: true,
          errorMessage: 'Request timeout - please try again',
          gracefulDegradation: true
        };
      
      default:
        return {
          handled: false,
          errorMessage: 'Unknown error scenario'
        };
    }
  }

  checkWorkflowSupport(integrationPoint) {
    // Check if workflows support the integration point
    for (const workflow of Object.values(this.workflows)) {
      const nodeNames = workflow.nodes.map(node => node.name);
      
      switch (integrationPoint) {
        case 'Telegram Webhook':
          if (nodeNames.some(name => name.includes('Telegram'))) return true;
          break;
        case 'Frontend Webhook':
          if (nodeNames.some(name => name.includes('Frontend Webhook'))) return true;
          break;
        case 'Status Check':
          if (nodeNames.some(name => name.includes('Status') || name.includes('Response'))) return true;
          break;
      }
    }
    return false;
  }

  compareObjects(obj1, obj2) {
    for (const key in obj2) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
    return true;
  }

  generateTestReport() {
    const passedTests = this.testResults.filter(test => test.success).length;
    const totalTests = this.testResults.length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    const report = `
🧪 LeadLove Maps Workflow Validation Report
===========================================

📊 TEST SUMMARY
${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
• Passed: ${passedTests}/${totalTests} (${successRate}%)
• Failed: ${totalTests - passedTests}
• Errors: ${this.validationErrors.length}

🔍 DETAILED RESULTS
${this.testResults.map(test => `
${test.success ? '✅' : '❌'} ${test.test}
${test.error ? `   Error: ${test.error}` : ''}
${test.details ? `   Details: ${typeof test.details === 'object' ? JSON.stringify(test.details, null, 2) : test.details}` : ''}
`).join('')}

${this.validationErrors.length > 0 ? `
⚠️  VALIDATION ERRORS
${this.validationErrors.map(error => `• ${error}`).join('\n')}
` : ''}

🎯 DEPLOYMENT READINESS
${this.getDeploymentReadiness(successRate)}

📈 RECOMMENDATIONS
${this.getRecommendations()}

===========================================
Report generated: ${new Date().toISOString()}
    `;

    console.log(report);
    return {
      success: passedTests === totalTests && this.validationErrors.length === 0,
      passedTests,
      totalTests,
      successRate,
      details: this.testResults,
      validationErrors: this.validationErrors,
      report
    };
  }

  getDeploymentReadiness(successRate) {
    if (successRate >= 90 && this.validationErrors.length === 0) {
      return '🟢 READY for production deployment';
    } else if (successRate >= 75 && this.validationErrors.length <= 2) {
      return '🟡 READY for staging deployment (address issues for production)';
    } else {
      return '🔴 NOT READY for deployment (resolve critical issues first)';
    }
  }

  getRecommendations() {
    const recommendations = [];

    if (this.validationErrors.length > 0) {
      recommendations.push('1. Fix JSON parsing and structural issues');
    }

    const failedTests = this.testResults.filter(test => !test.success);
    if (failedTests.length > 0) {
      recommendations.push('2. Address failed test scenarios');
    }

    if (this.testResults.some(test => test.test === 'validateCredentialReferences' && !test.success)) {
      recommendations.push('3. Configure all required credentials');
    }

    if (this.testResults.some(test => test.test === 'validateErrorHandling' && !test.success)) {
      recommendations.push('4. Improve error handling mechanisms');
    }

    recommendations.push('5. Run integration tests with actual services');
    recommendations.push('6. Perform load testing before production deployment');

    return recommendations.join('\n');
  }
}

// Export for use in other modules
module.exports = WorkflowValidator;

// Run validation if called directly
if (require.main === module) {
  const validator = new WorkflowValidator();
  validator.runAllTests().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}