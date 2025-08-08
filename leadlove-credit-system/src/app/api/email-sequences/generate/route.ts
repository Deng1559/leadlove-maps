import { NextRequest, NextResponse } from 'next/server'
import { EmailStrategist, EmailPersona, EmailVariables } from '@/lib/email-strategist'

export async function POST(request: NextRequest) {
  try {
    const { 
      businessData,
      persona,
      variables = {},
      serviceOffering = 'digital-marketing'
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
        strategist: 'B2B Cold Email Expert',
        version: '1.0',
        deliverabilityOptimized: true
      }
    })

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
    service: 'B2B Cold Email Sequence Generator',
    version: '1.0',
    description: 'High-performing, sequence-based outreach campaigns that book meetings, spark replies, and convert prospects',
    endpoint: 'POST /api/email-sequences/generate',
    features: [
      '4-5 subject line variations (Direct, Casual, Curiosity, Trigger-based)',
      'Structured first email (Opener, Pitch, Credibility, CTA)',
      '4-email follow-up sequence with varied angles',
      'Personalization with dynamic variables',
      'Industry-specific optimization',
      'Deliverability-focused copy'
    ],
    defaultPersonas: Object.keys(defaultPersonas),
    sampleRequest: {
      businessData: {
        name: 'Joe\'s Pizza',
        industry: 'restaurants',
        location: 'Miami Beach, FL',
        website: 'https://joespizza.com',
        ownerName: 'Joe'
      },
      serviceOffering: 'digital-marketing',
      variables: {
        metric: 'customer traffic',
        topic: 'restaurant growth',
        similarClient: 'Coastal Bistro'
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