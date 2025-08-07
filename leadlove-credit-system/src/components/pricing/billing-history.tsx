'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCredits, formatDate, formatRelativeTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { CreditTransaction } from '@/types/database.types'
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Gift, 
  CreditCard,
  Loader2,
  Receipt
} from 'lucide-react'

export function BillingHistory() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) {
          console.error('Error fetching transactions:', error)
          return
        }

        setTransactions(data || [])
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [user])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="w-4 h-4 text-green-600" />
      case 'usage':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'refill':
        return <RefreshCw className="w-4 h-4 text-blue-600" />
      case 'bonus':
        return <Gift className="w-4 h-4 text-purple-600" />
      case 'refund':
        return <TrendingUp className="w-4 h-4 text-orange-600" />
      default:
        return <Receipt className="w-4 h-4 text-gray-600" />
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="success">Purchase</Badge>
      case 'usage':
        return <Badge variant="destructive">Used</Badge>
      case 'refill':
        return <Badge variant="info">Refill</Badge>
      case 'bonus':
        return <Badge variant="secondary">Bonus</Badge>
      case 'refund':
        return <Badge variant="warning">Refund</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getCreditsDisplay = (transaction: CreditTransaction) => {
    const amount = Math.abs(transaction.credits_amount)
    const sign = transaction.credits_amount >= 0 ? '+' : '-'
    const color = transaction.credits_amount >= 0 ? 'text-green-600' : 'text-red-600'
    
    return (
      <span className={`font-medium ${color}`}>
        {sign}{formatCredits(amount)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading transaction history...</span>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="w-5 h-5" />
            <span>Transaction History</span>
          </CardTitle>
          <CardDescription>
            Your credit transactions and billing history will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No transactions yet. Start by purchasing credits or subscribing to a plan!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Receipt className="w-5 h-5" />
          <span>Transaction History</span>
        </CardTitle>
        <CardDescription>
          Your recent credit transactions and billing history.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getTransactionIcon(transaction.transaction_type)}
                <div>
                  <p className="font-medium">
                    {transaction.description || 'Credit Transaction'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getTransactionBadge(transaction.transaction_type)}
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(transaction.created_at)}
                    </span>
                  </div>
                  {transaction.reference_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reference: {transaction.reference_id.substring(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg">
                  {getCreditsDisplay(transaction)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(transaction.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {transactions.length >= 20 && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Showing last 20 transactions. Visit the billing portal for complete history.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}