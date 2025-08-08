import { NextRequest, NextResponse } from 'next/server'
import { EmailStrategist, EmailPersona, EmailVariables } from '@/lib/email-strategist'

export async function POST(request: NextRequest) {
  try {
    const { 
      businessData,
      persona,
      variables = {},
      serviceOffering = 'digital-marketing',
      sequenceType = 'original'
    } = await request.json()

    // Validate required fields
    if (!businessData?.name || !businessData?.industry) {
      return NextResponse.json(
        { error: 'Business name and industry are required' },
        { status: 400 }
      )
    }

    // Initialize email strategist
    const strategist = new EmailStrategist()
    
    if (sequenceType === 'apollo') {
      // Generate Apollo local business sequence
      const apolloSequence = await strategist.generateApolloSequence(
        businessData,
        serviceOffering
      )

      return NextResponse.json({
        success: true,
        businessData,
        apolloSequence,
        metadata: {
          generated: new Date().toISOString(),
          strategist: 'AI-Powered Apollo Local Business Expert',
          version: '2.0',
          sequenceType: 'apollo-local',
          hyperLocalPersonalization: true,
          aiGenerated: true,
          fallbackUsed: false
        }
      })
    } else {
      // Generate original B2B sequence
      // Get default persona if not provided
      let emailPersona: EmailPersona
      if (persona) {
        emailPersona = persona
      } else {
        const defaultPersonas = EmailStrategist.getDefaultPersonas()
        emailPersona = defaultPersonas[serviceOffering] || defaultPersonas['digital-marketing']
      }

      // Generate the email sequence
      const sequence = await strategist.generateEmailSequence(
        businessData,
        emailPersona,
        variables
      )

      // Return the complete email sequence
      return NextResponse.json({
        success: true,
        businessData,
        persona: emailPersona,
        sequence,
        metadata: {
          generated: new Date().toISOString(),
          strategist: 'AI-Powered B2B Cold Email Expert',
          version: '2.0',
          sequenceType: 'original-b2b',
          deliverabilityOptimized: true,
          aiGenerated: true,
          fallbackUsed: false
        }
      })
    }

  } catch (error: any) {
    console.error('Email sequence generation error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: 'Failed to generate email sequence'
      },
      { status: 500 }
    )
  }
}

// GET method for testing and documentation
export async function GET() {
  const strategist = new EmailStrategist()
  const defaultPersonas = EmailStrategist.getDefaultPersonas()

  return NextResponse.json({
    service: 'Dual Email Sequence Generator',
    version: '2.0',
    description: 'Choose between Original B2B Framework or Apollo Local Business sequences for targeted outreach',
    endpoint: 'POST /api/email-sequences/generate',
    sequenceTypes: {
      original: 'Professional B2B cold email sequences (4-email)',
      apollo: 'Hyper-local personalized sequences for local businesses (5-email)'
    },
    features: {
      original: [
        '4-5 subject line variations (Direct, Casual, Curiosity, Trigger-based)',
        'Structured first email (Opener, Pitch, Credibility, CTA)',
        '4-email follow-up sequence with varied angles',
        'Personalization with dynamic variables',
        'Industry-specific optimization',
        'Deliverability-focused copy'
      ],
      apollo: [
        '5-email sequence over 16 days (Day 1, 4, 8, 12, 16)',
        'Hyper-local personalization with neighborhood references',
        'Local landmarks, seasonal contexts, and regional insights',
        'Community-focused messaging for authentic connections',
        'Local case studies and business district insights',
        'Industry-specific local service customization'
      ]
    },
    defaultPersonas: Object.keys(defaultPersonas),
    sampleRequests: {
      original: {
        businessData: {
          name: 'Joe\'s Pizza',
          industry: 'restaurants',
          location: 'Miami Beach, FL',
          website: 'https://joespizza.com',
          ownerName: 'Joe'
        },
        serviceOffering: 'digital-marketing',
        sequenceType: 'original',
        variables: {
          metric: 'customer traffic',
          topic: 'restaurant growth',
          similarClient: 'Coastal Bistro'
        }
      },
      apollo: {
        businessData: {
          name: 'Joe\'s Pizza',
          industry: 'restaurants',
          location: 'Miami Beach, FL',
          website: 'https://joespizza.com',
          ownerName: 'Joe'
        },
        serviceOffering: 'digital-marketing',
        sequenceType: 'apollo'
      }
    },
    deliverabilityImprovements: [
      'Humanized phrasing with varied sentence structure',
      'Outcome-focused messaging (not feature-heavy)',
      'Professional yet conversational tone',
      'Strategic use of personalization variables',
      'Sequence timing optimized for engagement',
      'Respectful follow-up cadence with clear opt-out'
    ]
  })
}