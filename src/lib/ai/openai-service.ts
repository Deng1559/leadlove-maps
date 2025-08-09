/**
 * OpenAI Service for Email Generation
 * Handles AI-powered email sequence generation using OpenAI GPT models
 */

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AIEmailGenerationRequest {
  businessData: {
    name: string;
    industry: string;
    location: string;
    ownerName?: string;
    website?: string;
    rating?: string;
    reviewCount?: string;
  };
  serviceOffering: string;
  sequenceType: 'original' | 'apollo';
  systemPrompt: string;
  userPrompt: string;
}

export interface AIEmailGenerationResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class OpenAIService {
  private config: OpenAIConfig;

  /**
   * Industry-specific service recommendations
   */
  private serviceRecommendations = {
    'digital-marketing': {
      restaurants: ['online reviews management', 'local SEO', 'social media for food photos', 'delivery app optimization', 'Google My Business'],
      retail: ['local SEO', 'Google My Business optimization', 'foot traffic analysis', 'online inventory visibility', 'customer review management'],
      healthcare: ['patient acquisition', 'online reputation management', 'appointment booking systems', 'local medical SEO', 'HIPAA-compliant marketing'],
      fitness: ['membership growth campaigns', 'class booking optimization', 'social proof building', 'community engagement', 'local fitness SEO'],
      'real estate': ['lead generation', 'local market positioning', 'credibility building', 'virtual tour marketing', 'neighborhood expertise branding'],
      automotive: ['service reminder campaigns', 'local automotive SEO', 'customer retention', 'review management', 'seasonal service promotions'],
      legal: ['legal lead generation', 'reputation management', 'local legal SEO', 'case study marketing', 'attorney credibility building'],
      consulting: ['thought leadership', 'local business networking', 'referral systems', 'expertise positioning', 'content marketing']
    },
    'automation': {
      restaurants: ['online ordering systems', 'reservation management', 'customer loyalty programs', 'inventory tracking', 'staff scheduling'],
      retail: ['inventory management', 'customer data systems', 'point-of-sale integration', 'supplier automation', 'customer communication'],
      healthcare: ['appointment reminders', 'patient communication', 'insurance processing', 'medical record management', 'billing automation'],
      fitness: ['class booking systems', 'membership management', 'payment processing', 'member communication', 'equipment scheduling'],
      'real estate': ['lead qualification', 'client onboarding', 'property management', 'document automation', 'showing scheduling'],
      automotive: ['service scheduling', 'customer follow-up', 'parts inventory', 'warranty tracking', 'maintenance reminders'],
      legal: ['case management', 'client intake', 'document automation', 'billing systems', 'court date tracking'],
      consulting: ['project management', 'client onboarding', 'time tracking', 'proposal automation', 'follow-up systems']
    }
  };

  /**
   * Validate service relevance for business type
   */
  private validateServiceRelevance(industry: string, serviceOffering: string): string[] {
    const normalizedIndustry = industry.toLowerCase();
    const recommendations = this.serviceRecommendations[serviceOffering as keyof typeof this.serviceRecommendations];
    
    if (!recommendations) return [];
    
    // Find the best match for the industry
    const exactMatch = recommendations[normalizedIndustry as keyof typeof recommendations];
    if (exactMatch) return exactMatch;
    
    // Fallback matches
    const fallbackMatches: Record<string, string> = {
      'restaurants': 'restaurants',
      'food': 'restaurants',
      'pizza': 'restaurants',
      'cafe': 'restaurants',
      'retail': 'retail',
      'shop': 'retail',
      'store': 'retail',
      'clothing': 'retail',
      'doctor': 'healthcare',
      'medical': 'healthcare',
      'clinic': 'healthcare',
      'dental': 'healthcare',
      'gym': 'fitness',
      'fitness': 'fitness',
      'yoga': 'fitness',
      'personal training': 'fitness',
      'realtor': 'real estate',
      'real estate': 'real estate',
      'property': 'real estate',
      'auto': 'automotive',
      'car': 'automotive',
      'mechanic': 'automotive',
      'lawyer': 'legal',
      'attorney': 'legal',
      'law': 'legal',
      'consultant': 'consulting',
      'consulting': 'consulting'
    };
    
    for (const [key, value] of Object.entries(fallbackMatches)) {
      if (normalizedIndustry.includes(key)) {
        return recommendations[value as keyof typeof recommendations] || [];
      }
    }
    
    return [];
  }

  constructor(config?: Partial<OpenAIConfig>) {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: config?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: config?.maxTokens || parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      temperature: config?.temperature || parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      ...config
    };

    if (!this.config.apiKey) {
      console.warn('OpenAI API key not configured. AI email generation will be disabled.');
    }
  }

  /**
   * Generate AI-powered email content
   */
  async generateEmailContent(request: AIEmailGenerationRequest): Promise<AIEmailGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: request.systemPrompt
            },
            {
              role: 'user',
              content: request.userPrompt
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        }
      };

    } catch (error: any) {
      console.error('OpenAI API call failed:', error);
      throw new Error(`AI email generation failed: ${error.message}`);
    }
  }

  /**
   * Generate B2B email sequence using AI with business context research
   */
  async generateB2BSequence(businessData: any, serviceOffering: string): Promise<any> {
    // Validate service relevance and get specific recommendations
    const relevantServices = this.validateServiceRelevance(businessData.industry, serviceOffering);
    if (relevantServices.length === 0) {
      throw new Error(`${serviceOffering} services are not relevant for ${businessData.industry} businesses`);
    }
    const systemPrompt = `You are an expert B2B cold-email strategist and copywriter with deep industry knowledge. Your job is to generate highly targeted, relevant outreach campaigns based on thorough business context analysis.

CRITICAL: You must return ONLY valid JSON in this exact structure:

{
  "firstEmail": {
    "subjectLines": {
      "direct": ["subject1", "subject2", "subject3", "subject4", "subject5"],
      "casual": ["subject1", "subject2", "subject3", "subject4", "subject5"], 
      "curiosity": ["subject1", "subject2", "subject3", "subject4", "subject5"],
      "triggerBased": ["subject1", "subject2", "subject3", "subject4", "subject5"]
    },
    "opener": "personalized opener text",
    "pitch": "value proposition text", 
    "credibility": "social proof text",
    "callToAction": "CTA text"
  },
  "followUpSequence": {
    "email2": {
      "subject": "reminder subject",
      "body": "full email body with greeting"
    },
    "email3": {
      "subject": "new proof subject", 
      "body": "full email body with greeting"
    },
    "email4": {
      "subject": "new angle subject",
      "body": "full email body with greeting" 
    },
    "email5": {
      "subject": "goodbye subject",
      "body": "full email body with greeting"
    }
  }
}

## FRAMEWORK TO FOLLOW:

### Subject Lines (Keep under 60 characters):
- **Direct**: "Quick qn, [FirstName]", "Helping [Company] hit [Metric]"
- **Casual**: "Mind if I send something over?", "You open to this, [FirstName]?"
- **Curiosity**: "What [Company] isn't doing yet…", "Your SDRs won't like this"
- **Trigger-Based**: Use business context for relevance

### First Email Structure:
1. **Opener**: Personalized relevance about their business/industry
2. **Pitch**: "We help [ICP] achieve [Result] without [PainPoint]" 
3. **Credibility**: "We've helped 14 [industry] businesses land 8-10 qualified calls/week without ads"
4. **CTA**: "Worth a quick chat next week?" or "Want me to send a 90-second Loom?"

### Follow-Up Sequence (2-4 days apart):
- **Email 2**: Light reminder with recap of original pitch
- **Email 3**: New social proof with different client example
- **Email 4**: New angle addressing different pain point
- **Email 5**: Respectful goodbye with final soft offer

### BUSINESS RESEARCH & TARGETING REQUIREMENTS:

1. **Industry Analysis**: Research the specific challenges faced by businesses in their industry
2. **Service Relevance**: Only offer services that make logical sense for their business type
3. **Pain Point Identification**: Identify realistic pain points based on their industry and business model
4. **Value Proposition**: Create service offerings that directly address their likely needs
5. **Competitive Context**: Consider their competitive landscape and market position

### SERVICE OFFERING GUIDELINES:

**Digital Marketing Services - Best for:**
- Retail businesses (online presence, foot traffic)
- Restaurants (customer acquisition, reviews, delivery apps)
- Healthcare (patient acquisition, reputation management)
- Professional services (lead generation, credibility)
- E-commerce (traffic, conversions, customer acquisition)

**Business Automation Services - Best for:**
- Service businesses with booking/scheduling (appointment automation)
- Restaurants (order management, customer data)
- Healthcare (patient communication, appointment reminders)
- Professional services (CRM, follow-up automation)
- Businesses with repetitive processes (workflow automation)

### Key Principles:
- Research their ACTUAL business type and needs
- Only offer services that genuinely help their industry
- Use realistic, industry-specific pain points
- Include relevant metrics for their business type
- Professional but conversational tone
- Vary sentence length for natural flow
- Include clear, low-pressure CTAs`;

    const userPrompt = `BUSINESS ANALYSIS & EMAIL SEQUENCE GENERATION:

Target Business Information:
- Business Name: ${businessData.name}
- Industry: ${businessData.industry}
- Owner: ${businessData.ownerName || 'Business Owner'}
- Location: ${businessData.location}
- Proposed Service: ${serviceOffering}

RELEVANT SERVICES FOR ${businessData.industry.toUpperCase()} BUSINESSES:
${relevantServices.map(service => `- ${service}`).join('\n')}

IMPORTANT: Focus ONLY on these relevant services. Do not mention generic services that don't apply to ${businessData.industry} businesses.

STEP 1 - BUSINESS CONTEXT RESEARCH:
Analyze this ${businessData.industry} business and determine:
1. What are the TOP 3 most common challenges for ${businessData.industry} businesses?
2. How does ${serviceOffering} services specifically help ${businessData.industry} businesses?
3. What realistic metrics/outcomes would ${businessData.industry} businesses care about?
4. What would be their biggest pain points related to ${serviceOffering}?

STEP 2 - SERVICE RELEVANCE CHECK:
Before creating emails, validate:
- Does ${serviceOffering} make logical sense for a ${businessData.industry} business?
- What specific ${serviceOffering} solutions would directly help ${businessData.name}?
- What competitors in ${businessData.location} might they be losing business to?

STEP 3 - EMAIL SEQUENCE CREATION:
Create a targeted email sequence that:
1. Shows you understand their specific industry challenges
2. Offers RELEVANT ${serviceOffering} solutions that actually help ${businessData.industry} businesses
3. Uses realistic industry-specific pain points and metrics
4. References their local market competition and challenges
5. Positions ${serviceOffering} as the logical solution to their actual problems

IMPORTANT CONSTRAINTS:
- Only mention services that genuinely help ${businessData.industry} businesses
- Use realistic pain points that ${businessData.industry} businesses actually face
- Include metrics that ${businessData.industry} businesses would actually track
- Make the value proposition specifically relevant to their business type
- Sound like you've researched their industry, not using a generic template

Remember: Return ONLY the JSON structure specified above.`;

    const response = await this.generateEmailContent({
      businessData,
      serviceOffering,
      sequenceType: 'original',
      systemPrompt,
      userPrompt
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', response.content);
      throw new Error('AI returned invalid JSON format');
    }
  }

  /**
   * Generate Apollo local business sequence using AI
   */
  async generateApolloSequence(businessData: any, serviceOffering: string): Promise<any> {
    // Validate service relevance and get specific recommendations
    const relevantServices = this.validateServiceRelevance(businessData.industry, serviceOffering);
    if (relevantServices.length === 0) {
      throw new Error(`${serviceOffering} services are not relevant for ${businessData.industry} businesses`);
    }
    const systemPrompt = `You are an expert local business email strategist specializing in hyper-local personalization. You create authentic, community-focused email sequences that resonate with local business owners.

CRITICAL: You must return ONLY valid JSON in this exact structure:

{
  "sequenceType": "apollo-local",
  "timing": ["Day 1", "Day 4", "Day 8", "Day 12", "Day 16"],
  "emails": {
    "email1": {
      "subject": "subject line",
      "preview": "preview text",
      "body": "full email body",
      "purpose": "purpose description"
    },
    "email2": {
      "subject": "subject line", 
      "preview": "preview text",
      "body": "full email body",
      "purpose": "purpose description"
    },
    "email3": {
      "subject": "subject line",
      "preview": "preview text", 
      "body": "full email body",
      "purpose": "purpose description"
    },
    "email4": {
      "subject": "subject line",
      "preview": "preview text",
      "body": "full email body", 
      "purpose": "purpose description"
    },
    "email5": {
      "subject": "subject line",
      "preview": "preview text",
      "body": "full email body",
      "purpose": "purpose description"
    }
  }
}

## APOLLO 5-EMAIL SEQUENCE FRAMEWORK:

### Email 1 (Day 1): Warm Introduction & Local Connection
- **Purpose**: Establish local credibility and connection
- **Content**: Neighborhood reference + business compliment + pain point observation  
- **Tone**: Friendly, community-focused, consultative

### Email 2 (Day 4): Value Proposition & Benefits
- **Purpose**: Clearly articulate how you help local businesses
- **Content**: Specific benefits + local market insights + service overview
- **Tone**: Educational, value-focused, professional

### Email 3 (Day 8): Local Case Study
- **Purpose**: Provide social proof from similar local businesses
- **Content**: Specific local success story + measurable results + relevance
- **Tone**: Story-driven, results-focused, credible

### Email 4 (Day 12): Overcoming Common Objections  
- **Purpose**: Address typical concerns local businesses have
- **Content**: Common objection + understanding + solution + reassurance
- **Tone**: Empathetic, solution-oriented, trustworthy

### Email 5 (Day 16): Final Nudge & Easy Next Step
- **Purpose**: Last opportunity with minimal friction
- **Content**: Recap value + urgency/scarcity + super easy next step
- **Tone**: Respectful, final, easy action

### BUSINESS RESEARCH & TARGETING REQUIREMENTS:

1. **Industry Analysis**: Research what challenges this type of business faces locally
2. **Local Market Research**: Understand their local competitive landscape  
3. **Service Relevance**: Only offer services that make sense for their business type
4. **Customer Journey**: Understand how their customers find and choose businesses
5. **Local Business Ecosystem**: Consider their relationship with local community

### SERVICE OFFERING GUIDELINES:

**Digital Marketing for Local Businesses:**
- Restaurants: Online reviews, delivery apps, local SEO, social media for food photos
- Retail: Local SEO, Google My Business, foot traffic optimization, online inventory
- Healthcare: Patient acquisition, online reputation, appointment booking systems
- Professional Services: Lead generation, credibility building, local market positioning
- Fitness: Membership growth, class booking, social proof, community building

**Business Automation for Local Businesses:**
- Restaurants: Online ordering, reservation systems, customer loyalty programs
- Retail: Inventory management, customer data, point-of-sale integration
- Healthcare: Appointment reminders, patient communication, insurance processing
- Professional Services: Scheduling, client onboarding, follow-up automation
- Fitness: Class booking, membership management, payment processing

### Hyper-Local Personalization Requirements:
- Reference specific neighborhoods, landmarks, or business districts
- Mention local customer types, seasonal patterns, or regional challenges  
- Use local business case studies with realistic names and metrics
- Include references to local news, events, or community factors
- Address location-specific competition and market dynamics
- Only suggest services that genuinely help their type of local business
- Use regional terminology and cultural context naturally`;

    const userPrompt = `LOCAL BUSINESS ANALYSIS & APOLLO SEQUENCE GENERATION:

Target Business Information:
- Business Name: ${businessData.name}
- Industry: ${businessData.industry}
- Owner: ${businessData.ownerName || 'Business Owner'}
- Location: ${businessData.location}
- Proposed Service: ${serviceOffering}

RELEVANT SERVICES FOR LOCAL ${businessData.industry.toUpperCase()} BUSINESSES:
${relevantServices.map(service => `- ${service}`).join('\n')}

IMPORTANT: Focus ONLY on these relevant services. Do not mention generic services that don't make sense for local ${businessData.industry} businesses.

STEP 1 - LOCAL BUSINESS RESEARCH:
Analyze this ${businessData.industry} business in ${businessData.location} and determine:
1. What are the TOP 3 challenges facing ${businessData.industry} businesses in ${businessData.location}?
2. How does ${serviceOffering} specifically help local ${businessData.industry} businesses?
3. What local competitors might they be losing customers to?
4. What local customer behaviors/patterns affect ${businessData.industry} businesses?
5. What local events, seasons, or trends impact their business?

STEP 2 - SERVICE RELEVANCE FOR LOCAL MARKET:
Before creating emails, validate:
- What specific ${serviceOffering} solutions would help ${businessData.name} compete locally?
- How do customers in ${businessData.location} typically find ${businessData.industry} businesses?
- What local marketing challenges does ${businessData.name} likely face?
- What metrics would a local ${businessData.industry} business owner actually track?

STEP 3 - HYPER-LOCAL EMAIL SEQUENCE:
Create a 5-email sequence that:
1. Shows deep understanding of local ${businessData.industry} market in ${businessData.location}
2. References real local landmarks, neighborhoods, or business districts
3. Addresses actual challenges local ${businessData.industry} businesses face
4. Offers RELEVANT ${serviceOffering} solutions that make sense for their business type
5. Uses authentic local business case studies with realistic metrics
6. Incorporates local customer behavior and seasonal patterns
7. Positions ${serviceOffering} as the logical solution to their local market challenges

IMPORTANT CONSTRAINTS:
- Only suggest services that genuinely help ${businessData.industry} businesses
- Use realistic local challenges that ${businessData.industry} businesses face in ${businessData.location}
- Include metrics and outcomes that local business owners would actually care about
- Make case studies feel authentic to the ${businessData.location} market
- Sound like a local marketing expert, not a generic service provider
- Address real local competition and market dynamics

Each email should feel like it's written by someone who truly understands both the ${businessData.industry} industry AND the ${businessData.location} local market.

Remember: Return ONLY the JSON structure specified above.`;

    const response = await this.generateEmailContent({
      businessData,
      serviceOffering,
      sequenceType: 'apollo',
      systemPrompt,
      userPrompt
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', response.content);
      throw new Error('AI returned invalid JSON format');
    }
  }

  /**
   * Get service recommendations for a business
   */
  getServiceRecommendations(industry: string, serviceOffering: string): string[] {
    return this.validateServiceRelevance(industry, serviceOffering);
  }

  /**
   * Check if a service is relevant for a business type
   */
  isServiceRelevant(industry: string, serviceOffering: string): boolean {
    return this.validateServiceRelevance(industry, serviceOffering).length > 0;
  }

  /**
   * Check if OpenAI service is available
   */
  isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  /**
   * Get current configuration
   */
  getConfig(): Omit<OpenAIConfig, 'apiKey'> {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    };
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();