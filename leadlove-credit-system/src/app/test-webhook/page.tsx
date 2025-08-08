'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WebhookResponse {
  success: boolean
  workflowId?: string
  results?: any[]
  metadata?: any
  message?: string
  error?: string
}

export default function TestWebhookPage() {
  const [formData, setFormData] = useState({
    businessType: 'restaurants',
    location: 'New York, NY',
    serviceOffering: 'digital marketing',
    countryCode: 'us',
    maxResults: 10,
    userId: 'test-user',
    userName: 'Test User'
  })
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<WebhookResponse | null>(null)
  const [workflowId, setWorkflowId] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusResponse, setStatusResponse] = useState<any>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)

    try {
      const response = await fetch('/api/webhook/google-maps-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      setResponse(result)

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Google Maps scraping initiated successfully',
        })
        if (result.workflowId) {
          setWorkflowId(result.workflowId)
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to initiate scraping',
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

  const checkStatus = async () => {
    if (!workflowId) {
      toast({
        title: 'Error',
        description: 'No workflow ID available',
        variant: 'destructive',
      })
      return
    }

    setStatusLoading(true)
    setStatusResponse(null)

    try {
      const response = await fetch('/api/webhook/google-maps-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowId }),
      })

      const result = await response.json()
      setStatusResponse(result)

      if (result.success) {
        toast({
          title: 'Status Updated',
          description: `Status: ${result.status} - ${result.currentStep}`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to check status',
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
      setStatusLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Google Maps Scraper Webhook Test</h1>
        <p className="text-muted-foreground mt-2">Test the free webhook-based Google Maps scraper</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scraper Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  placeholder="e.g. restaurants, gyms, dentists"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. New York, NY"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceOffering">Service Offering</Label>
                <Input
                  id="serviceOffering"
                  value={formData.serviceOffering}
                  onChange={(e) => setFormData({...formData, serviceOffering: e.target.value})}
                  placeholder="e.g. digital marketing"
                />
              </div>
              <div>
                <Label htmlFor="maxResults">Max Results</Label>
                <Input
                  id="maxResults"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxResults}
                  onChange={(e) => setFormData({...formData, maxResults: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="countryCode">Country Code</Label>
                <Input
                  id="countryCode"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                  placeholder="us"
                />
              </div>
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  placeholder="test-user"
                />
              </div>
              <div>
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => setFormData({...formData, userName: e.target.value})}
                  placeholder="Test User"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Google Maps Scraping
            </Button>
          </form>
        </CardContent>
      </Card>

      {workflowId && (
        <Card>
          <CardHeader>
            <CardTitle>Status Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Workflow ID</Label>
              <Input value={workflowId} readOnly />
            </div>
            <Button onClick={checkStatus} disabled={statusLoading}>
              {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Status
            </Button>
          </CardContent>
        </Card>
      )}

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Scraper Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {statusResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Status Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(statusResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Scraper Webhook:</strong>
            <code className="ml-2 bg-muted px-2 py-1 rounded">POST /api/webhook/google-maps-scraper</code>
          </div>
          <div>
            <strong>Status Webhook:</strong>
            <code className="ml-2 bg-muted px-2 py-1 rounded">POST /api/webhook/google-maps-status</code>
          </div>
          <div className="text-sm text-muted-foreground mt-4">
            <p><strong>Note:</strong> This is a free service with no credit system. All requests are processed without authentication or payment.</p>
            <p className="mt-2"><strong>New:</strong> Enhanced with B2B Cold Email Strategist for improved deliverability and conversion rates.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}