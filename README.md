# LeadLove Maps - AI-Powered Lead Generation

Next.js application for AI-powered lead generation from Google Maps with email sequence generation.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📋 Features

- **AI Email Generation**: Create personalized email sequences using GPT-4
- **Google Maps Integration**: Extract business leads from Google Maps data  
- **Credit System**: Manage usage with flexible credit-based pricing
- **Supabase Backend**: Secure authentication and database management
- **Stripe Payments**: Integrated payment processing for credit purchases
- **Comprehensive Testing**: Unit, integration, E2E, and accessibility tests

## 🛠 Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **UI**: Tailwind CSS + Radix UI components
- **Backend**: Supabase (auth, database, real-time)
- **Payments**: Stripe
- **AI**: OpenAI GPT-4
- **Testing**: Jest, Playwright
- **Deployment**: Vercel

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable components
│   │   ├── ui/            # Base UI components
│   │   ├── auth/          # Auth-related components
│   │   ├── dashboard/     # Dashboard components
│   │   └── leadlove/      # Lead generation components
│   ├── lib/               # Utility libraries
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript type definitions
├── __tests__/             # Test files
├── supabase/              # Database migrations and config
├── scripts/               # Build and utility scripts
└── public/                # Static assets
```

## 🔧 Environment Variables

Create a `.env.local` file with:

```bash
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub repository
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Set these in your Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production domain)

## 📊 Key Components

### Lead Generation Flow
1. **Input**: Business type, location, service offering
2. **Processing**: AI analysis and email sequence generation
3. **Output**: Personalized email campaigns ready for cold email platforms

### Credit System
- **Free Tier**: 10 credits for new users
- **Paid Tiers**: Flexible credit packages
- **Usage Tracking**: Real-time credit balance and usage analytics

### Integration Points
- **Snov.io**: Direct CSV export for email campaigns
- **Apollo.io**: Compatible lead and sequence formats
- **Google Sheets**: Automated lead database management

## 🔐 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row-level security policies
- **API Protection**: Rate limiting and input validation
- **Data Encryption**: Encrypted sensitive data storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Ready for deployment!** This Next.js application is optimized for Vercel deployment with comprehensive testing, security, and scalability features.