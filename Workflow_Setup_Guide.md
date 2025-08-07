# 🗺️ AI-Enhanced Google Maps Lead Generator - Setup Guide

## 📋 Overview

This n8n workflow creates a powerful lead generation system that:
- Takes business search requests via Telegram
- Scrapes Google Maps using Apify
- Enriches data with AI analysis
- Generates personalized outreach messages
- Saves everything to Google Sheets

## 🔧 Required Credentials & Setup

### 1. Telegram Bot Setup
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow prompts to create your bot
4. Copy the Bot Token
5. In n8n: Create `Telegram` credentials with your bot token

### 2. Apify Setup
1. Sign up at [Apify.com](https://apify.com) (free tier available)
2. Go to Settings → Integrations → API tokens
3. Create a new API token
4. Replace `YOUR_APIFY_TOKEN` in the workflow with your actual token

### 3. OpenAI Setup
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. In n8n: Create `OpenAI` credentials with your API key

### 4. Google Sheets Setup
1. Create OAuth2 credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Sheets API
3. In n8n: Create `Google Sheets OAuth2` credentials
4. Create a new Google Sheet for your leads

## 📊 Google Sheets Template

Create a Google Sheet with these exact column headers:

| Business Name | Category | Address | Phone | Website | Google Rating | Review Count | Google Maps URL | LinkedIn URL | Service Offering | Service Description | AI Business Analysis | Target Audience | Pain Points | Service Opportunity | Service Fit Score | Urgency Level | Value Proposition | Key Selling Points | Potential ROI | Personalized Outreach Message | Contact Status | Lead Quality | Recommended Next Steps | Date Added | Original Search Query |

## 🚀 How to Use

### Input Format Examples:

**Basic Format:**
```
restaurants in Miami for digital marketing
dentists near Chicago - voice AI services  
lawyers in NYC | website development
coffee shops San Francisco offering SEO
gyms in Austin for social media management
```

### Service Options Supported:
- **Digital Marketing** - SEO, social media, online advertising
- **Voice AI** - Call automation, appointment booking
- **Website Development** - Design, development, optimization  
- **Lead Generation** - Customer acquisition systems
- **SEO** - Search engine optimization
- **Social Media Management** - Content, engagement, growth
- **Business Automation** - Process optimization
- **Content Marketing** - Content creation, strategy
- **Email Marketing** - Campaign automation
- **Chatbots** - Customer support automation

## 🎯 Workflow Process

1. **User sends message:** `"restaurants in Miami for digital marketing"`
2. **System parses:** Business type (restaurants) + Location (Miami) + Service (digital marketing)
3. **Apify scrapes:** Google Maps for Miami restaurants
4. **AI analyzes:** Each restaurant for digital marketing opportunities
5. **System generates:** Personalized digital marketing messages
6. **Saves to sheets:** Complete lead database with outreach messages
7. **Sends summary:** Telegram confirmation with results

## 📈 Expected Output

Each lead will include:
- ✅ Complete business contact information
- ✅ AI-powered business insights
- ✅ Service fit scoring (1-10)
- ✅ Pain point analysis  
- ✅ Personalized outreach messages
- ✅ Social media profile suggestions
- ✅ Lead quality rating
- ✅ Recommended next steps

### Example Output Message:
> "Hi Mario's Pizza! I noticed you have excellent 4.8-star reviews in Miami. I help local restaurants increase online orders and attract more customers through targeted digital marketing. Would you be interested in a quick 15-minute call to discuss growing your delivery business?"

## 🔄 Installation Steps

1. **Import Workflow:**
   - Copy the JSON from `Enhanced_Google_Maps_Lead_Generator_with_AI_Enrichment.json`
   - In n8n: Import → Paste JSON

2. **Update Credentials:**
   - Replace all credential IDs with your own:
     - `telegram-credentials` → Your Telegram credentials
     - `openai-credentials` → Your OpenAI credentials  
     - `google-sheets-credentials` → Your Google Sheets credentials

3. **Update Apify Token:**
   - Find the "🗺️ Scrape Google Maps with Apify" node
   - Replace `YOUR_APIFY_TOKEN` with your actual Apify API token

4. **Configure Google Sheets:**
   - Update the Google Sheets node with your sheet ID
   - Ensure column headers match the template above

5. **Set Telegram Webhook:**
   - Activate the workflow
   - Copy the webhook URL from the Telegram trigger
   - Set up webhook with Telegram (n8n will handle this automatically)

## 💡 Pro Tips

### For Best Results:
- Focus on leads with 8+ service fit scores
- Prioritize "High" urgency level leads
- Use "High" quality leads first
- Customize service descriptions for your specific offerings

### Message Personalization:
- Messages reference business name and location
- Include specific pain points identified by AI
- Highlight relevant service benefits
- Include soft call-to-action

### Lead Scoring System:
- **High Quality (8-10):** Best prospects, immediate follow-up
- **Medium Quality (6-7):** Good prospects, standard follow-up  
- **Low Quality (1-5):** Lower priority, nurture campaigns

## 🐛 Troubleshooting

### Common Issues:

1. **Apify Rate Limits:**
   - Free tier: 1,000 results/month
   - Upgrade for higher limits

2. **OpenAI API Limits:**
   - Monitor usage on OpenAI dashboard
   - Set usage limits to control costs

3. **Google Sheets Permissions:**
   - Ensure OAuth2 has proper permissions
   - Check if sheet is shared correctly

4. **Telegram Bot Not Responding:**
   - Verify bot token is correct
   - Check webhook URL is active
   - Ensure workflow is activated

## 💰 Cost Breakdown

### Free Tier Usage:
- **Apify:** 1,000 Google Maps results/month free
- **OpenAI:** $5 credit for new accounts
- **Google Sheets:** Free for personal use
- **Telegram:** Completely free

### Estimated Costs (After Free Tier):
- **Apify:** ~$10/month for 10,000 results
- **OpenAI:** ~$10-20/month for AI analysis
- **Total:** ~$20-30/month for professional use

## 🎯 Use Cases

### Perfect For:
- **Digital Marketing Agencies** - Find local businesses needing online presence
- **Web Development** - Target businesses with outdated websites  
- **Voice AI Services** - Find businesses that could benefit from automation
- **Lead Generation** - Build targeted prospect lists
- **Sales Teams** - Research and qualify leads automatically

### Industries That Work Well:
- Restaurants & Food Service
- Professional Services (lawyers, dentists, etc.)
- Retail & E-commerce
- Health & Wellness
- Home Services
- Entertainment & Recreation

## 📞 Support

If you need help with setup or customization:
1. Check the n8n documentation
2. Review error logs in n8n execution history
3. Test each node individually to isolate issues
4. Verify all credentials are properly configured

---

**Ready to generate high-quality leads with AI? Import the workflow and start building your prospect database today! 🚀**