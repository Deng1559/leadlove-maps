'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCredits } from '@/components/providers'
import { calculateCreditCost, formatCredits } from '@/lib/utils'
import { Zap, Calculator, Info } from 'lucide-react'

export function CreditCostCalculator() {
  const [selectedResults, setSelectedResults] = useState(20)
  const { credits } = useCredits()

  const costBreakdown = [
    { results: 10, cost: calculateCreditCost('leadlove_maps', { maxResults: 10 }) },
    { results: 20, cost: calculateCreditCost('leadlove_maps', { maxResults: 20 }) },
    { results: 30, cost: calculateCreditCost('leadlove_maps', { maxResults: 30 }) },
    { results: 50, cost: calculateCreditCost('leadlove_maps', { maxResults: 50 }) }
  ]

  const canAfford = (cost: number) => credits >= cost

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="w-4 h-4" />
          <span>Credit Calculator</span>
        </CardTitle>
        <CardDescription>
          Estimate costs for different result sizes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Available:</span>
          </div>
          <Badge variant="outline" className="font-mono">
            {formatCredits(credits)}
          </Badge>
        </div>

        <Separator />

        {/* Cost Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span>Cost per generation:</span>
          </div>
          
          {costBreakdown.map((item) => {
            const affordable = canAfford(item.cost)
            
            return (
              <div 
                key={item.results}
                className={`flex items-center justify-between p-2 rounded border transition-colors ${
                  affordable 
                    ? 'border-green-200 bg-green-50/50 hover:bg-green-50' 
                    : 'border-red-200 bg-red-50/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {item.results} businesses
                  </span>
                  {!affordable && (
                    <Badge variant="destructive" className="text-xs">
                      Need {item.cost - credits} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={affordable ? "default" : "secondary"}
                    className="font-mono text-xs"
                  >
                    {formatCredits(item.cost)}
                  </Badge>
                  {affordable && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Efficiency Note */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Larger batches are more cost-effective. 
            50 businesses cost only {formatCredits(calculateCreditCost('leadlove_maps', { maxResults: 50 }))} 
            vs {formatCredits(calculateCreditCost('leadlove_maps', { maxResults: 10 }) * 5)} for 5 separate 10-business searches.
          </p>
        </div>

        {/* Low Credit Warning */}
        {credits <= 5 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ Low credit balance detected. Consider purchasing more credits to avoid interruptions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}