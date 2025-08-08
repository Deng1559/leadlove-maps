/**
 * AI-Powered B2B Cold Email Strategist System
 * High-performing, sequence-based outreach campaigns that book meetings, spark replies, and convert prospects
 * Now powered by OpenAI for dynamic email generation
 */

import { openAIService } from './ai/openai-service';

export interface EmailPersona {
  icp: string; // Ideal Customer Profile
  outcome: string; // Promise/Result we deliver
  painPoints: string[]; // Common pain points
  metrics: string[]; // Relevant metrics/KPIs
  credibilityPoints: string[]; // Proof points and wins
  triggers: string[]; // Event-based triggers for personalization
}

export interface EmailVariables {
  firstName: string;
  company: string;
  industry: string;
  metric?: string;
  topic?: string;
  similarClient?: string;
  clientWin?: string;
  painPoint?: string;
  result?: string;
}

export interface SubjectLineSet {
  direct: string[];
  casual: string[];
  curiosity: string[];
  triggerBased: string[];
}

export interface EmailSequence {
  firstEmail: {
    subjectLines: SubjectLineSet;
    opener: string;
    pitch: string;
    credibility: string;
    callToAction: string;
  };
  followUpSequence: {
    email2: { // Reminder (2-4 days later)
      subject: string;
      body: string;
    };
    email3: { // New Proof (2-4 days later)
      subject: string;
      body: string;
    };
    email4: { // New Angle (2-4 days later)
      subject: string;
      body: string;
    };
    email5: { // Goodbye (2-4 days later)
      subject: string;
      body: string;
    };
  };
}

export interface ApolloEmailSequence {
  sequenceType: 'apollo-local';
  timing: string[];
  emails: {
    email1: { // Day 1: Warm Introduction & Local Connection
      subject: string;
      preview: string;
      body: string;
      purpose: string;
    };
    email2: { // Day 4: Value Proposition & Benefits
      subject: string;
      preview: string;
      body: string;
      purpose: string;
    };
    email3: { // Day 8: Local Case Study
      subject: string;
      preview: string;
      body: string;
      purpose: string;
    };
    email4: { // Day 12: Overcoming Objections
      subject: string;
      preview: string;
      body: string;
      purpose: string;
    };
    email5: { // Day 16: Final Nudge & Easy Next Step
      subject: string;
      preview: string;
      body: string;
      purpose: string;
    };
  };
  // Metadata for generation tracking
  generationMetadata?: {
    aiGenerated: boolean;
    fallbackUsed: boolean;
    aiModel?: string;
  };
}

/**
 * B2B Cold Email Strategist System Prompt - Updated Framework
 */
const B2B_EMAIL_STRATEGIST_PROMPT = `You are an expert B2B cold-email strategist and copywriter. Your job is to generate high-performing, sequence-based outreach campaigns that book meetings, spark replies, and convert prospects into clients. Follow this proven framework:

## 1. Subject Lines (Goal: Maximize Opens)
Four proven styles—keep them short, variable-driven, and test constantly:

**Direct:**
- e.g. "Quick qn, {{FirstName}}"
- "Helping {{Company}} hit {{Metric}}"

**Casual:**
- e.g. "Mind if I send something over?"
- "You open to this, {{FirstName}}?"

**Curiosity-Based:**
- e.g. "What {{Company}} isn't doing yet…"
- "A new angle for {{Company}}…"

**Trigger-Based:**
- Leverage real events or data (e.g. recent posts, tech stack)
- e.g. "Congrats on the new hire, {{FirstName}}"

## 2. First Email (Your "Foot in the Door")
Use a four-part structure—focus on outcomes, not features:

1. **Opener / Relevance**
   - Why you're reaching out (generic vs. personalized)

2. **Pitch + Outcome**
   - "We help {{ICP}} achieve {{Result}} without {{PainPoint}}"

3. **Credibility**
   - Quick proof: "Booked 14 calls in 30 days for {{SimilarClient}}"

4. **Call to Action**
   - Direct: "Worth a quick chat next week?"
   - Soft / Video: "Want me to send a 90-second Loom?"

**Tip:** If your offer or market is new, leading with a personalized Loom video dramatically boosts reply rates.

## 3. Follow-Up Sequence (Max 4 Emails, spaced 2–4 days apart)
Keep it natural, not aggressive. Vary the angle and CTA:

1. **Reminder**
   - Light nudge on your original pitch
   - e.g. "In case my last note slipped by…"

2. **New Proof**
   - Share another client win with similar outcomes
   - e.g. "We just helped {{SimilarClient}} drive {{Result}}"

3. **New Angle / Pain-Point**
   - Pivot to a different challenge (e.g. inbound response speed, lead triage)
   - e.g. "If outbound's off the table, here's what works…"

4. **Referral Ask or Value-Add**
   - "Are you the right person? Can you point me to someone who is?"
   - Or share a helpful tip/mini audit

5. **Goodbye Email**
   - Final, respectful sign-off with a soft offer
   - e.g. "No worries if now's not the right time—here's a quick Loom just in case."

**CTA Variations:** reply "yes," "send video," "worth a chat," etc.

## 4. Live 4-Step Example Sequence

**Email 1:**
- Subject: "Is this interesting to you?"
- Body: Personalized opener → "We help B2B firms land 8–10 qualified calls/week without ads" → proof + guarantee → "Want a breakdown?"

**Email 2:**
- Subject: "AI appointments for {{Company}}?"
- Body: Quick check-in → recap pitch → new proof (e.g. $11.5M exit) → "Quick 10-min chat?"

**Email 3:**
- Subject: "Your SDRs won't like this"
- Body: Personalized AI-generated line → stats (20+ meetings/mo) → "Worth a quick peek?"

**Email 4:**
- Subject: "One last note"
- Body: Final outreach → "I'll assume timing's off—here's a 3-point Loom, let me know if you'd like it."

## Tone & Style

- Professional, concise, outcome-focused
- Humanized phrasing; mix short and long sentences
- Personalize with dynamic variables (e.g., {{FirstName}}, {{Company}}, {{Metric}})
- Always highlight "what's in it for them," never features
- Natural, conversational flow without being overly casual

## Output Requirements

Generate emails that maximize open rates, reply rates, and meeting bookings through:
1. Short, variable-driven subject lines that create curiosity
2. Outcome-focused messaging that speaks to business results
3. Credible proof points that build trust quickly
4. Varied follow-up angles that don't feel repetitive or aggressive
5. Clear, compelling calls-to-action that make it easy to respond`;

/**
 * Email Strategist Class
 */
export class EmailStrategist {
  private readonly systemPrompt = B2B_EMAIL_STRATEGIST_PROMPT;

  /**
   * Generate Apollo local business email sequence using AI (more engaging)
   */
  async generateApolloSequence(
    businessData: {
      name: string;
      industry: string;
      location: string;
      website?: string;
      ownerName?: string;
    },
    serviceOffering: string = 'digital-marketing'
  ): Promise<ApolloEmailSequence> {
    
    // Try AI generation first, fallback to template if needed
    if (openAIService.isAvailable()) {
      try {
        const aiSequence = await openAIService.generateApolloSequence(businessData, serviceOffering);
        aiSequence.generationMetadata = {
          aiGenerated: true,
          fallbackUsed: false,
          aiModel: openAIService.getConfig().model
        };
        return aiSequence;
      } catch (error) {
        console.warn('AI generation failed, falling back to template:', error);
        // Fall through to template generation below
      }
    }

    // Fallback to original template-based generation
    const localInsights = this.generateLocalInsights(businessData.location, businessData.industry);
    const caseStudy = this.generateLocalCaseStudy(businessData.industry, businessData.location);
    
    const templateSequence: ApolloEmailSequence = {
      sequenceType: 'apollo-local',
      timing: ['Day 1', 'Day 4', 'Day 8', 'Day 12', 'Day 16'],
      generationMetadata: {
        aiGenerated: false,
        fallbackUsed: true
      },
      emails: {
        email1: {
          subject: `Quick thought about the ${this.getCityFromLocation(businessData.location)} ${businessData.industry} scene`,
          preview: `Hope you're managing well with this busy season...`,
          purpose: 'Establish local credibility and connection',
          body: `Hi ${businessData.ownerName || 'there'},

Hope you're managing well with the busy ${this.getSeasonalContext(businessData.location)} season hitting full swing!

I noticed ${businessData.name} has built quite a reputation in the ${localInsights.neighborhood} area - clearly doing something right in such a competitive market, especially being so close to ${localInsights.landmarks}.

I've been working with similar ${businessData.industry} businesses in ${localInsights.region} and noticed many are struggling to capture the ${localInsights.customerType} traffic that's literally walking past their doors every day. Most visitors are searching for "${businessData.industry} near me" but many great local spots aren't showing up in those critical mobile searches.

We recently helped 3 ${localInsights.region} ${businessData.industry} businesses increase their visibility to ${localInsights.customerType}, seeing 40% more walk-ins during peak season.

Would you be open to a quick 10-minute call to share what we learned about capturing that foot traffic in your neighborhood?

Best regards,
[Your Name]`
        },
        email2: {
          subject: `How ${localInsights.region} ${businessData.industry} capture more ${localInsights.customerType} traffic`,
          preview: `Three specific strategies working in ${localInsights.neighborhood}...`,
          purpose: 'Clearly articulate how you help local businesses',
          body: `Hi ${businessData.ownerName || 'there'},

Hope business has been picking up with the ${this.getWeatherContext(businessData.location)} we've been having!

I wanted to share what we've learned about helping ${localInsights.region} ${businessData.industry} businesses like ${businessData.name} capture more of the ${localInsights.customerType} foot traffic, especially in high-energy areas like ${localInsights.neighborhood}.

Here's what's working for local ${businessData.industry} businesses right now:

**Local Search Dominance**: When ${localInsights.customerType} search "best ${businessData.industry} ${localInsights.neighborhood}," you want to be the first result, not the chain competitors.

**Real-Time Social Proof**: Live updates about ${this.getIndustrySpecials(businessData.industry)}, crowd energy, and authentic atmosphere that ${localInsights.customerType} are looking for.

**Mobile-First Experience**: 78% of ${businessData.industry} searches happen on mobile while people are walking around looking for their next ${this.getIndustryService(businessData.industry)}.

The ${businessData.industry} businesses we work with in your area typically see 35-50% more discovery traffic within the first 2 months, plus higher-value orders from ${localInsights.customerType} who spend more than locals.

Would you like to see exactly how this works for a ${businessData.industry} business in your location? I could walk you through it in about 15 minutes.

Best,
[Your Name]`
        },
        email3: {
          subject: `How ${caseStudy.businessName} went from hidden gem to neighborhood hotspot`,
          preview: `A ${localInsights.region} success story...`,
          purpose: 'Provide social proof from similar local businesses',
          body: `Hi ${businessData.ownerName || 'there'},

Hope you caught that great article about ${localInsights.neighborhood}'s ${businessData.industry} scene in the ${localInsights.localNews} last week!

I thought you'd find this interesting - we recently worked with ${caseStudy.businessName}, a family ${businessData.industry} business in ${caseStudy.location} that was facing a similar challenge to ${businessData.name}: amazing ${this.getIndustryService(businessData.industry)} and loyal locals, but ${localInsights.customerType} were walking right past to the flashier places.

Here's what happened:

**Before**: 60% locals, 40% ${localInsights.customerType}, ${caseStudy.beforeRevenue} average monthly online orders
**After 3 months**: 45% locals, 55% ${localInsights.customerType}, ${caseStudy.afterRevenue} monthly online orders

The breakthrough was optimizing for "authentic ${businessData.industry} ${localInsights.region}" searches and showcasing their ${this.getIndustryUnique(businessData.industry)}. ${localInsights.customerType} don't just want good ${this.getIndustryService(businessData.industry)} - they want the authentic ${localInsights.region} experience that only places like ${caseStudy.businessName} and ${businessData.name} can provide.

Their owner, ${caseStudy.ownerName}, told me last week: "We're not just serving more customers - we're serving the RIGHT customers who appreciate what makes us special."

The strategies that worked for ${caseStudy.businessName} would work perfectly for ${businessData.name}'s location and ${localInsights.customerType} traffic patterns.

Want to see the specific tactics we used? I could show you in a quick 15-minute screen share.

Best,
[Your Name]`
        },
        email4: {
          subject: `"We tried online marketing before..."`,
          preview: `I hear this from ${localInsights.region} ${businessData.industry} owners all the time...`,
          purpose: 'Address typical concerns local businesses have',
          body: `Hi ${businessData.ownerName || 'there'},

Hope you're staying cool during this ${localInsights.region} ${this.getWeatherContext(businessData.location)}!

I imagine by now you might be thinking, "We tried online marketing before and it didn't really work for us." I hear this from ${localInsights.region} ${businessData.industry} owners all the time, and honestly, they're usually right to be skeptical.

Most marketing agencies treat local ${businessData.industry} businesses like they're national chains. They use generic strategies that work for big brands but completely miss what makes neighborhood places like ${businessData.name} special - that authentic, family atmosphere that locals love and ${localInsights.customerType} are searching for.

Here's the difference: we focus exclusively on local businesses in ${localInsights.region}. We understand that your competition isn't just other ${businessData.industry} businesses - it's every business competing for the same foot traffic walking down ${localInsights.mainStreet}.

Plus, we start with small, measurable improvements rather than big expensive campaigns. Think optimizing your Google listing for "${businessData.industry} ${localInsights.neighborhood}" searches before spending money on ads.

The ${caseStudy.businessName} owner I mentioned was skeptical too - he'd been burned by two previous agencies. But we started small, proved results, then scaled what worked.

Would you be open to a brief call where I could show you exactly what we'd do differently for ${businessData.name}? No commitment, just insights you can use either way.

Best,
[Your Name]`
        },
        email5: {
          subject: `Last thought about ${businessData.name}'s potential`,
          preview: `Quick favor - 2 minutes of your time?`,
          purpose: 'Last opportunity with minimal friction',
          body: `Hi ${businessData.ownerName || 'there'},

Hope the weekend was good to you with all the beautiful weather bringing people out!

I know you're busy running ${businessData.name}, so I'll keep this brief.

I've been thinking about our conversation thread, and I keep coming back to this: ${businessData.name} has everything needed to dominate the ${localInsights.neighborhood} ${businessData.industry} scene - amazing ${this.getIndustryService(businessData.industry)}, great location, loyal customers.

The only thing missing is making sure ${localInsights.customerType} and new locals can find you as easily as the regulars do.

I'd hate for you to miss out on what could be your biggest season yet, especially with ${localInsights.region}'s ${localInsights.customerType} numbers hitting record highs this year.

Here's what I can do: I'll spend 15 minutes this week showing you exactly what ${businessData.name}'s online presence looks like to potential customers right now, and give you 2-3 specific improvements you can make immediately (whether you work with us or not).

Just reply with "YES" and I'll send you a quick link to grab 15 minutes when it's convenient for you.

Either way, best of luck with the busy season!

[Your Name]

P.S. - If you're not interested, no worries at all. Just reply "NO THANKS" and I'll make sure you don't hear from me again.`
        }
      }
    };
    
    return templateSequence;
  }

  /**
   * Generate email sequence for a specific business and persona using AI (Original Method)
   */
  async generateEmailSequence(
    businessData: {
      name: string;
      industry: string;
      location: string;
      website?: string;
      ownerName?: string;
    },
    persona: EmailPersona,
    variables: Partial<EmailVariables> = {}
  ): Promise<EmailSequence> {
    
    // Try AI generation first, fallback to template if needed
    if (openAIService.isAvailable()) {
      try {
        const aiSequence = await openAIService.generateB2BSequence(businessData, persona.outcome);
        return aiSequence;
      } catch (error) {
        console.warn('AI generation failed, falling back to template:', error);
        // Fall through to template generation below
      }
    }

    // Fallback to original template-based generation
    // Prepare variables with business data
    const emailVars: EmailVariables = {
      firstName: variables.firstName || businessData.ownerName || 'there',
      company: businessData.name,
      industry: businessData.industry,
      metric: variables.metric || this.getRelevantMetric(businessData.industry),
      topic: variables.topic || `${businessData.industry} growth`,
      similarClient: variables.similarClient || this.getSimilarClientExample(businessData.industry),
      clientWin: variables.clientWin || this.getClientWinExample(businessData.industry),
      painPoint: variables.painPoint || persona.painPoints[0],
      result: variables.result || persona.outcome,
      ...variables
    };

    // Generate subject lines
    const subjectLines = this.generateSubjectLines(emailVars);

    // Generate first email
    const firstEmail = this.generateFirstEmail(emailVars, persona);

    // Generate follow-up sequence
    const followUpSequence = this.generateFollowUpSequence(emailVars, persona);

    return {
      firstEmail: {
        subjectLines,
        ...firstEmail
      },
      followUpSequence
    };
  }

  /**
   * Generate subject line variations - Updated Framework
   */
  private generateSubjectLines(vars: EmailVariables): SubjectLineSet {
    return {
      direct: [
        `Quick qn, ${vars.firstName}`,
        `Helping ${vars.company} hit ${vars.metric}`,
        `${vars.firstName}, quick ${vars.industry} question`,
        `${vars.company} + ${vars.metric}?`,
        `Re: ${vars.company}'s growth`
      ],
      casual: [
        `Mind if I send something over?`,
        `You open to this, ${vars.firstName}?`,
        `${vars.firstName}, worth a quick look?`,
        `Is this interesting to you?`,
        `${vars.firstName}, are you the right person?`
      ],
      curiosity: [
        `What ${vars.company} isn't doing yet…`,
        `A new angle for ${vars.company}…`,
        `${vars.firstName}, missed opportunity?`,
        `Your SDRs won't like this`,
        `The ${vars.industry} secret most miss`
      ],
      triggerBased: [
        `Congrats on the new hire, ${vars.firstName}`,
        `Saw your LinkedIn post about ${vars.topic}`,
        `AI appointments for ${vars.company}?`,
        `${vars.firstName}, loved your recent update`,
        `Following up on ${vars.company}'s expansion`
      ]
    };
  }

  /**
   * Generate first email content
   */
  private generateFirstEmail(vars: EmailVariables, persona: EmailPersona) {
    const opener = this.generateOpener(vars);
    const pitch = `We help ${persona.icp} achieve ${vars.result} without ${vars.painPoint}.`;
    const credibility = this.generateCredibilityStatement(vars, persona);
    const callToAction = this.generateCTA(vars);

    return {
      opener,
      pitch,
      credibility,
      callToAction
    };
  }

  /**
   * Generate follow-up email sequence - Updated Framework
   */
  private generateFollowUpSequence(vars: EmailVariables, persona: EmailPersona) {
    return {
      email2: {
        subject: `In case my last note slipped by…`,
        body: `Hi ${vars.firstName},

In case my last note slipped by your inbox…

Quick recap: We help ${persona.icp} achieve ${vars.result} without ${vars.painPoint}.

${this.generateCredibilityStatement(vars, persona)}

Quick 10-min chat to see if there's a fit?

Best,
[Your Name]`
      },
      email3: {
        subject: `We just helped ${vars.similarClient} drive ${vars.metric}`,
        body: `${vars.firstName},

We just helped ${vars.similarClient} drive ${vars.clientWin} in 30 days.

The approach we used could work well for ${vars.company} too, especially given your focus on ${vars.topic}.

Worth a quick peek at the breakdown?

Best,
[Your Name]

P.S. Happy to send over the case study if you're interested.`
      },
      email4: {
        subject: `If outbound's off the table, here's what works…`,
        body: `Hi ${vars.firstName},

I realize outbound might not be your top priority right now.

But what if I told you there's a way to ${this.generateAlternateValue(vars, persona)} without the usual inbound response speed issues?

Most ${vars.industry} businesses we work with see 20+ meetings/month in the first 30 days.

Are you the right person for this, or should I connect with someone else on your team?

Best,
[Your Name]`
      },
      email5: {
        subject: `One last note`,
        body: `${vars.firstName},

I'll assume timing's off for now – no worries, I know you're busy running ${vars.company}.

I've put together a quick 3-point Loom showing how ${vars.similarClient} landed 8-10 qualified calls/week without ads.

Even if we never work together, the insights might be valuable for your ${vars.industry} strategy.

Let me know if you'd like it – otherwise, I'll leave you be.

Best,
[Your Name]`
      }
    };
  }

  /**
   * Generate personalized opener
   */
  private generateOpener(vars: EmailVariables): string {
    const openers = [
      `Noticed ${vars.company} has been growing in the ${vars.industry} space.`,
      `Quick question about ${vars.company}'s approach to ${vars.topic}.`,
      `Saw that ${vars.company} is focused on ${vars.industry} – impressive work.`,
      `${vars.firstName}, hope you don't mind the cold outreach.`,
      `Been following ${vars.company}'s progress in ${vars.industry}.`
    ];

    return openers[Math.floor(Math.random() * openers.length)];
  }

  /**
   * Generate credibility statement - Updated Framework
   */
  private generateCredibilityStatement(vars: EmailVariables, persona: EmailPersona): string {
    const statements = [
      `We've helped 14 ${vars.industry} businesses land 8-10 qualified calls/week without ads.`,
      `Just helped ${vars.similarClient} increase their ${vars.metric} by 45% in 60 days.`,
      `Our clients typically book 200+ qualified calls in the first 90 days.`,
      `We guarantee 20+ meetings/month or you don't pay.`,
      `${vars.similarClient} went from 0 to ${vars.clientWin} using our exact process.`
    ];

    return statements[Math.floor(Math.random() * statements.length)];
  }

  /**
   * Generate call-to-action - Updated Framework
   */
  private generateCTA(vars: EmailVariables): string {
    const ctas = [
      `Worth a quick chat next week?`,
      `Want me to send a 90-second Loom?`,
      `Want a breakdown?`,
      `Quick 10-min chat?`,
      `Worth a quick peek?`
    ];

    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  /**
   * Generate alternate value proposition - Updated Framework
   */
  private generateAlternateValue(vars: EmailVariables, persona: EmailPersona): string {
    const alternates = [
      `land 8-10 qualified calls/week`,
      `book 20+ meetings/month consistently`,
      `reduce your customer acquisition costs by 50%`,
      `automate your entire lead triage process`,
      `improve inbound response speed by 200%`
    ];

    return alternates[Math.floor(Math.random() * alternates.length)];
  }

  /**
   * Get relevant metric for industry
   */
  private getRelevantMetric(industry: string): string {
    const industryMetrics: Record<string, string> = {
      'restaurants': 'customer traffic',
      'fitness': 'membership growth',
      'retail': 'sales revenue',
      'automotive': 'service bookings',
      'healthcare': 'patient acquisition',
      'legal': 'case volume',
      'real estate': 'property sales',
      'consulting': 'client retention',
      'default': 'revenue growth'
    };

    return industryMetrics[industry.toLowerCase()] || industryMetrics.default;
  }

  /**
   * Get similar client example
   */
  private getSimilarClientExample(industry: string): string {
    const examples: Record<string, string> = {
      'restaurants': 'Coastal Bistro',
      'fitness': 'Elite Fitness Studio',
      'retail': 'Urban Threads',
      'automotive': 'Premier Auto Service',
      'healthcare': 'Modern Wellness Clinic',
      'legal': 'Sterling Law Group',
      'real estate': 'Pinnacle Properties',
      'consulting': 'Strategic Advisors Inc',
      'default': 'a similar business'
    };

    return examples[industry.toLowerCase()] || examples.default;
  }

  /**
   * Get client win example - Updated Framework
   */
  private getClientWinExample(industry: string): string {
    const wins: Record<string, string> = {
      'restaurants': '8-10 qualified calls/week',
      'fitness': '20+ new memberships/month',
      'retail': '35% increase in foot traffic',
      'automotive': '50% more service bookings',
      'healthcare': '25+ patient appointments/week',
      'legal': '15+ qualified consultations/month',
      'real estate': '12+ listing appointments/week',
      'consulting': '200+ qualified calls in 90 days',
      'default': '20+ meetings/month'
    };

    return wins[industry.toLowerCase()] || wins.default;
  }

  /**
   * Get default personas for common industries
   */
  static getDefaultPersonas(): Record<string, EmailPersona> {
    return {
      'digital-marketing': {
        icp: 'B2B businesses struggling with predictable lead flow',
        outcome: '8-10 qualified calls/week without ads',
        painPoints: [
          'unpredictable lead flow',
          'wasted ad spend',
          'slow inbound response times',
          'poor lead qualification'
        ],
        metrics: [
          'qualified calls/week',
          'meetings booked',
          'cost per acquisition',
          'response time'
        ],
        credibilityPoints: [
          'Helped clients land 8-10 qualified calls/week consistently',
          'Generated 200+ qualified calls in 90 days for B2B clients',
          'Reduced client acquisition costs by 60% while improving quality'
        ],
        triggers: [
          'new product launch',
          'competitor expansion',
          'seasonal business changes',
          'team scaling challenges'
        ]
      },
      'automation': {
        icp: 'growing businesses drowning in manual lead triage',
        outcome: '20+ meetings/month through automated systems',
        painPoints: [
          'manual lead qualification',
          'slow response times',
          'inconsistent follow-up',
          'scalability bottlenecks'
        ],
        metrics: [
          'meetings booked',
          'response time',
          'lead qualification rate',
          'conversion efficiency'
        ],
        credibilityPoints: [
          'Automated lead triage for 50+ B2B businesses',
          'Improved response times by 200% while maintaining quality',
          'Helped clients book 20+ meetings/month consistently'
        ],
        triggers: [
          'rapid growth',
          'new hiring challenges',
          'system upgrades',
          'scaling bottlenecks'
        ]
      }
    };
  }

  /**
   * Generate local insights for Apollo sequence
   */
  private generateLocalInsights(location: string, industry: string) {
    const city = this.getCityFromLocation(location);
    const state = this.getStateFromLocation(location);
    
    const cityInsights: Record<string, any> = {
      'miami': {
        neighborhood: 'Wynwood',
        landmarks: 'all those trendy spots on NW 2nd Avenue',
        region: 'South Florida',
        customerType: 'tourists',
        localNews: 'Miami Herald',
        mainStreet: 'Ocean Drive'
      },
      'chicago': {
        neighborhood: 'Lincoln Park',
        landmarks: 'the lakefront and Millennium Park',
        region: 'Chicagoland',
        customerType: 'locals and visitors',
        localNews: 'Chicago Tribune',
        mainStreet: 'Michigan Avenue'
      },
      'austin': {
        neighborhood: 'South Lamar',
        landmarks: 'the food truck scene and live music venues',
        region: 'Austin Metro',
        customerType: 'tech workers and locals',
        localNews: 'Austin American-Statesman',
        mainStreet: 'South Congress'
      },
      'default': {
        neighborhood: 'downtown',
        landmarks: 'the main business district',
        region: city || 'the area',
        customerType: 'customers',
        localNews: 'local paper',
        mainStreet: 'Main Street'
      }
    };

    return cityInsights[city?.toLowerCase() || 'default'] || cityInsights.default;
  }

  /**
   * Generate local case study
   */
  private generateLocalCaseStudy(industry: string, location: string) {
    const caseStudies: Record<string, any> = {
      'restaurants': {
        businessName: 'Casa Luigi',
        location: 'Little Havana',
        ownerName: 'Giuseppe',
        beforeRevenue: '$8,500',
        afterRevenue: '$14,200'
      },
      'fitness': {
        businessName: 'Elite Fitness Studio',
        location: 'Coral Gables',
        ownerName: 'Sarah',
        beforeRevenue: '$12,000',
        afterRevenue: '$19,500'
      },
      'retail': {
        businessName: 'Urban Threads',
        location: 'Design District',
        ownerName: 'Marcus',
        beforeRevenue: '$15,000',
        afterRevenue: '$24,000'
      },
      'default': {
        businessName: 'Local Success Co',
        location: 'downtown',
        ownerName: 'Maria',
        beforeRevenue: '$10,000',
        afterRevenue: '$16,500'
      }
    };

    return caseStudies[industry] || caseStudies.default;
  }

  /**
   * Extract city from location string
   */
  private getCityFromLocation(location: string): string {
    // Extract city name from location (e.g., "Miami Beach, FL" -> "Miami")
    const parts = location.split(',');
    const cityPart = parts[0].trim();
    
    // Handle compound city names
    if (cityPart.toLowerCase().includes('miami')) return 'miami';
    if (cityPart.toLowerCase().includes('chicago')) return 'chicago';
    if (cityPart.toLowerCase().includes('austin')) return 'austin';
    if (cityPart.toLowerCase().includes('san francisco')) return 'san francisco';
    
    return cityPart.toLowerCase();
  }

  /**
   * Extract state from location string  
   */
  private getStateFromLocation(location: string): string {
    const parts = location.split(',');
    return parts[1]?.trim() || '';
  }

  /**
   * Get seasonal context based on location
   */
  private getSeasonalContext(location: string): string {
    const city = this.getCityFromLocation(location);
    const seasonalContexts: Record<string, string> = {
      'miami': 'tourist',
      'chicago': 'summer',
      'austin': 'festival',
      'san francisco': 'conference',
      'default': 'busy'
    };
    
    return seasonalContexts[city] || seasonalContexts.default;
  }

  /**
   * Get weather context based on location
   */
  private getWeatherContext(location: string): string {
    const city = this.getCityFromLocation(location);
    const weatherContexts: Record<string, string> = {
      'miami': 'beautiful weather',
      'chicago': 'great weather',
      'austin': 'perfect weather',
      'san francisco': 'clear skies',
      'default': 'nice weather'
    };
    
    return weatherContexts[city] || weatherContexts.default;
  }

  /**
   * Get industry-specific specials/features
   */
  private getIndustrySpecials(industry: string): string {
    const specials: Record<string, string> = {
      'restaurants': 'fresh specials, daily features',
      'fitness': 'new classes, member achievements',
      'retail': 'new arrivals, seasonal collections',
      'automotive': 'service specials, quick turnarounds',
      'healthcare': 'appointment availability, wellness tips',
      'default': 'latest offerings, special promotions'
    };
    
    return specials[industry] || specials.default;
  }

  /**
   * Get industry-specific service type
   */
  private getIndustryService(industry: string): string {
    const services: Record<string, string> = {
      'restaurants': 'meal',
      'fitness': 'workout',
      'retail': 'shopping experience',
      'automotive': 'service',
      'healthcare': 'appointment',
      'legal': 'consultation',
      'real estate': 'property viewing',
      'default': 'service'
    };
    
    return services[industry] || services.default;
  }

  /**
   * Get industry-specific unique selling points
   */
  private getIndustryUnique(industry: string): string {
    const uniquePoints: Record<string, string> = {
      'restaurants': 'family recipes and history',
      'fitness': 'personalized training approach',
      'retail': 'curated local selection',
      'automotive': 'trusted local expertise',
      'healthcare': 'personalized patient care',
      'legal': 'local legal knowledge',
      'real estate': 'neighborhood expertise',
      'default': 'authentic local approach'
    };
    
    return uniquePoints[industry] || uniquePoints.default;
  }
}