# View System Locally

## 🚀 Quick Start

### Option 1: Automated Start (Windows)
```batch
# Double-click this file or run from command prompt:
scripts/start-local-demo.bat
```

### Option 2: Manual Start
```bash
# 1. Navigate to project directory
cd "G:\AI - Coding Projects\Telegram.GoogleMaps.Email.Enrichment.n8n\leadlove-credit-system"

# 2. Install dependencies (if not already installed)
npm install

# 3. Start development server
npm run dev
```

## 🌐 Test Interfaces

Once the server is running, visit these URLs:

### 📧 Email Strategist Test Interface
**URL**: http://localhost:3000/test-email-strategist

**Features**:
- Interactive form to test email generation
- Real-time sequence generation
- Preview all subject line variations (Direct, Casual, Curiosity, Trigger-based)
- Copy individual emails or full sequences
- Industry-specific personalization testing

### 🔗 Webhook Test Interface  
**URL**: http://localhost:3000/test-webhook

**Features**:
- Test webhook endpoints directly
- Google Maps scraper integration
- Status checking functionality
- Enhanced email strategist integration

### 📋 API Documentation
**URL**: http://localhost:3000/api/email-sequences/generate (GET request)

**Features**:
- Service information and capabilities
- Deliverability improvements list
- Sample requests and responses
- Available personas and features

## 🧪 Testing Your System

### 1. Test Email Sequence Generation
1. Go to http://localhost:3000/test-email-strategist
2. Fill in sample business information:
   - **Business Name**: Joe's Pizza
   - **Industry**: Restaurants  
   - **Owner Name**: Joe
   - **Location**: Miami Beach, FL
3. Click "Generate High-Converting Email Sequence"
4. Review the generated content:
   - 4 subject line categories with 5 options each
   - Structured first email with all components
   - Complete 4-email follow-up sequence

### 2. Test Webhook Integration
1. Go to http://localhost:3000/test-webhook
2. Configure scraper settings:
   - **Business Type**: restaurants
   - **Location**: Miami Beach, FL
   - **Max Results**: 5
3. Click "Start Google Maps Scraping"
4. Test status checking with returned workflow ID

### 3. Test API Endpoints Directly

#### Generate Email Sequence
```javascript
fetch('http://localhost:3000/api/email-sequences/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessData: {
      name: 'Joe\'s Pizza',
      industry: 'restaurants',
      location: 'Miami Beach, FL',
      ownerName: 'Joe'
    },
    serviceOffering: 'digital-marketing'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

#### Enhance Multiple Leads
```javascript
fetch('http://localhost:3000/api/leads/enhance-emails', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leads: [
      {
        name: 'Elite Fitness Studio',
        industry: 'fitness',
        ownerName: 'Sarah'
      }
    ],
    serviceOffering: 'digital-marketing'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

#### Test Webhook
```javascript
fetch('http://localhost:3000/api/webhook/google-maps-scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessType: 'restaurants',
    location: 'Miami Beach, FL',
    maxResults: 5
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔧 Automated Testing

### Run Test Suites
```bash
# Run email strategist tests
node scripts/test-email-strategist.js

# Run component tests
node scripts/test-components.js

# Run API tests (requires server running)
node scripts/test-api-direct.js
```

### Test with cURL
```bash
# Test email generation
curl -X POST http://localhost:3000/api/email-sequences/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessData": {
      "name": "Joe'\''s Pizza",
      "industry": "restaurants",
      "ownerName": "Joe"
    }
  }'

# Test webhook
curl -X POST http://localhost:3000/api/webhook/google-maps-scraper \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "restaurants",
    "location": "Miami Beach, FL"
  }'
```

## 📱 What You'll See

### Email Strategist Interface
- Clean, professional form interface
- Real-time generation with loading states
- Organized display of all email components
- Copy-to-clipboard functionality for easy use
- Industry dropdown with 8 supported business types

### Generated Email Content
- **Subject Lines**: 20 total options (4 categories × 5 each)
- **First Email**: Complete structured email with opener, pitch, credibility, CTA
- **Follow-Up Sequence**: 4 additional emails with varied approaches
- **Personalization**: Dynamic variables filled with business information
- **Professional Copy**: Outcome-focused, deliverability-optimized messaging

### Quality Indicators
- All subject lines under 60 characters ✅
- Industry-specific personalization ✅  
- Professional tone with conversational elements ✅
- Clear call-to-actions ✅
- Respectful follow-up cadence ✅

## 🚨 Troubleshooting

### Port Already in Use
If port 3000 is occupied:
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### Dependencies Issues
```bash
# Clear node modules and reinstall
rmdir /s node_modules
del package-lock.json
npm install
```

### TypeScript Errors
```bash
# Run type checking
npm run type-check

# Build the project
npm run build
```

## 📄 Documentation Access

While running locally, you can also access:
- **Comprehensive Test Report**: `COMPREHENSIVE_TEST_REPORT.md`
- **Email Strategist Documentation**: `EMAIL_STRATEGIST_SYSTEM.md`
- **Webhook API Guide**: `WEBHOOK_API.md`

## 🎯 Next Steps

After testing locally:
1. **Integrate with Snov.io**: Use generated email copy in Snov.io campaigns
2. **Connect N8N Workflows**: Point N8N to your webhook endpoints
3. **Production Deployment**: Deploy to your preferred hosting platform
4. **Monitor Performance**: Track email open rates and conversions

---

**Ready to test your enhanced B2B Cold Email Strategist System!** 🚀