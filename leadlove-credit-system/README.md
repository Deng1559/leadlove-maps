# LeadLove Maps - Credit System



## 🚀 Features

### Core Functionality
- **Lead Generation**: Transform Google Maps business listings into qualified leads
- **AI-Powered Email Sequences**: Generate personalized outreach campaigns
- **Dual Access System**: Web frontend (credit-based) + Telegram integration (private API key)
- **Real-time Processing**: LeadLove Maps API integration with status tracking
- **Usage Analytics**: Comprehensive tracking and reporting

### Credit System
- **Flexible Pricing**: $10/month subscription + one-time credit purchases
- **Dynamic Costing**: 3 credits base, scaled by result count (10-50 businesses)
- **Auto-refunds**: Credits automatically refunded on processing failures
- **Real-time Balance**: Live credit tracking with purchase prompts

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

### Backend
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Stripe API**: Payment processing and subscription management
- **LeadLove Maps API**: External lead generation service integration
- **Vercel**: Serverless deployment platform

### Database Schema
- **Users**: Profile management and authentication
- **Credits**: Balance tracking and transaction history
- **Subscriptions**: Stripe integration and billing
- **Usage Tracking**: Analytics and reporting
- **Tool Configurations**: Service settings and preferences

## 📦 Installation

### Prerequisites
- Node.js 18+
- Supabase account and project
- Stripe account (test mode for development)
- Access to LeadLove Maps API

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

### Lead Generation
- `POST /api/leadlove/generate` - Generate leads with dual authentication
- `POST /api/leadlove/status` - Check workflow processing status

### User Management
- `GET /api/usage` - Get user usage history
- `POST /api/usage` - Track tool usage

### Payment Processing
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
- **`get_user_credit_balance(uuid)`**: Get current credit balance
- **`consume_credits(uuid, amount, tool, metadata)`**: Consume credits with tracking
- **`add_credits(uuid, amount, type, description)`**: Add credits with transaction log

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

### Workflow Requirements
- **Business Search**: Google Maps API integration
- **Email Generation**: AI-powered content creation
- **Result Processing**: Structured data output
- **Status Updates**: Real-time progress tracking

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

### Phase 2: Enhanced Features
- [ ] Advanced filtering and search options
- [ ] Bulk lead processing
- [ ] Email template customization
- [ ] Team collaboration features
- [ ] API rate limiting and quotas

### Phase 3: Enterprise Features
- [ ] White-label solutions
- [ ] Advanced analytics dashboard
- [ ] Custom integrations
- [ ] Enterprise SSO
- [ ] Dedicated support

---

**Built with ❤️ for lead generation professionals**A full-stack AI SaaS platform for generating qualified leads from Google Maps businesses with AI-powered email sequences. Features dual-tier access (web frontend with credit system + private API for Telegram integration).