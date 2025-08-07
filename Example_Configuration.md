# 🔧 Quick Configuration Examples

## 📱 Telegram Message Examples

### Digital Marketing Services:
```
restaurants in Miami for digital marketing
coffee shops San Francisco for SEO
gyms in Austin for social media management  
dentists Chicago for online marketing
lawyers NYC for website optimization
```

### Voice AI Services:
```
medical offices Boston for voice AI
restaurants Denver - call automation
dental practices LA for appointment booking
service businesses Seattle | voice automation
```

### Website Development:
```
law firms Atlanta for website development
restaurants Portland for web design
fitness centers Dallas - website redesign
retail stores Phoenix | e-commerce development
```

## 🎯 Service-Specific Message Templates

### Digital Marketing Output Example:
**Input:** `"pizza restaurants Miami for digital marketing"`

**AI Generated Message:**
> "Hi Tony's Pizza! I noticed you have great 4.5-star reviews in Miami Beach. I help local restaurants like yours increase online orders by 40% and attract more customers through targeted digital marketing and Google Ads. Would you be interested in a quick 15-minute call to discuss growing your delivery business?"

### Voice AI Output Example:
**Input:** `"dental offices Chicago - voice AI services"`

**AI Generated Message:**
> "Hello Dr. Smith's Dental Office! I saw you're highly rated in downtown Chicago. I help dental practices automate appointment booking and patient follow-ups with AI voice technology, reducing staff workload by 40% while improving patient experience. Would you like to see a quick demo?"

### SEO Services Output Example:
**Input:** `"coffee shops Portland for SEO"`

**AI Generated Message:**
> "Hi Brew Coffee House! Love seeing a thriving local coffee shop in Portland's Pearl District. I help coffee shops like yours rank #1 on Google when people search 'coffee near me,' driving 25% more foot traffic. Interested in a brief chat about boosting your local visibility?"

## 📊 Google Sheets Sample Data

| Business Name | Service Offering | Service Fit Score | Urgency Level | Personalized Message | Lead Quality |
|---------------|------------------|-------------------|---------------|---------------------|--------------|
| Mario's Pizza | Digital Marketing | 9/10 | High | Hi Mario's Pizza! I noticed you have excellent... | High |
| Smith Dental | Voice AI | 8/10 | Medium | Hello Dr. Smith! I help dental practices... | High |
| Brew Coffee | SEO | 7/10 | High | Hi Brew Coffee! Love seeing a local coffee shop... | Medium |

## 🔄 Workflow Customization Options

### Modify Service Categories:
Edit the `serviceMap` object in the "Parse Business Search & Service Request" node:

```javascript
const serviceMap = {
  'digital marketing': 'comprehensive digital marketing services...',
  'voice ai': 'AI-powered voice automation solutions...',
  'seo': 'search engine optimization services...',
  // Add your custom services here:
  'mobile apps': 'custom mobile app development for iOS and Android',
  'crm setup': 'customer relationship management system implementation'
};
```

### Adjust AI Analysis Prompts:
Modify the system message in "AI Business Intelligence & Service Analysis" node for different analysis focus:

```javascript
"systemMessage": "You are an expert in [YOUR SPECIALTY]. Analyze businesses for [YOUR SERVICE] opportunities focusing on [YOUR FOCUS AREAS]..."
```

### Customize Message Tone:
Update the message generation prompt for different tones:
- **Professional:** "Create a formal, business-focused message..."
- **Casual:** "Write a friendly, conversational message..." 
- **Direct:** "Generate a brief, direct value proposition..."

## 🎨 Advanced Customizations

### Multi-Language Support:
Add language detection and translation:

```javascript
// In message parser, detect language
const language = message.includes('español') ? 'es' : 'en';

// Update AI prompts accordingly
"Generate message in " + language + " language..."
```

### Industry-Specific Templates:
Create specialized workflows for different industries:

```javascript
// Industry-specific pain points
const industryPainPoints = {
  'restaurants': 'online orders, delivery optimization, customer retention',
  'dentists': 'appointment scheduling, patient communication, no-shows',
  'lawyers': 'client acquisition, case management, online reputation'
};
```

### Custom Scoring System:
Modify the lead scoring criteria:

```javascript
// Custom scoring based on your priorities
const customScore = {
  'hasWebsite': business.website ? 2 : 0,
  'highRating': business.rating > 4.0 ? 3 : 0,
  'manyReviews': business.reviewCount > 50 ? 2 : 0,
  'rightLocation': targetCities.includes(business.city) ? 3 : 0
};
```

## 🔐 Security Best Practices

### API Key Management:
- Store API keys as n8n environment variables
- Use separate API keys for production/testing
- Regularly rotate API keys
- Monitor API usage and costs

### Data Privacy:
- Only collect publicly available business information
- Comply with GDPR/privacy regulations
- Don't store sensitive personal data
- Include unsubscribe options in outreach

### Rate Limiting:
```javascript
// Add delays between API calls
await new Promise(resolve => setTimeout(resolve, 2000));
```

## 📈 Performance Optimization

### Batch Processing:
Process multiple businesses in batches to improve efficiency:

```javascript
// Process in batches of 5
const batchSize = 5;
const batches = [];
for (let i = 0; i < businesses.length; i += batchSize) {
  batches.push(businesses.slice(i, i + batchSize));
}
```

### Caching Results:
Cache repeated API calls to reduce costs:

```javascript
// Simple caching mechanism
const cache = {};
const cacheKey = `${businessType}-${city}`;
if (cache[cacheKey]) {
  return cache[cacheKey];
}
```

### Error Handling:
Add robust error handling:

```javascript
try {
  // API call
} catch (error) {
  console.log('API call failed:', error.message);
  // Fallback behavior
  return defaultResponse;
}
```

---

**💡 Pro Tip:** Start with the basic configuration and gradually add customizations as you learn what works best for your specific use case!