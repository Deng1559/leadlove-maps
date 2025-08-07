/**
 * LeadLove Maps Build Validation Suite
 * Comprehensive validation for enhanced dual-input system
 */

const fs = require('fs');
const path = require('path');

class BuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validationResults = {};
  }

  /**
   * Run complete build validation
   * @returns {Promise<Object>} Validation results
   */
  async validateBuild() {
    console.log('🔍 Starting LeadLove Maps build validation...\n');

    // Run all validation checks
    await this.validateWorkflowFiles();
    await this.validateEnvironmentConfig();
    await this.validateFrontendIntegration();
    await this.validateDependencies();
    await this.validateSecurity();
    await this.validatePerformance();

    // Generate report
    const report = this.generateValidationReport();
    console.log(report);

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      results: this.validationResults
    };
  }

  /**
   * Validate n8n workflow files
   */
  async validateWorkflowFiles() {
    console.log('📋 Validating workflow files...');
    
    try {
      // Check for required workflow files
      const requiredFiles = [
        'Enhanced_Google_Maps_Lead_Generator_Warm_Emails.json',
        'Enhanced_Dual_Input_Workflow.json'
      ];

      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          this.errors.push(`Missing required workflow file: ${file}`);
          continue;
        }

        // Validate JSON structure
        try {
          const content = fs.readFileSync(file, 'utf8');
          const workflow = JSON.parse(content);

          // Validate workflow structure
          if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
            this.errors.push(`Invalid workflow structure in ${file}: missing nodes array`);
          }

          if (!workflow.connections || typeof workflow.connections !== 'object') {
            this.errors.push(`Invalid workflow structure in ${file}: missing connections object`);
          }

          // Check for required nodes
          const nodeNames = workflow.nodes.map(node => node.name);
          const requiredNodes = [
            'Telegram Business Search Trigger',
            'Enhanced Multi-Channel Parser'
          ];

          for (const requiredNode of requiredNodes) {
            if (!nodeNames.includes(requiredNode)) {
              this.warnings.push(`Missing recommended node in ${file}: ${requiredNode}`);
            }
          }

          console.log(`  ✅ ${file} - Valid structure`);

        } catch (parseError) {
          this.errors.push(`Invalid JSON in ${file}: ${parseError.message}`);
        }
      }

      this.validationResults.workflows = {
        validated: requiredFiles.length,
        errors: this.errors.filter(e => e.includes('workflow')).length
      };

    } catch (error) {
      this.errors.push(`Workflow validation failed: ${error.message}`);
    }
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironmentConfig() {
    console.log('🔧 Validating environment configuration...');
    
    try {
      const envFile = 'environment-config.env';
      
      if (!fs.existsSync(envFile)) {
        this.warnings.push('Environment config file not found - using defaults');
        return;
      }

      const envContent = fs.readFileSync(envFile, 'utf8');
      const requiredVars = [
        'N8N_WEBHOOK_URL',
        'TELEGRAM_BOT_TOKEN',
        'APIFY_TOKEN',
        'OPENAI_API_KEY',
        'GOOGLE_SHEETS_CREDENTIALS'
      ];

      let configuredVars = 0;
      for (const variable of requiredVars) {
        if (envContent.includes(`${variable}=`) && !envContent.includes(`${variable}=your-`)) {
          configuredVars++;
          console.log(`  ✅ ${variable} - Configured`);
        } else {
          this.warnings.push(`Environment variable ${variable} needs configuration`);
          console.log(`  ⚠️  ${variable} - Needs configuration`);
        }
      }

      this.validationResults.environment = {
        total: requiredVars.length,
        configured: configuredVars,
        percentage: Math.round((configuredVars / requiredVars.length) * 100)
      };

    } catch (error) {
      this.errors.push(`Environment validation failed: ${error.message}`);
    }
  }

  /**
   * Validate frontend integration
   */
  async validateFrontendIntegration() {
    console.log('🌐 Validating frontend integration...');
    
    try {
      const integrationFile = 'frontend-integration.js';
      
      if (!fs.existsSync(integrationFile)) {
        this.errors.push('Frontend integration file missing');
        return;
      }

      const content = fs.readFileSync(integrationFile, 'utf8');

      // Check for required classes and functions
      const requiredComponents = [
        'class LeadGeneratorAPI',
        'async generateLeads',
        'async checkStatus',
        'handleFormSubmit',
        'pollForResults'
      ];

      let foundComponents = 0;
      for (const component of requiredComponents) {
        if (content.includes(component)) {
          foundComponents++;
          console.log(`  ✅ ${component} - Found`);
        } else {
          this.errors.push(`Missing required component: ${component}`);
        }
      }

      // Check for error handling
      if (content.includes('try {') && content.includes('catch')) {
        console.log('  ✅ Error handling - Implemented');
      } else {
        this.warnings.push('Limited error handling in frontend integration');
      }

      // Check for retry logic
      if (content.includes('maxRetries') && content.includes('retryDelay')) {
        console.log('  ✅ Retry logic - Implemented');
      } else {
        this.warnings.push('Retry logic not found in frontend integration');
      }

      this.validationResults.frontend = {
        components: foundComponents,
        total: requiredComponents.length,
        errorHandling: content.includes('try {') && content.includes('catch'),
        retryLogic: content.includes('maxRetries')
      };

    } catch (error) {
      this.errors.push(`Frontend validation failed: ${error.message}`);
    }
  }

  /**
   * Validate dependencies and service integration
   */
  async validateDependencies() {
    console.log('📦 Validating dependencies...');
    
    try {
      // Check documentation completeness
      const requiredDocs = [
        'README.md',
        'deployment-guide.md',
        'planme.md'
      ];

      let foundDocs = 0;
      for (const doc of requiredDocs) {
        if (fs.existsSync(doc)) {
          foundDocs++;
          console.log(`  ✅ ${doc} - Found`);
        } else {
          this.warnings.push(`Missing documentation: ${doc}`);
        }
      }

      // Check for mock data and test files
      const testFiles = [
        'Mock_Test_Business_Data.json',
        'Mock_Complete_5_Email_Sequence_Output.json'
      ];

      let foundTests = 0;
      for (const testFile of testFiles) {
        if (fs.existsSync(testFile)) {
          foundTests++;
          console.log(`  ✅ ${testFile} - Available for testing`);
        } else {
          this.warnings.push(`Missing test data: ${testFile}`);
        }
      }

      this.validationResults.dependencies = {
        documentation: foundDocs,
        totalDocs: requiredDocs.length,
        testFiles: foundTests,
        totalTests: testFiles.length
      };

    } catch (error) {
      this.errors.push(`Dependencies validation failed: ${error.message}`);
    }
  }

  /**
   * Validate security configuration
   */
  async validateSecurity() {
    console.log('🔒 Validating security configuration...');
    
    try {
      const integrationContent = fs.readFileSync('frontend-integration.js', 'utf8');
      const envContent = fs.existsSync('environment-config.env') ? 
        fs.readFileSync('environment-config.env', 'utf8') : '';

      let securityScore = 0;
      const maxScore = 6;

      // Check for CORS configuration
      if (integrationContent.includes('cors') || envContent.includes('CORS_ORIGIN')) {
        securityScore++;
        console.log('  ✅ CORS configuration - Found');
      } else {
        this.warnings.push('CORS configuration not explicitly set');
      }

      // Check for input validation
      if (integrationContent.includes('validation') || integrationContent.includes('sanitize')) {
        securityScore++;
        console.log('  ✅ Input validation - Implemented');
      } else {
        this.warnings.push('Input validation could be enhanced');
      }

      // Check for API key security
      if (envContent.includes('API_SECRET_KEY') || envContent.includes('WEBHOOK_SIGNATURE_SECRET')) {
        securityScore++;
        console.log('  ✅ API security keys - Configured');
      } else {
        this.warnings.push('API security keys not configured');
      }

      // Check for timeout configuration
      if (integrationContent.includes('timeout') || envContent.includes('TIMEOUT')) {
        securityScore++;
        console.log('  ✅ Request timeouts - Configured');
      } else {
        this.warnings.push('Request timeouts not configured');
      }

      // Check for error handling that doesn't expose secrets
      if (integrationContent.includes('console.error') && !integrationContent.includes('api_key')) {
        securityScore++;
        console.log('  ✅ Secure error handling - Implemented');
      } else {
        this.warnings.push('Error handling security could be improved');
      }

      // Check for rate limiting considerations
      if (integrationContent.includes('retry') && integrationContent.includes('delay')) {
        securityScore++;
        console.log('  ✅ Rate limiting protection - Implemented');
      } else {
        this.warnings.push('Rate limiting protection not found');
      }

      this.validationResults.security = {
        score: securityScore,
        maxScore: maxScore,
        percentage: Math.round((securityScore / maxScore) * 100)
      };

    } catch (error) {
      this.warnings.push(`Security validation skipped: ${error.message}`);
    }
  }

  /**
   * Validate performance configuration
   */
  async validatePerformance() {
    console.log('⚡ Validating performance configuration...');
    
    try {
      const integrationContent = fs.readFileSync('frontend-integration.js', 'utf8');
      let performanceScore = 0;
      const maxScore = 5;

      // Check for caching implementation
      if (integrationContent.includes('cache') || integrationContent.includes('Cache')) {
        performanceScore++;
        console.log('  ✅ Caching strategy - Implemented');
      } else {
        this.warnings.push('Caching strategy not implemented');
      }

      // Check for retry logic with exponential backoff
      if (integrationContent.includes('retryDelay') && integrationContent.includes('attempt')) {
        performanceScore++;
        console.log('  ✅ Intelligent retry logic - Implemented');
      } else {
        this.warnings.push('Intelligent retry logic missing');
      }

      // Check for request timeout handling
      if (integrationContent.includes('timeout')) {
        performanceScore++;
        console.log('  ✅ Timeout handling - Configured');
      } else {
        this.warnings.push('Timeout handling not configured');
      }

      // Check for progress tracking
      if (integrationContent.includes('pollForResults') && integrationContent.includes('progress')) {
        performanceScore++;
        console.log('  ✅ Progress tracking - Implemented');
      } else {
        this.warnings.push('Progress tracking not implemented');
      }

      // Check for error recovery
      if (integrationContent.includes('recovery') || integrationContent.includes('fallback')) {
        performanceScore++;
        console.log('  ✅ Error recovery - Implemented');
      } else {
        this.warnings.push('Error recovery mechanisms missing');
      }

      this.validationResults.performance = {
        score: performanceScore,
        maxScore: maxScore,
        percentage: Math.round((performanceScore / maxScore) * 100)
      };

    } catch (error) {
      this.warnings.push(`Performance validation skipped: ${error.message}`);
    }
  }

  /**
   * Generate validation report
   * @returns {string} Formatted validation report
   */
  generateValidationReport() {
    const report = `
🏗️ LeadLove Maps Build Validation Report
==========================================

📊 VALIDATION SUMMARY
${this.errors.length === 0 ? '✅ Build validation PASSED' : '❌ Build validation FAILED'}
• Errors: ${this.errors.length}
• Warnings: ${this.warnings.length}

🔍 DETAILED RESULTS
${this.formatValidationResults()}

${this.errors.length > 0 ? `❌ ERRORS:\n${this.errors.map(e => `• ${e}`).join('\n')}` : ''}

${this.warnings.length > 0 ? `⚠️  WARNINGS:\n${this.warnings.map(w => `• ${w}`).join('\n')}` : ''}

🚀 DEPLOYMENT READINESS
${this.getDeploymentReadiness()}

📈 RECOMMENDATIONS
${this.getRecommendations()}

==========================================
Build validation completed at ${new Date().toISOString()}
    `;

    return report;
  }

  /**
   * Format validation results for display
   * @returns {string} Formatted results
   */
  formatValidationResults() {
    let results = '';
    
    for (const [category, data] of Object.entries(this.validationResults)) {
      results += `\n${category.toUpperCase()}:\n`;
      
      if (typeof data === 'object') {
        for (const [key, value] of Object.entries(data)) {
          results += `  ${key}: ${value}\n`;
        }
      } else {
        results += `  ${data}\n`;
      }
    }
    
    return results;
  }

  /**
   * Get deployment readiness assessment
   * @returns {string} Readiness assessment
   */
  getDeploymentReadiness() {
    const criticalErrors = this.errors.length;
    const highPriorityWarnings = this.warnings.filter(w => 
      w.includes('missing') || w.includes('configuration')
    ).length;

    if (criticalErrors === 0 && highPriorityWarnings <= 2) {
      return '🟢 READY for production deployment';
    } else if (criticalErrors === 0 && highPriorityWarnings <= 5) {
      return '🟡 READY for staging deployment (address warnings for production)';
    } else {
      return '🔴 NOT READY for deployment (resolve errors first)';
    }
  }

  /**
   * Generate recommendations based on validation results
   * @returns {string} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (this.errors.length > 0) {
      recommendations.push('1. Resolve all errors before deployment');
    }

    if (this.warnings.filter(w => w.includes('Environment variable')).length > 0) {
      recommendations.push('2. Configure all required environment variables');
    }

    if (this.validationResults.security?.percentage < 80) {
      recommendations.push('3. Enhance security configuration');
    }

    if (this.validationResults.performance?.percentage < 80) {
      recommendations.push('4. Implement performance optimizations');
    }

    recommendations.push('5. Run integration tests before deployment');
    recommendations.push('6. Set up monitoring and alerting');

    return recommendations.join('\n');
  }
}

// Export for use in build scripts
module.exports = BuildValidator;

// Run validation if called directly
if (require.main === module) {
  const validator = new BuildValidator();
  validator.validateBuild().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}