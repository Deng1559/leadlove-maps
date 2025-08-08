/**
 * B2B Cold Email Strategist System
 * High-performing, sequence-based outreach campaigns that book meetings, spark replies, and convert prospects
 */

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

/**
 * B2B Cold Email Strategist System Prompt
 */
const B2B_EMAIL_STRATEGIST_PROMPT = `You are an expert B2B cold-email strategist and copywriter. Your job is to generate high-performing, sequence-based outreach campaigns that book meetings, spark replies, and convert prospects into clients. Always follow these rules:

## Subject Line Variants (keep under 60 characters)

**Direct:** "Quick question, {{FirstName}}" / "Helping {{Company}} hit {{Metric}}"

**Casual:** "Mind if I send something over?" / "You open to this, {{FirstName}}?"

**Curiosity:** "What {{Company}} isn't doing yet…" / "A new angle for {{Company}}…"

**Trigger-Based:** "Congrats on the new hire, {{FirstName}}" / "Saw your LinkedIn post about {{Topic}}"

## First Email Structure

**Opener:** One line explaining why you're reaching out (generic or personalized)

**Pitch + Outcome:** "We help {{ICP}} achieve {{Result}} without {{PainPoint}}."

**Credibility:** Quick proof point or guarantee ("Booked 14 calls in 30 days for {{SimilarClient}}.")

**Call-to-Action:**
- **Direct:** "Worth a quick chat next week?"
- **Soft / Video:** "Want me to send a 90-second Loom?"

## Follow-Up Sequence (up to 4 emails, send 2–4 days apart)

**Reminder:** Light nudge on the original pitch ("In case my last note slipped by…")

**New Proof:** Share a different client win ("We just helped {{Client}} drive {{Metric}}.")

**New Angle:** Pivot to another pain-point or offer ("If outbound's tough, here's what works…")

**Referral / Value-Add:** Ask for the right contact or share a tip/mini audit

**Goodbye:** Final, respectful sign-off with a soft offer ("No worries if timing's off—I've put together a 3-point Loom, let me know if you'd like it.")

## Tone & Style

- Professional, concise, outcome-focused
- Humanized phrasing; mix short and long sentences
- Personalize with dynamic variables (e.g., {{FirstName}}, {{Company}}, {{Metric}})
- Always highlight "what's in it for them," never features

## Output Format

When given a target persona and list of variables, output:
1. A set of 4–5 subject line options (one of each type)
2. A first email draft following the 4-part structure
3. A 3-email follow-up sequence with varied angles and CTAs

Begin by asking: "Who is our Ideal Customer Profile, and what outcome do we promise?"`;

/**
 * Email Strategist Class
 */
export class EmailStrategist {
  private readonly systemPrompt = B2B_EMAIL_STRATEGIST_PROMPT;

  /**
   * Generate email sequence for a specific business and persona
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
   * Generate subject line variations
   */
  private generateSubjectLines(vars: EmailVariables): SubjectLineSet {
    return {
      direct: [
        `Quick question, ${vars.firstName}`,
        `Helping ${vars.company} hit ${vars.metric}`,
        `${vars.firstName}, quick ${vars.industry} question`,
        `${vars.company} + increased ${vars.metric}?`,
        `Re: ${vars.company}'s ${vars.metric}`
      ],
      casual: [
        `Mind if I send something over?`,
        `You open to this, ${vars.firstName}?`,
        `${vars.firstName}, worth a quick look?`,
        `Thought you might find this interesting`,
        `${vars.firstName}, are you the right person?`
      ],
      curiosity: [
        `What ${vars.company} isn't doing yet…`,
        `A new angle for ${vars.company}…`,
        `${vars.firstName}, missed opportunity?`,
        `The ${vars.industry} secret most miss`,
        `Why ${vars.company} competitors are pulling ahead`
      ],
      triggerBased: [
        `Congrats on the new hire, ${vars.firstName}`,
        `Saw your LinkedIn post about ${vars.topic}`,
        `Following up on ${vars.company}'s expansion`,
        `${vars.firstName}, loved your recent update`,
        `Quick follow-up to our ${vars.topic} discussion`
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
   * Generate follow-up email sequence
   */
  private generateFollowUpSequence(vars: EmailVariables, persona: EmailPersona) {
    return {
      email2: {
        subject: `In case you missed it, ${vars.firstName}`,
        body: `Hi ${vars.firstName},

In case my last note slipped by your inbox…

Quick recap: We're helping ${persona.icp} like ${vars.company} achieve ${vars.result} without the usual ${vars.painPoint} headaches.

${this.generateCredibilityStatement(vars, persona)}

Still worth a brief chat to see if there's a fit?

Best,
[Your Name]`
      },
      email3: {
        subject: `${vars.similarClient} case study`,
        body: `${vars.firstName},

Just wrapped up with ${vars.similarClient} – helped them drive ${vars.clientWin} in 30 days.

The approach we used could work well for ${vars.company} too, especially given your focus on ${vars.topic}.

Worth a 15-minute call to walk through the specifics?

Best,
[Your Name]

P.S. Happy to send over the case study if you're interested.`
      },
      email4: {
        subject: `Different angle for ${vars.company}`,
        body: `Hi ${vars.firstName},

I realize ${vars.result} might not be your top priority right now.

But what if I told you there's a way to ${this.generateAlternateValue(vars, persona)} with just 2 hours of work per week?

Most ${vars.industry} businesses we work with see results in the first 30 days.

Worth exploring? I can send over a quick 3-minute video showing exactly how it works.

Best,
[Your Name]`
      },
      email5: {
        subject: `Final note, ${vars.firstName}`,
        body: `${vars.firstName},

No worries if timing isn't right – I know you're busy running ${vars.company}.

I've put together a quick 3-point Loom video showing how ${vars.similarClient} increased their ${vars.metric} by 40% in 60 days.

Even if we never work together, the insights might be valuable for your ${vars.industry} strategy.

Want me to send it over?

Best,
[Your Name]

P.S. This is my last email – I won't follow up again unless you'd like me to.`
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
   * Generate credibility statement
   */
  private generateCredibilityStatement(vars: EmailVariables, persona: EmailPersona): string {
    const statements = [
      `We've helped 14 ${vars.industry} businesses book 200+ qualified calls in the last 90 days.`,
      `Just finished helping ${vars.similarClient} increase their ${vars.metric} by 45% in 60 days.`,
      `Our clients typically see ${vars.result} within the first 30 days.`,
      `We guarantee measurable results or you don't pay.`,
      `${vars.similarClient} went from 0 to ${vars.clientWin} using our exact process.`
    ];

    return statements[Math.floor(Math.random() * statements.length)];
  }

  /**
   * Generate call-to-action
   */
  private generateCTA(vars: EmailVariables): string {
    const ctas = [
      `Worth a quick 15-minute chat next week?`,
      `Want me to send a 90-second Loom showing how this works?`,
      `Quick call to see if there's a fit?`,
      `Interested in seeing how we could help ${vars.company}?`,
      `Want to explore what this could look like for ${vars.company}?`
    ];

    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  /**
   * Generate alternate value proposition
   */
  private generateAlternateValue(vars: EmailVariables, persona: EmailPersona): string {
    const alternates = [
      `reduce your customer acquisition costs by 50%`,
      `automate your entire lead generation process`,
      `double your qualified leads`,
      `cut your sales cycle in half`,
      `increase your conversion rates by 40%`
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
   * Get client win example
   */
  private getClientWinExample(industry: string): string {
    const wins: Record<string, string> = {
      'restaurants': '40% more reservations',
      'fitness': '60% membership increase',
      'retail': '35% revenue boost',
      'automotive': '50% more service bookings',
      'healthcare': '45% patient growth',
      'legal': '30% more qualified leads',
      'real estate': '25% faster sales',
      'consulting': '50% higher retention',
      'default': '40% revenue increase'
    };

    return wins[industry.toLowerCase()] || wins.default;
  }

  /**
   * Get default personas for common industries
   */
  static getDefaultPersonas(): Record<string, EmailPersona> {
    return {
      'digital-marketing': {
        icp: 'local businesses struggling with online visibility',
        outcome: 'consistent stream of qualified leads',
        painPoints: [
          'unpredictable lead flow',
          'wasted ad spend',
          'time-consuming manual outreach',
          'poor online visibility'
        ],
        metrics: [
          'lead volume',
          'conversion rates',
          'cost per acquisition',
          'revenue growth'
        ],
        credibilityPoints: [
          'Generated 500+ qualified leads for local businesses',
          'Reduced client acquisition costs by 60%',
          'Helped 50+ businesses double their online revenue'
        ],
        triggers: [
          'new location opening',
          'competitor expansion',
          'seasonal business changes',
          'staff changes'
        ]
      },
      'automation': {
        icp: 'growing businesses drowning in manual processes',
        outcome: 'streamlined operations and 40% time savings',
        painPoints: [
          'manual data entry',
          'repetitive tasks',
          'human error',
          'scalability issues'
        ],
        metrics: [
          'time saved',
          'error reduction',
          'productivity increase',
          'cost savings'
        ],
        credibilityPoints: [
          'Automated 80% of client workflows',
          'Saved businesses 20+ hours per week',
          'Reduced operational costs by 45%'
        ],
        triggers: [
          'rapid growth',
          'new hiring',
          'system upgrades',
          'efficiency initiatives'
        ]
      }
    };
  }
}