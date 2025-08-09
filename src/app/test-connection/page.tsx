'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Loader2, Settings, Globe, Zap } from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'warning' | 'error' | 'info'
  details: any
}

interface ConnectionTestResults {
  timestamp: string
  environment: string
  tests: TestResult[]
  overallStatus: 'success' | 'warning' | 'error'
  summary: {
    total: number
    success: number
    warning: number
    error: number
  }
  recommendations: string[]
}

export default function TestConnectionPage() {
  const [results, setResults] = useState<ConnectionTestResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/test-connection')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResults(data)
    } catch (err: any) {
      setError(err.message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />
      case 'info': return <Settings className="w-5 h-5 text-blue-600" />
      default: return <Settings className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LeadLove Maps API Connection Test
          </h1>
          <p className="text-gray-600">
            Verify the integration with https://leadlove-maps.lovable.app/
          </p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={runTest} 
            disabled={loading}
            size="lg"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {loading ? 'Testing...' : 'Run Test'}
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">Test Failed</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {results && (
          <>
            {/* Overall Status */}
            <Card className={`mb-6 border-2 ${getStatusColor(results.overallStatus)}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(results.overallStatus)}
                    <div>
                      <h3 className="font-semibold text-lg">
                        Overall Status: {results.overallStatus.toUpperCase()}
                      </h3>
                      <p className="text-sm opacity-75">
                        Test completed at {new Date(results.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {results.summary.success}/{results.summary.total}
                    </div>
                    <div className="text-sm opacity-75">Tests Passed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <div className="grid gap-4 mb-6">
              {results.tests.map((test, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        {test.name}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(test.status)}
                      >
                        {test.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(test.details).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="ml-2">
                            {typeof value === 'object' ? (
                              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              String(value)
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>
                    Suggestions to improve your integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            This test helps diagnose connection issues with the LeadLove Maps API integration.
            <br />
            For support, check the console logs or contact the development team.
          </p>
        </div>
      </div>
    </div>
  )
}