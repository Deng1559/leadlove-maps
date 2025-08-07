/**
 * LeadLove Maps Frontend Integration
 * API service for connecting Lovable frontend to n8n workflow
 */

class LeadGeneratorAPI {
  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || 'YOUR_N8N_WEBHOOK_URL';
    this.frontendEndpoint = '/webhook/leadlove-frontend';
    this.statusEndpoint = '/webhook/leadlove-status';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Generate leads from search data
   * @param {Object} searchData - Search parameters from frontend form
   * @returns {Promise<Object>} - API response with workflow ID
   */
  async generateLeads(searchData) {
    const payload = {
      businessType: searchData.businessType,
      location: searchData.location,
      serviceOffering: searchData.serviceOffering || 'digital marketing',
      countryCode: searchData.countryCode || 'us',
      maxResults: searchData.maxResults || 20,
      userId: this.generateUserId(),
      userName: searchData.userName || 'Lovable User',
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };

    try {
      const response = await this.makeRequest(this.frontendEndpoint, payload);
      
      if (response.success) {
        this.trackEvent('lead_generation_started', {
          workflowId: response.workflowId,
          businessType: searchData.businessType,
          location: searchData.location
        });
        
        return {
          success: true,
          workflowId: response.workflowId,
          message: 'Lead generation started successfully',
          estimatedTime: '2-3 minutes'
        };
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Lead generation failed:', error);
      return {
        success: false,
        error: error.message,
        troubleshooting: this.getTroubleshootingSteps()
      };
    }
  }

  /**
   * Check status of lead generation workflow
   * @param {string} workflowId - Workflow identifier
   * @returns {Promise<Object>} - Status information
   */
  async checkStatus(workflowId) {
    try {
      const response = await this.makeRequest(this.statusEndpoint, { workflowId });
      return response;
    } catch (error) {
      console.error('Status check failed:', error);
      return {
        success: false,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @returns {Promise<Object>} - Response data
   */
  async makeRequest(endpoint, data) {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'LeadLove-Maps-Frontend/2.0',
            'X-Request-ID': data.requestId || this.generateRequestId()
          },
          body: JSON.stringify(data),
          timeout: 30000 // 30 seconds
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.warn(`Request attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  /**
   * Generate unique user ID for frontend users
   * @returns {string} - Unique user identifier
   */
  generateUserId() {
    return `lovable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique request ID for tracking
   * @returns {string} - Unique request identifier
   */
  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track analytics events
   * @param {string} eventName - Event identifier
   * @param {Object} properties - Event properties
   */
  trackEvent(eventName, properties) {
    // Analytics tracking implementation
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(eventName, properties);
    }
    
    console.log('Analytics event:', eventName, properties);
  }

  /**
   * Get troubleshooting steps for common issues
   * @returns {Array<string>} - Troubleshooting steps
   */
  getTroubleshootingSteps() {
    return [
      'Check your internet connection',
      'Verify all required fields are filled',
      'Try a different business type or location',
      'Contact support if the issue persists'
    ];
  }

  /**
   * Delay utility for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Form handler for lead generation
 * @param {HTMLFormElement} form - The form element
 * @returns {Promise<void>} - Form submission result
 */
async function handleFormSubmit(form) {
  const formData = new FormData(form);
  const searchData = {
    businessType: formData.get('businessType'),
    location: formData.get('location'),
    serviceOffering: formData.get('serviceOffering'),
    countryCode: formData.get('countryCode'),
    maxResults: parseInt(formData.get('maxResults')) || 20,
    userName: formData.get('userName')
  };

  // Validation
  if (!searchData.businessType || !searchData.location) {
    showErrorMessage('❌ Please fill in all required fields');
    return;
  }

  const leadAPI = new LeadGeneratorAPI();
  showLoadingState();

  try {
    const result = await leadAPI.generateLeads(searchData);
    
    if (result.success) {
      showSuccessMessage(`🚀 ${result.message}`);
      pollForResults(result.workflowId, leadAPI);
    } else {
      showErrorMessage(`❌ Failed: ${result.error}`);
      if (result.troubleshooting) {
        showTroubleshootingSteps(result.troubleshooting);
      }
    }
  } catch (error) {
    showErrorMessage('⚠️ An unexpected error occurred. Please try again.');
    console.error('Form submission error:', error);
  }
}

/**
 * Poll for workflow results
 * @param {string} workflowId - Workflow identifier
 * @param {LeadGeneratorAPI} api - API instance
 */
async function pollForResults(workflowId, api) {
  const steps = [
    'Parsing search request...',
    'Scraping Google Maps data...',
    'AI business intelligence analysis...',
    'Creating personalized email sequences...',
    'Saving to Google Sheets...'
  ];

  let currentStep = 0;
  const maxPolls = 30; // 5 minutes with 10-second intervals
  let pollCount = 0;

  const poll = async () => {
    try {
      updateProgressStep(steps[currentStep], ((currentStep + 1) / steps.length) * 100);
      
      const status = await api.checkStatus(workflowId);
      
      if (status.success && status.completed) {
        // Workflow completed successfully
        hideLoadingState();
        displayResults(status.results);
        return;
      }
      
      if (status.error || pollCount >= maxPolls) {
        // Error or timeout
        hideLoadingState();
        showErrorMessage(`❌ ${status.error || 'Request timed out. Please try again.'}`);
        return;
      }
      
      // Continue polling
      currentStep = Math.min(currentStep + 1, steps.length - 1);
      pollCount++;
      setTimeout(poll, 10000); // Poll every 10 seconds
      
    } catch (error) {
      hideLoadingState();
      showErrorMessage('❌ Error checking results. Please try again.');
      console.error('Polling error:', error);
    }
  };

  poll();
}

// UI Helper Functions
function showLoadingState() {
  const loadingElement = document.getElementById('loading-state');
  if (loadingElement) {
    loadingElement.style.display = 'block';
  }
}

function hideLoadingState() {
  const loadingElement = document.getElementById('loading-state');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

function updateProgressStep(step, percentage) {
  const stepElement = document.getElementById('current-step');
  const progressBar = document.getElementById('progress-bar');
  
  if (stepElement) stepElement.textContent = step;
  if (progressBar) progressBar.style.width = `${percentage}%`;
}

function showSuccessMessage(message) {
  showMessage(message, 'success');
}

function showErrorMessage(message) {
  showMessage(message, 'error');
}

function showMessage(message, type) {
  const messageElement = document.getElementById('message-container');
  if (messageElement) {
    messageElement.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    messageElement.style.display = 'block';
  }
}

function showTroubleshootingSteps(steps) {
  const troubleshootingHTML = `
    <div class="troubleshooting-steps">
      <h4>💡 Troubleshooting Steps:</h4>
      <ul>
        ${steps.map(step => `<li>${step}</li>`).join('')}
      </ul>
    </div>
  `;
  
  const container = document.getElementById('troubleshooting-container');
  if (container) {
    container.innerHTML = troubleshootingHTML;
    container.style.display = 'block';
  }
}

function displayResults(leads) {
  // Results display implementation
  console.log('Displaying results:', leads);
  const resultsContainer = document.getElementById('results-container');
  if (resultsContainer) {
    resultsContainer.innerHTML = generateResultsHTML(leads);
    resultsContainer.style.display = 'block';
  }
}

function generateResultsHTML(leads) {
  return `
    <div class="results-header">
      <h3>🎯 Generated Leads (${leads.length})</h3>
      <div class="export-buttons">
        <button onclick="exportToCSV()" class="btn btn-success">📊 Export CSV</button>
        <button onclick="openGoogleSheets()" class="btn btn-primary">📋 Open Google Sheets</button>
      </div>
    </div>
    <div class="leads-grid">
      ${leads.map(lead => generateLeadCard(lead)).join('')}
    </div>
  `;
}

function generateLeadCard(lead) {
  return `
    <div class="lead-card">
      <div class="lead-header">
        <h4>${lead.businessName}</h4>
        <span class="lead-score">Score: ${lead.serviceFitScore}/10</span>
      </div>
      <div class="lead-details">
        <p><strong>Category:</strong> ${lead.category}</p>
        <p><strong>Address:</strong> ${lead.address}</p>
        <p><strong>Rating:</strong> ${lead.rating} (${lead.reviewCount} reviews)</p>
      </div>
      <div class="lead-actions">
        <button onclick="viewLeadDetails('${lead.id}')" class="btn btn-sm">View Details</button>
        <button onclick="previewEmail('${lead.id}')" class="btn btn-sm">Preview Email</button>
      </div>
    </div>
  `;
}

// Export functionality
function exportToCSV() {
  // CSV export implementation
  console.log('Exporting to CSV');
}

function openGoogleSheets() {
  // Open Google Sheets implementation
  console.log('Opening Google Sheets');
}

// Make API class available globally
window.LeadGeneratorAPI = LeadGeneratorAPI;
window.handleFormSubmit = handleFormSubmit;