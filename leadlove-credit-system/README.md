# LeadLove Maps - Credit System

A comprehensive AI SaaS platform for generating, enriching, and managing qualified leads from Google Maps businesses. Features intelligent data enrichment, automated export workflows, campaign feedback loops, and community-driven development with dual-tier access (web frontend with credit system + private API for Telegram integration).

## 🚀 Features

### Core Functionality
- **Lead Generation**: Transform Google Maps business listings into qualified leads
- **AI-Powered Enrichment**: Google Reviews analysis, domain verification, risk assessment
- **Smart Export System**: Google Sheets integration, Drive backups, Snov.io automation
- **Campaign Feedback Loop**: Outcome tracking, quality scoring, AI model improvement
- **Community Features**: User-driven feature voting and development roadmap
- **Dual Access System**: Web frontend (credit-based) + Telegram integration (private API key)
- **Real-time Processing**: LeadLove Maps API integration with status tracking
- **Usage Analytics**: Comprehensive tracking and reporting

### Credit System
- **Flexible Pricing**: $10/month subscription + one-time credit packages
- **Dynamic Costing**: Base cost scaled by result count and enrichment features
- **Smart Refunds**: Automatic credit refunds for processing failures or poor data quality
- **Real-time Balance**: Live credit tracking with intelligent purchase prompts
- **Quality-based Pricing**: Credits adjusted based on lead enrichment success rates

### Authentication & Security
- **Supabase Auth**: Email/password + Google OAuth integration
- **Row Level Security**: Database-level access controls
- **Private API Access**: Secure Telegram integration with API key bypass
- **Stripe Integration**: PCI-compliant payment processing

## 🏗️ Tech Stack

### Frontend
- **Next.js 14**: App router with TypeScript
- **React 18**: Modern hooks and context patterns
- **ShadCN/UI**: Accessible component library
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Headless component primitives

### Backend & Integrations
- **Supabase**: PostgreSQL database with real-time subscriptions and RLS
- **Stripe API**: Payment processing and subscription management
- **Google APIs**: Sheets, Drive, and Places integration for data management
- **Snov.io API**: Email verification and campaign automation
- **OpenAI API**: AI-powered content generation and analysis
- **LeadLove Maps API**: External lead generation service integration
- **Vercel**: Serverless deployment platform

### Database Schema

#### Core System
- **Users**: Profile management and authentication
- **Credits**: Balance tracking and transaction history
- **Subscriptions**: Stripe integration and billing
- **Usage Tracking**: Analytics and reporting

#### Phase 2-4 Enhancements
- **Enriched Leads**: AI-enhanced business data with quality scores
- **Snov Campaigns**: Email campaign tracking and performance metrics
- **Feedback Responses**: Campaign outcome data for AI learning
- **Feature Requests**: Community-driven development with voting system
- **Tool Configurations**: Enhanced service settings and preferences

## 📦 Installation

### Prerequisites
- Node.js 18+
- Supabase account and project
- Stripe account (test mode for development)
- Access to LeadLove Maps API
- Google Cloud Platform account (for Sheets/Drive/Places APIs)
- Snov.io account and API access
- OpenAI API key for AI-powered features

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leadlove-credit-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create `.env.local` with:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Application Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   LEADLOVE_PRIVATE_API_KEY=your_secure_private_key

   # LeadLove Maps Integration
   LEADLOVE_MAPS_API_URL=https://leadlove-maps.lovable.app
   LEADLOVE_MAPS_API_KEY=your_leadlove_api_key

   # Google Services Integration (Phase 2)
   GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
   GOOGLE_SERVICE_ACCOUNT_JSON=your_base64_encoded_service_account_json
   GOOGLE_SHEETS_ID=your_google_sheets_id
   GOOGLE_PLACES_API_KEY=your_google_places_api_key

   # Snov.io Integration (Phase 3)
   SNOV_API_KEY=your_snovaio_api_key
   SNOV_CLIENT_ID=your_snov_client_id
   SNOV_CLIENT_SECRET=your_snov_client_secret
   SNOV_API_URL=https://api.snov.io

   # OpenAI Configuration
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```

### Database Setup

1. **Run Supabase migrations**
   ```bash
   npm run supabase:start
   supabase db reset
   ```

2. **Set up Row Level Security**
   - Enable RLS on all tables
   - Policies are included in migration files

### Development

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🎯 API Endpoints

### Lead Generation & Processing
- `POST /api/leadlove/generate` - Generate leads with dual authentication
- `POST /api/leadlove/status` - Check workflow processing status
- `POST /api/enrichment/process` - AI-powered lead enrichment pipeline
- `GET /api/enrichment/process` - Get enrichment batch status

### Data Export & Integration
- `POST /api/google-sheets/export` - Export enriched leads to Google Sheets
- `GET /api/google-sheets/export` - Check export status or get spreadsheet info
- `POST /api/google-drive/backup` - Backup leads to Google Drive (CSV/JSON)
- `GET /api/google-drive/backup` - Check backup status or list backups
- `POST /api/snov/export` - Export to Snov.io with email verification
- `GET /api/snov/export` - Get campaign status or account info

### Feedback & Community
- `POST /api/feedback/submit` - Submit campaign outcome feedback
- `GET /api/feedback/submit` - Get feedback statistics or history
- `POST /api/roadmap/features` - Submit feature requests or admin updates
- `GET /api/roadmap/features` - Browse feature requests with voting
- `PUT /api/roadmap/features` - Vote on feature requests
- `DELETE /api/roadmap/features` - Delete features (admin only)

### User Management & Analytics
- `GET /api/usage` - Get user usage history
- `POST /api/usage` - Track tool usage
- `POST /api/webhooks/stripe` - Handle Stripe webhook events

## 🔧 Configuration

### Credit Costs
```typescript
const baseCosts = {
  'leadlove_maps': 3,        // Base cost for lead generation
  'email_generator': 1,      // Additional services
  'business_analyzer': 1,
  'competitor_analysis': 2,
  // Scaled by result count for leadlove_maps
}
```

### Subscription Plans
- **Starter**: $10/month - 100 credits + monthly refill
- **Growth**: Custom pricing available
- **One-time Purchases**: Flexible credit packages

## 🚦 Usage

### Web Frontend Access
1. **User Registration**: Email/password or Google OAuth
2. **Credit Purchase**: Stripe-powered subscription or one-time purchase
3. **Lead Generation**: Form-based business search
4. **Result Tracking**: Real-time status updates and history

### Telegram Integration
1. **Private API Key**: Bypass credit system for authenticated users
2. **Direct n8n Access**: Seamless workflow integration
3. **Free Usage**: No credit consumption for private API access

### API Usage Example
```javascript
// Web frontend (credit-based)
const response = await fetch('/api/leadlove/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessType: 'restaurants',
    location: 'Miami Beach, FL',
    serviceOffering: 'digital marketing',
    maxResults: 20
  })
});

// Telegram integration (private API)
const response = await fetch('/api/leadlove/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessType: 'restaurants',
    location: 'Miami Beach, FL',
    serviceOffering: 'digital marketing',
    maxResults: 20,
    apiKey: process.env.LEADLOVE_PRIVATE_API_KEY,
    userId: 'telegram_user_id'
  })
});
```

## 📊 Database Schema

### Core Tables
- **`users`**: User profiles and authentication
- **`user_credit_summary`**: Real-time credit balances (view)
- **`credit_packages`**: Available credit packages and pricing
- **`credit_transactions`**: All credit movements and history
- **`subscriptions`**: Stripe subscription management
- **`usage_tracking`**: Tool usage analytics and reporting

### Key Functions

#### Core Functions
- **`get_user_credit_balance(uuid)`**: Get current credit balance
- **`consume_credits(uuid, amount, tool, metadata)`**: Consume credits with tracking
- **`add_credits(uuid, amount, type, description)`**: Add credits with transaction log

#### Phase 2-4 Enhancements
- **`calculate_lead_quality_score(...)`**: AI-powered lead quality assessment
- **`update_feature_request_votes()`**: Automatic vote counting and statistics
- **`update_enriched_leads_updated_at()`**: Timestamp management for enriched data

#### Analytics Views
- **`enrichment_pipeline_stats`**: Performance metrics for enrichment processes
- **`feature_request_leaderboard`**: Top-voted community feature requests

## 🔐 Security Features

### Authentication
- **Supabase Auth**: Secure user management
- **Row Level Security**: Database-level access controls
- **API Key Validation**: Private API access for Telegram
- **Session Management**: JWT-based authentication

### Payment Security
- **Stripe Integration**: PCI-compliant payment processing
- **Webhook Verification**: Signed webhook validation
- **Idempotency**: Duplicate payment prevention
- **Automatic Refunds**: Failed transaction recovery

## 📈 Analytics & Monitoring

### User Analytics
- **Usage History**: Complete tool usage tracking
- **Success Rates**: Processing success/failure metrics
- **Credit Consumption**: Spending patterns and trends
- **Performance Metrics**: Processing times and efficiency

### Business Analytics
- **Revenue Tracking**: Subscription and purchase analytics
- **User Engagement**: Tool usage patterns
- **Conversion Metrics**: Trial to paid conversion
- **Churn Analysis**: Subscription cancellation tracking

## 🚀 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Environment variables configured in Vercel dashboard
```

### Environment Configuration
- **Production URLs**: Update all environment variables
- **Stripe Webhooks**: Configure production webhook endpoints
- **Supabase**: Production database connection
- **n8n Integration**: Production workflow URLs

## 🔄 n8n Integration

### Webhook Configuration
- **Frontend Endpoint**: `/leadlove-credit-system`
- **Status Endpoint**: `/leadlove-status`
- **Request Format**: Standardized payload with user identification
- **Response Format**: Workflow ID and processing status

### Enhanced Workflow Requirements

#### Phase 1 (Implemented)
- **Business Search**: Google Maps API integration
- **Email Generation**: AI-powered content creation
- **Result Processing**: Structured data output
- **Status Updates**: Real-time progress tracking

#### Phase 2-4 Enhancements
- **Data Enrichment**: Google Reviews, domain verification, risk assessment
- **Export Automation**: Google Sheets/Drive integration with organized workflows
- **Email Campaign Integration**: Snov.io automation with verification and routing
- **Feedback Collection**: Campaign outcome tracking for continuous AI improvement
- **Community Features**: Feature voting and roadmap management workflows

## 📝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Testing**: Unit tests for critical functions
- **Documentation**: Update README for new features

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Email**: Contact support for subscription and billing questions

## 🗺️ Roadmap

### Phase 1: Core Platform ✅
- [x] Credit system implementation
- [x] Stripe payment integration
- [x] Lead generation functionality
- [x] Dual-tier API access
- [x] Usage tracking and analytics

### Phase 2: Data Enrichment & Export ✅
- [x] **Business Data Enrichment**
  - Google Reviews integration (rating, volume, freshness)
  - Keyword extraction from business descriptions
  - Domain/website presence verification with parking detection
  - AI-powered risk assessment tagging (risky/trusted/opportunity)
  - Lead quality scoring with multiple factors
- [x] **Google Services Integration**
  - Google Sheets export with auto-formatting and user sharing
  - Google Drive CSV/JSON backup with organized folder structure
  - Risk-based file separation and real-time synchronization
- [x] **Enhanced Lead Processing**
  - Batch enrichment with concurrency control and progress tracking
  - Dynamic credit adjustment based on enrichment success rates
  - Automatic refunds for failed enrichment processes
  - Comprehensive filtering and export options

### Phase 3: Cold Email System (Snov.io) ✅
- [x] **Snov.io API Integration**
  - Automated prospect list creation and campaign setup
  - Bulk email verification with confidence scoring
  - Campaign-ready CSV export with custom fields
  - Account credit monitoring and usage tracking
- [x] **Smart Lead Routing**
  - Automatic separation of risky vs. verified leads
  - Quality and risk-based filtering for campaign inclusion
  - Risk-based lead storage in separate Drive folders
  - Advanced filtering options (min quality score, risk thresholds)
- [x] **Email Campaign Management**
  - Integration with Snov.io prospect lists and campaigns
  - Campaign performance tracking with comprehensive statistics
  - Lead lifecycle tracking from generation to conversion

### Phase 4: AI Feedback Loop & User Features ✅
- [x] **Campaign Outcome Tracking**
  - Comprehensive feedback collection system for campaign results
  - Lead quality rating system with 1-5 scoring
  - Deal value tracking and conversion metrics
  - Bulk feedback processing with campaign integration
- [x] **User-Driven Feature Development**
  - Full-featured `/roadmap` voting interface with category filtering
  - Community-driven feature prioritization with weighted voting
  - Admin controls for feature lifecycle management
  - Transparent development roadmap with user input and statistics
- [x] **Analytics & Learning Foundation**
  - Campaign performance analytics and success rate tracking
  - Lead quality improvement data collection infrastructure
  - Statistical analysis views for data-driven decision making
  - Foundation for future ML-powered lead quality prediction

### Phase 5: Enterprise Features (Future)
- [ ] White-label solutions
- [ ] Advanced analytics dashboard
- [ ] Custom integrations
- [ ] Enterprise SSO
- [ ] Dedicated support

## 🌟 Advanced Features & Capabilities

### AI-Powered Lead Enrichment
- **Google Reviews Analysis**: Automatic rating, review count, and freshness scoring
- **Domain Intelligence**: Website verification with parking detection and status analysis
- **Risk Assessment Engine**: AI-powered classification (risky/trusted/opportunity) with confidence scores
- **Quality Scoring Algorithm**: Multi-factor lead quality assessment with customizable weights
- **Keyword Extraction**: Intelligent business categorization and keyword identification
- **Batch Processing**: Concurrent enrichment with configurable performance limits

### Smart Export & Integration System
- **Google Sheets Integration**: Automated spreadsheet creation with professional formatting
- **Google Drive Backup**: Organized folder structure with date-based organization
- **Risk-Based File Separation**: Automatic lead segmentation by quality and risk factors
- **Snov.io Campaign Automation**: Direct prospect list creation with email verification
- **CSV Export Options**: Multiple formats with customizable field selection
- **Real-time Synchronization**: Live updates across all integrated platforms

### Campaign Performance Tracking
- **Outcome Collection**: Comprehensive feedback system for email campaign results
- **Conversion Metrics**: Deal tracking with value analysis and ROI calculation
- **Quality Ratings**: 1-5 scale rating system for response and lead quality
- **Performance Analytics**: Success rate analysis with trend identification
- **Bulk Data Processing**: Efficient handling of large-scale feedback submissions
- **Campaign Integration**: Direct linking with Snov.io campaigns for lifecycle tracking

### Community-Driven Development
- **Feature Voting System**: Democratic feature prioritization with weighted voting
- **Category-Based Organization**: Organized feature requests by domain (enrichment, UI, API, etc.)
- **Admin Management**: Complete feature lifecycle management with status tracking
- **Transparent Roadmap**: Public visibility into development priorities and progress
- **User Engagement**: Community-driven product development with direct user input
- **Statistics Dashboard**: Voting trends and feature popularity analytics

### Enterprise-Grade Architecture
- **Row-Level Security**: Comprehensive data protection with user-based access controls
- **API Rate Limiting**: Intelligent throttling and performance optimization
- **Error Recovery**: Automatic retry mechanisms with graceful degradation
- **Credit Management**: Dynamic pricing with quality-based adjustments
- **Webhook Integration**: Real-time event processing with multiple provider support
- **Monitoring & Analytics**: Comprehensive usage tracking and performance metrics

---

**Built with ❤️ for lead generation professionals**