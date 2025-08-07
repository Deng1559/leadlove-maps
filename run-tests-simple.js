#!/usr/bin/env node

/**
 * Simple Test Runner for LeadLove Maps System
 * Validates core components without external dependencies
 */

const fs = require('fs');
const WorkflowValidator = require('./test-workflow-validation');

console.log(`
🚀 LeadLove Maps Simple Test Suite
==================================
Starting validation without external dependencies...
`);

async function runSimpleTests() {
  const testResults = {
    workflow: null,
    files: null,
    configuration: null,
    overall: null
  };

  console.log('🔍 Running workflow validation tests...');
  
  try {
    const validator = new WorkflowValidator();
    testResults.workflow = await validator.runAllTests();
    
    console.log('✅ Workflow validation completed');
  } catch (error) {
    console.error('❌ Workflow validation failed:', error.message);
    testResults.workflow = { success: false, error: error.message };
  }

  console.log('\n📁 Checking file structure...');
  testResults.files = await validateFileStructure();

  console.log('\n⚙️ Validating configuration files...');
  testResults.configuration = await validateConfiguration();

  console.log('\n📊 Generating final report...');
  return generateSimpleReport(testResults);
}

async function validateFileStructure() {
  const requiredFiles = [
    'Enhanced_Dual_Input_Workflow.json',
    'frontend-integration.js',
    'test-frontend-integration.html',
    'build-report.md',
    'deployment-guide.md',
    'environment-config.env'
  ];

  const results = {
    required: [],
    missing: [],
    extra: [],
    success: true
  };

  try {
    const files = fs.readdirSync('./');
    
    for (const file of requiredFiles) {
      if (files.includes(file)) {
        results.required.push(file);
        console.log(`  ✅ ${file}`);
      } else {
        results.missing.push(file);
        results.success = false;
        console.log(`  ❌ Missing: ${file}`);
      }
    }

    // Check for important extra files
    const importantFiles = files.filter(f => 
      f.endsWith('.json') || 
      f.endsWith('.js') || 
      f.endsWith('.html') || 
      f.endsWith('.md')
    );
    
    results.extra = importantFiles.filter(f => !requiredFiles.includes(f));
    
    return results;
  } catch (error) {
    console.error('Failed to validate file structure:', error.message);
    return { success: false, error: error.message };
  }
}

async function validateConfiguration() {
  const configFiles = [
    'environment-config.env',
    'build-configuration.json'
  ];

  const results = {
    configurations: [],
    success: true
  };

  for (const configFile of configFiles) {
    try {
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        
        if (configFile.endsWith('.json')) {
          JSON.parse(content); // Validate JSON
        }
        
        results.configurations.push({
          file: configFile,
          valid: true,
          size: content.length
        });
        
        console.log(`  ✅ ${configFile} - Valid (${content.length} bytes)`);
      } else {
        results.configurations.push({
          file: configFile,
          valid: false,
          error: 'File not found'
        });
        results.success = false;
        console.log(`  ❌ ${configFile} - Not found`);
      }
    } catch (error) {
      results.configurations.push({
        file: configFile,
        valid: false,
        error: error.message
      });
      results.success = false;
      console.log(`  ❌ ${configFile} - Invalid: ${error.message}`);
    }
  }

  return results;
}

async function validateWorkflowStructure() {
  const workflowFile = 'Enhanced_Dual_Input_Workflow.json';
  
  try {
    if (!fs.existsSync(workflowFile)) {
      return { success: false, error: 'Workflow file not found' };
    }

    const content = fs.readFileSync(workflowFile, 'utf8');
    const workflow = JSON.parse(content);

    const validation = {
      hasNodes: Array.isArray(workflow.nodes) && workflow.nodes.length > 0,
      hasConnections: workflow.connections && typeof workflow.connections === 'object',
      hasName: typeof workflow.name === 'string' && workflow.name.length > 0,
      hasSettings: workflow.settings && typeof workflow.settings === 'object'
    };

    const nodeNames = workflow.nodes.map(node => node.name);
    validation.hasTelegramTrigger = nodeNames.some(name => name.includes('Telegram'));
    validation.hasFrontendWebhook = nodeNames.some(name => name.includes('Frontend Webhook'));
    validation.hasParser = nodeNames.some(name => name.includes('Parser'));
    validation.hasRouter = nodeNames.some(name => name.includes('Router'));

    const isValid = Object.values(validation).every(v => v === true);

    return {
      success: isValid,
      validation,
      nodeCount: workflow.nodes.length,
      connectionCount: Object.keys(workflow.connections || {}).length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateSimpleReport(results) {
  const overallSuccess = Object.values(results)
    .filter(r => r && typeof r.success === 'boolean')
    .every(r => r.success);

  const report = `
🚀 LeadLove Maps Simple Test Report
===================================

📊 OVERALL STATUS
${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}

🏗️ WORKFLOW VALIDATION
${results.workflow?.success ? '✅' : '❌'} Status: ${results.workflow?.success ? 'PASSED' : 'FAILED'}
${results.workflow?.passedTests ? `• Passed: ${results.workflow.passedTests}/${results.workflow.totalTests}` : ''}
${results.workflow?.error ? `• Error: ${results.workflow.error}` : ''}

📁 FILE STRUCTURE
${results.files?.success ? '✅' : '❌'} Status: ${results.files?.success ? 'PASSED' : 'FAILED'}
${results.files?.required ? `• Required files: ${results.files.required.length}` : ''}
${results.files?.missing?.length ? `• Missing files: ${results.files.missing.length}` : ''}
${results.files?.error ? `• Error: ${results.files.error}` : ''}

⚙️ CONFIGURATION
${results.configuration?.success ? '✅' : '❌'} Status: ${results.configuration?.success ? 'PASSED' : 'FAILED'}
${results.configuration?.configurations ? `• Config files: ${results.configuration.configurations.length}` : ''}

🎯 DEPLOYMENT READINESS
${getDeploymentStatus(overallSuccess)}

📈 NEXT STEPS
${getNextSteps(results)}

===================================
Report Generated: ${new Date().toISOString()}
  `;

  console.log(report);

  // Save report to file
  try {
    fs.writeFileSync('simple-test-report.txt', report);
    console.log('💾 Report saved to simple-test-report.txt');
  } catch (error) {
    console.warn('Could not save report:', error.message);
  }

  return {
    success: overallSuccess,
    results,
    report
  };
}

function getDeploymentStatus(overallSuccess) {
  if (overallSuccess) {
    return '🟢 READY for deployment';
  } else {
    return '🟡 NEEDS ATTENTION before deployment';
  }
}

function getNextSteps(results) {
  const steps = [];
  
  if (!results.workflow?.success) {
    steps.push('1. Fix workflow validation issues');
  }
  
  if (!results.files?.success) {
    steps.push('2. Ensure all required files are present');
  }
  
  if (!results.configuration?.success) {
    steps.push('3. Validate configuration files');
  }
  
  steps.push('4. Deploy enhanced n8n workflow');
  steps.push('5. Configure production environment variables');
  steps.push('6. Test with real data');
  
  return steps.join('\\n');
}

// Run tests if called directly
if (require.main === module) {
  runSimpleTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimpleTests };