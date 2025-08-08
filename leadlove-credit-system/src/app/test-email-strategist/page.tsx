'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Mail, Copy, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailSequenceResponse {
  success: boolean
  businessData: any
  persona: any
  sequence: {
    firstEmail: {
      subjectLines: {
        direct: string[]
        casual: string[]
        curiosity: string[]
        triggerBased: string[]
      }
      opener: string
      pitch: string
      credibility: string
      callToAction: string
    }
    followUpSequence: {
      email2: { subject: string; body: string }
      email3: { subject: string; body: string }
      email4: { subject: string; body: string }
      email5: { subject: string; body: string }
    }
  }
  metadata: any
}

export default function TestEmailStrategistPage() {
  const [formData, setFormData] = useState({
    name: 'Joe\'s Pizza',
    industry: 'restaurants',
    location: 'Miami Beach, FL',
    website: 'https://joespizza.com',
    ownerName: 'Joe',
    serviceOffering: 'digital-marketing'
  })
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<EmailSequenceResponse | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)

    try {
      const requestPayload = {
        businessData: {
          name: formData.name,
          industry: formData.industry,
          location: formData.location,
          website: formData.website,
          ownerName: formData.ownerName
        },
        serviceOffering: formData.serviceOffering,
        variables: {
          firstName: formData.ownerName,
          metric: formData.industry === 'restaurants' ? 'customer traffic' : 'revenue growth'
        }
      }

      const response = await fetch('/api/email-sequences/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const result = await response.json()
      setResponse(result)

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Email sequence generated successfully with improved deliverability',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate email sequence',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const formatFirstEmail = (email: any) => {
    return `Subject: [Choose from subject line options]

${email.opener}

${email.pitch}

${email.credibility}

${email.callToAction}

Best,
[Your Name]`
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Mail className="h-8 w-8" />
          B2B Cold Email Strategist Test
        </h1>
        <p className="text-muted-foreground mt-2">
          Test the new high-performing email sequence generator with improved deliverability
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Joe's Pizza"
                  required
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({...formData, industry: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurants">Restaurants</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="real estate">Real Estate</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName">Owner/Contact Name</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                  placeholder="Joe"
                />
              </div>
              <div>
                <Label htmlFor="serviceOffering">Service Offering</Label>
                <Select value={formData.serviceOffering} onValueChange={(value) => setFormData({...formData, serviceOffering: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                    <SelectItem value="automation">Business Automation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Miami Beach, FL"
                />
              </div>
              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate High-Converting Email Sequence
            </Button>
          </form>
        </CardContent>
      </Card>

      {response?.success && (
        <>
          {/* Subject Lines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Subject Line Options (Under 60 characters)
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(
                    Object.entries(response.sequence.firstEmail.subjectLines)
                      .map(([type, lines]) => `${type.toUpperCase()}:\n${lines.map((line: string) => `- ${line}`).join('\n')}`)
                      .join('\n\n'),
                    'Subject Lines'
                  )}
                >
                  {copiedText === 'Subject Lines' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(response.sequence.firstEmail.subjectLines).map(([type, lines]) => (
                <div key={type}>
                  <Label className="font-semibold capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}:</Label>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {(lines as string[]).map((line, idx) => (
                      <li key={idx} className="text-sm font-mono bg-muted p-2 rounded">{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* First Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                First Email (Initial Outreach)
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(formatFirstEmail(response.sequence.firstEmail), 'First Email')}
                >
                  {copiedText === 'First Email' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-line">
                {formatFirstEmail(response.sequence.firstEmail)}
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Sequence */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Sequence (Send 2-4 days apart)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(response.sequence.followUpSequence).map(([emailKey, email]) => {
                const emailNum = emailKey.replace('email', '')
                const titles: Record<string, string> = {
                  '2': 'Reminder Email',
                  '3': 'New Proof Email',
                  '4': 'New Angle Email', 
                  '5': 'Goodbye Email'
                }
                
                return (
                  <div key={emailKey} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-semibold">{titles[emailNum]} (Email {emailNum})</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, `Email ${emailNum}`)}
                      >
                        {copiedText === `Email ${emailNum}` ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-muted p-3 rounded text-sm font-mono">
                      <div className="font-semibold mb-2">Subject: {email.subject}</div>
                      <div className="whitespace-pre-line">{email.body}</div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Persona & Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy & Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-semibold">Persona Strategy:</Label>
                <div className="bg-muted p-3 rounded mt-1">
                  <p><strong>ICP:</strong> {response.persona.icp}</p>
                  <p><strong>Outcome:</strong> {response.persona.outcome}</p>
                  <p><strong>Pain Points:</strong> {response.persona.painPoints.join(', ')}</p>
                </div>
              </div>
              
              <div>
                <Label className="font-semibold">Deliverability Improvements:</Label>
                <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                  <li>Humanized phrasing with varied sentence structure</li>
                  <li>Outcome-focused messaging (not feature-heavy)</li>
                  <li>Professional yet conversational tone</li>
                  <li>Strategic use of personalization variables</li>
                  <li>Sequence timing optimized for engagement</li>
                  <li>Respectful follow-up cadence with clear opt-out</li>
                </ul>
              </div>

              <div className="text-xs text-muted-foreground">
                Generated: {response.metadata.generated} | 
                Version: {response.metadata.version} | 
                Strategist: {response.metadata.strategist}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {response && !response.success && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}