import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const toolName = searchParams.get('tool')

    // Build query
    let query = supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by tool if specified
    if (toolName) {
      query = query.eq('tool_name', toolName)
    }

    const { data: records, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching usage records:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch usage history' },
        { status: 500 }
      )
    }

    // Get summary stats
    const { data: summaryData, error: summaryError } = await supabase
      .from('usage_tracking')
      .select('credits_consumed, success')
      .eq('user_id', session.user.id)

    let totalCreditsSpent = 0
    let totalGenerations = summaryData?.length || 0
    let successfulGenerations = 0

    if (summaryData) {
      totalCreditsSpent = summaryData.reduce((sum, record) => sum + (record.credits_consumed || 0), 0)
      successfulGenerations = summaryData.filter(record => record.success).length
    }

    return NextResponse.json({
      success: true,
      records: records || [],
      summary: {
        totalGenerations,
        successfulGenerations,
        failedGenerations: totalGenerations - successfulGenerations,
        totalCreditsSpent,
        successRate: totalGenerations > 0 ? Math.round((successfulGenerations / totalGenerations) * 100) : 0
      },
      pagination: {
        limit,
        offset,
        hasMore: (records?.length || 0) === limit
      }
    })

  } catch (error: any) {
    console.error('Usage API error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: 'Failed to fetch usage history.'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const {
      tool_name,
      credits_consumed = 0,
      search_query,
      results_count = 0,
      processing_time_ms = 0,
      success = true,
      workflow_id,
      error_message,
      metadata = {}
    } = await request.json()

    if (!tool_name) {
      return NextResponse.json(
        { error: 'tool_name is required' },
        { status: 400 }
      )
    }

    const { data: record, error: insertError } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: session.user.id,
        tool_name,
        credits_consumed,
        search_query,
        results_count,
        processing_time_ms,
        success,
        workflow_id,
        error_message,
        metadata
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting usage record:', insertError)
      return NextResponse.json(
        { error: 'Failed to record usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      record
    })

  } catch (error: any) {
    console.error('Usage tracking API error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        message: 'Failed to record usage.'
      },
      { status: 500 }
    )
  }
}