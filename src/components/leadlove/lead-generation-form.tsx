'use client'

import { useState } from 'react'
import { useAuth, useCredits } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { calculateCreditCost, hasEnoughCredits, formatCredits } from '@/lib/utils'
import { Search, Zap, AlertCircle, CheckCircle, Loader2, MapPin, Building } from 'lucide-react'

interface FormData {
  businessType: string
  location: string
  serviceOffering: string
  countryCode: string
  maxResults: number
}

interface GenerationResult {
  success: boolean
  workflowId?: string
  results?: any[]
  metadata?: any
  error?: string
  message?: string
}

export function LeadGenerationForm() {
  const [formData, setFormData] = useState<FormData>({
    businessType: '',
    location: '',
    serviceOffering: 'digital marketing',
    countryCode: 'us',
    maxResults: 20
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const { profile } = useAuth()
  const { credits, refreshCredits } = useCredits()
  const { toast } = useToast()

  const creditCost = calculateCreditCost('leadlove_maps', { maxResults: formData.maxResults })
  const canAfford = hasEnoughCredits(credits, creditCost)

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canAfford) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${creditCost} credits to generate leads. You have ${credits} credits available.`,
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      const response = await fetch('/api/leadlove/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          // Insufficient credits
          toast({
            title: 'Insufficient Credits',
            description: data.message || 'You do not have enough credits for this operation.',
            variant: 'destructive'
          })
          return
        }
        
        throw new Error(data.error || 'Failed to generate leads')
      }

      setResult(data)
      await refreshCredits() // Refresh credit balance
      
      toast({
        title: 'Lead Generation Started',
        description: `Processing ${formData.businessType} businesses in ${formData.location}. This may take 2-3 minutes.`,
        variant: 'success'
      })

    } catch (error: any) {
      console.error('Lead generation error:', error)
      
      setResult({
        success: false,
        error: error.message,
        message: 'Failed to start lead generation. Please try again.'
      })
      
      toast({
        title: 'Generation Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      })
      
      // Refresh credits in case they were refunded
      await refreshCredits()
    } finally {
      setIsGenerating(false)
    }
  }

  const businessTypes = [
    'restaurants',
    'dental practices',
    'law firms',
    'fitness centers',
    'beauty salons',
    'auto repair shops',
    'real estate agencies',
    'accounting firms',
    'medical practices',
    'veterinary clinics',
    'insurance agencies',
    'marketing agencies',
    'construction companies',
    'plumbing services',
    'electrical services',
    'cleaning services',
    'photography studios',
    'consulting firms'
  ]

  const serviceOfferings = [
    'digital marketing',
    'voice AI automation',
    'website development',
    'lead generation',
    'social media management',
    'SEO services',
    'business automation',
    'online advertising',
    'content creation',
    'email marketing'
  ]

  const countries = [
    { code: 'us', name: 'United States' },
    { code: 'ca', name: 'Canada' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'au', name: 'Australia' },
    { code: 'de', name: 'Germany' },
    { code: 'fr', name: 'France' },
    { code: 'es', name: 'Spain' },
    { code: 'it', name: 'Italy' },
    { code: 'nl', name: 'Netherlands' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Lead Generation</span>
        </CardTitle>
        <CardDescription>
          Generate AI-powered email sequences from Google Maps businesses.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Type */}
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type *</Label>
            <Select 
              value={formData.businessType} 
              onValueChange={(value) => handleInputChange('businessType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span className="capitalize">{type}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                type="text"
                placeholder="e.g., Miami Beach, FL or New York City"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter city, state, or specific area (e.g., "Downtown Miami" or "Brooklyn, NY")
            </p>
          </div>

          {/* Service Offering */}
          <div className="space-y-2">
            <Label htmlFor="serviceOffering">Your Service Offering</Label>
            <Select 
              value={formData.serviceOffering} 
              onValueChange={(value) => handleInputChange('serviceOffering', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceOfferings.map((service) => (
                  <SelectItem key={service} value={service}>
                    <span className="capitalize">{service}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country & Max Results Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="countryCode">Country</Label>
              <Select 
                value={formData.countryCode} 
                onValueChange={(value) => handleInputChange('countryCode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxResults">Max Results</Label>
              <Select 
                value={formData.maxResults.toString()} 
                onValueChange={(value) => handleInputChange('maxResults', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 businesses</SelectItem>
                  <SelectItem value="20">20 businesses</SelectItem>
                  <SelectItem value="30">30 businesses</SelectItem>
                  <SelectItem value="50">50 businesses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Credit Cost Display */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Credit Cost:</span>
              <Badge variant="outline">
                {formatCredits(creditCost)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Available: {formatCredits(credits)}
            </div>
          </div>

          {/* Credit Warning */}
          {!canAfford && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Insufficient Credits
                </p>
                <p className="text-sm text-red-700">
                  You need {creditCost} credits but only have {credits} available. 
                  <a href="/dashboard/credits" className="underline ml-1">Purchase more credits</a> to continue.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isGenerating || !canAfford || !formData.businessType || !formData.location}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Leads...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Generate Leads ({formatCredits(creditCost)})
              </>
            )}
          </Button>
        </form>

        {/* Result Display */}
        {result && (
          <div className="mt-6 p-4 border rounded-lg">
            {result.success ? (
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">
                    Lead Generation Started
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {result.message}
                  </p>
                  {result.workflowId && (
                    <p className="text-xs text-green-600 mt-2">
                      Workflow ID: {result.workflowId}
                    </p>
                  )}
                  {result.metadata?.creditsConsumed && (
                    <p className="text-xs text-green-600">
                      Credits consumed: {result.metadata.creditsConsumed} | Remaining: {result.metadata.creditsRemaining}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">
                    Generation Failed
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {result.message || result.error}
                  </p>
                  {result.error?.includes('refunded') && (
                    <p className="text-xs text-red-600 mt-2">
                      Your credits have been refunded due to the processing error.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}