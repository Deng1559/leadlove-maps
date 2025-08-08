# LeadLove Maps – Phase Implementation Plan (with Feedback Loop)

## 🚀 Overview
**LeadLove Maps** is an AI SaaS platform for lead generation from Google Maps, enriched with AI, and pushed into outreach systems like Snov.io. It supports a credit-based web UI and CSV export workflows integrated with Google Sheets, Google Drive, and n8n automation.

---

## 🌐 Phase 1 – Infrastructure & MVP (Completed)
- ✅ Supabase + Stripe authentication, credit system
- ✅ Web UI with lead input, result status, and credit tracking
- ✅ n8n Integration via Webhook & LeadLove API (Google Maps scrape)

---

## 📈 Phase 2 – Data Enrichment & Export

### Enrichment Pipeline:
- Enrich each business record using:
  - Google Reviews (rating, volume, freshness)
  - Keywords from description
  - Domain/site presence check
  - Tags: risky / trusted / opportunity

### Data Output:
- ✅ Push structured results into:
  - 🔹 **Google Sheets** (Primary DB)
  - 🔹 **Google Drive** (CSV backups)
- Schema includes:
```json
{
  "business_name": "",
  "address": "",
  "email": "",
  "phone": "",
  "domain_found": true,
  "rating": 4.3,
  "review_count": 102,
  "tag": "risky"
}
```
- Credits adjusted dynamically per result batch (auto-refund if failed)

---

## ✉️ Phase 3 – Cold Email System (Snov.io)
- API Integration with **Snov.io** (vetted lead push)
- Use email verifier to tag `.risky` leads
- Automatically send verified leads to campaigns
- Store all risky leads separately in Drive

**CSV Export:**
- ✅ Format compatible with Snov.io import
- Includes enrichment metadata & tags

---

## 🧠 Phase 4 – AI Feedback Loop & User Feature Voting

### Feedback Loop:
- Collect campaign outcome feedback via Google Form or frontend UI
- Write response data back to Supabase with `lead_id`
- Score lead quality and Snov campaign effectiveness

### Feature Voting:
- Let users upvote feature requests via `/roadmap`
- Store votes in Supabase to inform backlog priorities
- Feed top-voted features into future releases

---

## ⚙️ Required .env Variables (Add to `.env.local`)
```env
GOOGLE_DRIVE_FOLDER_ID=YOUR_FOLDER_ID_HERE
SNOV_API_KEY=YOUR_SNOVAIO_KEY
GOOGLE_SERVICE_ACCOUNT_JSON=...
SNOV_CLIENT_ID=...
SNOV_CLIENT_SECRET=...
```
---

## ✅ Next Steps
1. 🔁 Generate n8n JSON workflows:
   - Enrichment + Export to Google Sheets + Drive
   - Snov.io integration with conditional CSV routing
2. 🧪 Test with 500 leads
3. 🎯 Launch first 100-user test phase
4. 🔁 Add outcome loop for continuous training

## 🏗️ Technical Implementation Details

### Database Extensions
- `enriched_leads` table for processed business data
- `feedback_responses` table for campaign outcomes  
- `feature_requests` table for user voting system

### API Endpoints
- `/api/enrichment/process` - Main enrichment pipeline
- `/api/google-sheets/export` - Google Sheets integration
- `/api/google-drive/backup` - CSV backup to Drive
- `/api/snov/export` - Snov.io lead export
- `/api/feedback/submit` - Campaign outcome feedback
- `/api/roadmap/features` - Feature request voting

### Required Dependencies
- `googleapis` - Google Sheets/Drive API integration
- `snov-api` - Snov.io API client
- `csv-parser` & `csv-stringify` - CSV processing
- `node-html-parser` - Domain checking utilities

### Integration Considerations
- **Backward Compatibility**: All Phase 1 functionality preserved
- **Credit System**: Dynamic pricing for enrichment features
- **Error Handling**: Graceful degradation for external API failures
- **Security**: OAuth scopes for Google APIs, secure API key storage
- **Performance**: Batch processing for large lead datasets
- **Monitoring**: Enhanced logging for enrichment pipeline tracking