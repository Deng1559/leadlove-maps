'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getCreditPackageInfo, formatStripePrice, calculateSavings } from '@/lib/stripe/client'
import { Zap, TrendingDown } from 'lucide-react'

export function CreditPurchase() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handlePurchase = async (packageType: 'credits_50' | 'credits_200') => {
    setIsLoading(packageType)

    try {
      const packageInfo = getCreditPackageInfo(packageType)
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: packageInfo.priceId,
          mode: 'payment'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      toast({
        title: 'Purchase Error',
        description: error.message || 'Failed to start purchase process.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(null)
    }
  }

  const credits50Info = getCreditPackageInfo('credits_50')
  const credits200Info = getCreditPackageInfo('credits_200')
  const savings = calculateSavings('credits_200')

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
      {/* 50 Credits Package */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>{credits50Info.name}</span>
          </CardTitle>
          <CardDescription>
            {credits50Info.description}
          </CardDescription>
          <div className="pt-4">
            <span className="text-3xl font-bold">
              {formatStripePrice(credits50Info.price)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatStripePrice(credits50Info.pricePerCredit)} per credit
          </div>
        </CardHeader>

        <CardContent className="text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">
              {credits50Info.credits} Credits
            </div>
            <p className="text-sm text-muted-foreground">
              Perfect for trying out our services or small projects
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={() => handlePurchase('credits_50')}
            disabled={isLoading === 'credits_50'}
            loading={isLoading === 'credits_50'}
          >
            Buy {credits50Info.name}
          </Button>
        </CardFooter>
      </Card>

      {/* 200 Credits Package */}
      <Card className="relative border-primary shadow-lg">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-green-600 text-white">
            <TrendingDown className="w-3 h-3 mr-1" />
            Save {formatStripePrice(savings)}
          </Badge>
        </div>

        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>{credits200Info.name}</span>
          </CardTitle>
          <CardDescription>
            {credits200Info.description}
          </CardDescription>
          <div className="pt-4">
            <span className="text-3xl font-bold">
              {formatStripePrice(credits200Info.price)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatStripePrice(credits200Info.pricePerCredit)} per credit
          </div>
        </CardHeader>

        <CardContent className="text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">
              {credits200Info.credits} Credits
            </div>
            <p className="text-sm text-muted-foreground">
              Best value for agencies and regular users
            </p>
            <div className="pt-2">
              <Badge variant="success" className="text-xs">
                {Math.round((1 - credits200Info.pricePerCredit / credits50Info.pricePerCredit) * 100)}% savings vs 50 credits
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            variant="gradient"
            onClick={() => handlePurchase('credits_200')}
            disabled={isLoading === 'credits_200'}
            loading={isLoading === 'credits_200'}
          >
            Buy {credits200Info.name}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}