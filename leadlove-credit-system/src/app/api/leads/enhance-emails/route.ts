import { NextRequest, NextResponse } from 'next/server'
import { EmailStrategist, EmailPersona } from '@/lib/email-strategist'

interface LeadData {
  name: string
  industry?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  ownerName?: string
  rating?: number
  address?: string
}

export async function POST(request: NextRequest) {
  try {
    const { 
      leads,
      serviceOffering = 'digital-marketing',
      persona,
      globalVariables = {}
    } = await request.json()

    // Validate required fields
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'Leads array is required and must not be empty' },
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

    // Process each lead
    const enhancedLeads = await Promise.all(
      leads.map(async (lead: LeadData) => {
        try {
          // Extract business data from lead
          const businessData = {
            name: lead.name,
            industry: lead.industry || inferIndustryFromName(lead.name),
            location: lead.location || lead.address || 'Unknown',
            website: lead.website,
            ownerName: lead.ownerName || extractOwnerName(lead.name)
          }

          // Prepare variables for this specific lead
          const leadVariables = {
            firstName: businessData.ownerName || 'there',
            company: businessData.name,
            industry: businessData.industry,
            ...globalVariables
          }

          // Generate email sequence for this lead
          const sequence = await strategist.generateEmailSequence(
            businessData,
            emailPersona,
            leadVariables
          )

          // Return enhanced lead with email sequences
          return {
            ...lead,
            emailSequence: {
              subjectLines: sequence.firstEmail.subjectLines,
              firstEmail: {
                subject: sequence.firstEmail.subjectLines.direct[0], // Default to first direct subject
                body: `${sequence.firstEmail.opener}

${sequence.firstEmail.pitch}

${sequence.firstEmail.credibility}

${sequence.firstEmail.callToAction}

Best,
[Your Name]`
              },
              followUpSequence: sequence.followUpSequence
            },
            persona: emailPersona,
            businessData
          }
        } catch (error) {
          console.error(`Error processing lead ${lead.name}:`, error)
          return {
            ...lead,
            emailSequence: null,
            error: 'Failed to generate email sequence'
          }
        }
      })
    )

    // Calculate success rate
    const successfulEnhancements = enhancedLeads.filter(lead => lead.emailSequence !== null).length
    const successRate = (successfulEnhancements / leads.length) * 100

    return NextResponse.json({
      success: true,
      enhancedLeads,
      metadata: {
        totalLeads: leads.length,
        successfulEnhancements,
        successRate: Math.round(successRate),
        persona: emailPersona,
        serviceOffering,
        generated: new Date().toISOString(),
        strategist: 'B2B Cold Email Expert',
        version: '1.0',
        deliverabilityOptimized: true
      }
    })

  } catch (error: any) {
    console.error('Email enhancement error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: 'Failed to enhance leads with email sequences'
      },
      { status: 500 }
    )
  }
}

// GET method for documentation
export async function GET() {
  return NextResponse.json({
    service: 'Lead Email Enhancement Service',
    version: '1.0',
    description: 'Enhance existing leads with high-converting B2B cold email sequences',
    endpoint: 'POST /api/leads/enhance-emails',
    features: [
      'Process multiple leads at once',
      'Generate personalized email sequences for each lead',
      'Industry-specific optimization',
      'Multiple subject line variations',
      '4-email follow-up sequence',
      'Deliverability-focused copy'
    ],
    sampleRequest: {
      leads: [
        {
          name: 'Joe\'s Pizza',
          industry: 'restaurants',
          location: 'Miami Beach, FL',
          website: 'https://joespizza.com',
          email: 'info@joespizza.com',
          ownerName: 'Joe'
        }
      ],
      serviceOffering: 'digital-marketing',
      globalVariables: {
        metric: 'customer acquisition',
        topic: 'local business growth'
      }
    }
  })
}

/**
 * Infer industry from business name
 */
function inferIndustryFromName(name: string): string {
  const industryKeywords: Record<string, string[]> = {
    'restaurants': ['pizza', 'restaurant', 'bistro', 'cafe', 'diner', 'grill', 'kitchen', 'eatery'],
    'fitness': ['gym', 'fitness', 'yoga', 'pilates', 'crossfit', 'training'],
    'automotive': ['auto', 'car', 'vehicle', 'tire', 'mechanic', 'service'],
    'healthcare': ['clinic', 'medical', 'dental', 'doctor', 'health', 'wellness'],
    'retail': ['store', 'shop', 'boutique', 'market', 'retail'],
    'legal': ['law', 'attorney', 'legal', 'lawyer'],
    'real estate': ['real estate', 'realty', 'properties', 'homes']
  }

  const lowerName = name.toLowerCase()
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return industry
    }
  }
  
  return 'business' // Default fallback
}

/**
 * Extract owner name from business name
 */
function extractOwnerName(businessName: string): string {
  // Look for possessive forms like "Joe's Pizza"
  const possessiveMatch = businessName.match(/^([A-Z][a-z]+)'s\s/i)
  if (possessiveMatch) {
    return possessiveMatch[1]
  }
  
  // Look for names at the beginning
  const nameMatch = businessName.match(/^([A-Z][a-z]+)\s/)
  if (nameMatch) {
    const firstName = nameMatch[1]
    // Check if it's likely a person's name vs business word
    const businessWords = ['the', 'modern', 'elite', 'premium', 'best', 'top', 'super', 'mega']
    if (!businessWords.includes(firstName.toLowerCase())) {
      return firstName
    }
  }
  
  return 'Owner' // Default fallback
}