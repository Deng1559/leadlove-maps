import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Types for feature requests
interface FeatureSubmissionRequest {
  title: string;
  description: string;
  category: 'enrichment' | 'integration' | 'ui' | 'analytics' | 'api' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface FeatureUpdateRequest {
  featureId: string;
  status?: 'submitted' | 'reviewing' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  estimatedEffort?: 'small' | 'medium' | 'large' | 'epic';
  targetPhase?: number;
  adminComment?: string;
}

interface VoteRequest {
  featureId: string;
  action: 'vote' | 'unvote';
}

// Validate feature submission
function validateFeatureRequest(request: FeatureSubmissionRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!request.title || request.title.trim().length < 5) {
    errors.push('Title must be at least 5 characters long');
  }
  
  if (!request.description || request.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }
  
  const validCategories = ['enrichment', 'integration', 'ui', 'analytics', 'api', 'other'];
  if (!validCategories.includes(request.category)) {
    errors.push('Invalid category');
  }
  
  if (request.priority && !['low', 'medium', 'high', 'critical'].includes(request.priority)) {
    errors.push('Invalid priority level');
  }
  
  return { isValid: errors.length === 0, errors };
}

// Check if user is admin (could be enhanced with proper role system)
async function isAdminUser(userId: string): Promise<boolean> {
  // For now, check if user email is in admin list from env
  // In production, this should use a proper role-based system
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
  
  if (adminEmails.length === 0) {
    return false; // No admins configured
  }
  
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  
  return user.user?.email ? adminEmails.includes(user.user.email) : false;
}

// POST /api/roadmap/features - Submit new feature request or admin updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's an admin update or new feature submission
    const isUpdate = 'featureId' in body;
    
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (isUpdate) {
      // Handle admin feature update
      const updateRequest: FeatureUpdateRequest = body;
      
      // Check if user is admin
      const isAdmin = await isAdminUser(user.id);
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required for feature updates' },
          { status: 403 }
        );
      }
      
      // Validate feature exists
      const { data: existingFeature, error: fetchError } = await supabase
        .from('feature_requests')
        .select('*')
        .eq('id', updateRequest.featureId)
        .single();
      
      if (fetchError || !existingFeature) {
        return NextResponse.json(
          { error: 'Feature request not found' },
          { status: 404 }
        );
      }
      
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updateRequest.status) updateData.status = updateRequest.status;
      if (updateRequest.estimatedEffort) updateData.estimated_effort = updateRequest.estimatedEffort;
      if (updateRequest.targetPhase) updateData.target_phase = updateRequest.targetPhase;
      
      // Update feature
      const { data: updatedFeature, error: updateError } = await supabase
        .from('feature_requests')
        .update(updateData)
        .eq('id', updateRequest.featureId)
        .select()
        .single();
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update feature request', details: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        feature: updatedFeature,
        updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at')
      });
    } else {
      // Handle new feature submission
      const featureRequest: FeatureSubmissionRequest = body;
      
      // Validate feature request
      const validation = validateFeatureRequest(featureRequest);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid feature request', details: validation.errors },
          { status: 400 }
        );
      }
      
      // Check for duplicate titles (case-insensitive)
      const { data: existingFeatures } = await supabase
        .from('feature_requests')
        .select('title')
        .ilike('title', featureRequest.title);
      
      if (existingFeatures && existingFeatures.length > 0) {
        return NextResponse.json(
          { error: 'A feature request with similar title already exists' },
          { status: 409 }
        );
      }
      
      // Create feature request
      const { data: newFeature, error: insertError } = await supabase
        .from('feature_requests')
        .insert({
          title: featureRequest.title.trim(),
          description: featureRequest.description.trim(),
          category: featureRequest.category,
          priority: featureRequest.priority || 'medium',
          status: 'submitted',
          submitted_by: user.id,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create feature request', details: insertError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        feature: newFeature,
        message: 'Feature request submitted successfully'
      });
    }
    
  } catch (error) {
    console.error('Feature request error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process feature request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/roadmap/features - Get feature requests with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'votes'; // 'votes', 'date', 'status'
    const order = searchParams.get('order') || 'desc'; // 'asc', 'desc'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const userFeatures = searchParams.get('userFeatures') === 'true';
    
    const supabase = createClient();
    
    // Get user from session (optional for public features)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Build base query
    let query = supabase
      .from('feature_requests')
      .select(`
        *,
        feature_votes (
          user_id,
          vote_weight
        )
      `);
    
    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    } else if (!includeCompleted) {
      // Exclude completed and rejected by default
      query = query.not('status', 'in', '("completed", "rejected")');
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    if (userFeatures && user) {
      query = query.eq('submitted_by', user.id);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'votes':
        query = query.order('votes_count', { ascending: order === 'asc' });
        break;
      case 'date':
        query = query.order('submitted_at', { ascending: order === 'asc' });
        break;
      case 'status':
        query = query.order('status', { ascending: order === 'asc' });
        break;
      default:
        query = query.order('votes_count', { ascending: false });
    }
    
    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data: features, error: fetchError } = await query;
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch feature requests', details: fetchError.message },
        { status: 500 }
      );
    }
    
    // Enhance features with user vote status
    const enhancedFeatures = (features || []).map(feature => {
      const userVoted = user ? 
        feature.feature_votes?.some((vote: any) => vote.user_id === user.id) : false;
      
      return {
        ...feature,
        user_voted: userVoted,
        total_vote_weight: feature.feature_votes?.reduce((sum: number, vote: any) => sum + vote.vote_weight, 0) || 0,
        feature_votes: undefined // Remove detailed vote data from response
      };
    });
    
    // Get total count for pagination
    let totalCountQuery = supabase
      .from('feature_requests')
      .select('id', { count: 'exact', head: true });
    
    // Apply same filters for count
    if (category) totalCountQuery = totalCountQuery.eq('category', category);
    if (status) totalCountQuery = totalCountQuery.eq('status', status);
    else if (!includeCompleted) totalCountQuery = totalCountQuery.not('status', 'in', '("completed", "rejected")');
    if (priority) totalCountQuery = totalCountQuery.eq('priority', priority);
    if (userFeatures && user) totalCountQuery = totalCountQuery.eq('submitted_by', user.id);
    
    const { count: totalCount } = await totalCountQuery;
    
    return NextResponse.json({
      features: enhancedFeatures,
      pagination: {
        total_count: totalCount || 0,
        limit: limit,
        offset: offset,
        has_more: (offset + limit) < (totalCount || 0)
      },
      filters_applied: {
        category,
        status,
        priority,
        sort_by: sortBy,
        order,
        include_completed: includeCompleted,
        user_features: userFeatures && !!user
      }
    });
    
  } catch (error) {
    console.error('Get feature requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/roadmap/features - Vote on feature requests
export async function PUT(request: NextRequest) {
  try {
    const body: VoteRequest = await request.json();
    const { featureId, action } = body;
    
    if (!featureId || !action || !['vote', 'unvote'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid vote request. Provide featureId and action (vote/unvote)' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify feature exists
    const { data: feature, error: featureError } = await supabase
      .from('feature_requests')
      .select('id, title, votes_count')
      .eq('id', featureId)
      .single();
    
    if (featureError || !feature) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }
    
    if (action === 'vote') {
      // Add vote (or update existing vote weight)
      const { data: existingVote } = await supabase
        .from('feature_votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('feature_request_id', featureId)
        .single();
      
      if (existingVote) {
        return NextResponse.json(
          { error: 'You have already voted for this feature' },
          { status: 409 }
        );
      }
      
      // Insert new vote
      const { error: voteError } = await supabase
        .from('feature_votes')
        .insert({
          user_id: user.id,
          feature_request_id: featureId,
          vote_weight: 1 // Could be enhanced with user tier-based voting weight
        });
      
      if (voteError) {
        return NextResponse.json(
          { error: 'Failed to register vote', details: voteError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        action: 'vote_added',
        feature_id: featureId,
        feature_title: feature.title,
        new_vote_count: feature.votes_count + 1
      });
      
    } else {
      // Remove vote
      const { data: deletedVote, error: deleteError } = await supabase
        .from('feature_votes')
        .delete()
        .eq('user_id', user.id)
        .eq('feature_request_id', featureId)
        .select();
      
      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to remove vote', details: deleteError.message },
          { status: 500 }
        );
      }
      
      if (!deletedVote || deletedVote.length === 0) {
        return NextResponse.json(
          { error: 'No vote found to remove' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        action: 'vote_removed',
        feature_id: featureId,
        feature_title: feature.title,
        new_vote_count: Math.max(0, feature.votes_count - 1)
      });
    }
    
  } catch (error) {
    console.error('Feature voting error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process vote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/roadmap/features - Delete feature request (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');
    
    if (!featureId) {
      return NextResponse.json(
        { error: 'Missing featureId parameter' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const isAdmin = await isAdminUser(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Delete feature request (cascading delete will handle votes)
    const { data: deletedFeature, error: deleteError } = await supabase
      .from('feature_requests')
      .delete()
      .eq('id', featureId)
      .select()
      .single();
    
    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete feature request', details: deleteError.message },
        { status: 500 }
      );
    }
    
    if (!deletedFeature) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Feature request deleted successfully',
      deleted_feature: {
        id: deletedFeature.id,
        title: deletedFeature.title
      }
    });
    
  } catch (error) {
    console.error('Feature deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}