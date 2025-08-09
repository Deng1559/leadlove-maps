import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { google } from 'googleapis';
import { stringify } from 'csv-stringify/sync';

// Types for Google Drive backup
interface DriveBackupRequest {
  batchId: string;
  folderId?: string;
  filename?: string;
  includeRiskyLeads?: boolean;
  minQualityScore?: number;
  format?: 'csv' | 'json';
  separateByRisk?: boolean;
}

interface LeadData {
  business_name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  google_rating?: number;
  review_count?: number;
  risk_tag: string;
  risk_score: number;
  lead_quality_score: number;
  domain_status: string;
  keywords?: string[];
  category?: string;
  business_description?: string;
  completeness_score: number;
  risk_factors?: string[];
  created_at: string;
  exported_at: string;
}

// Initialize Google Drive API client
function getGoogleDriveClient() {
  try {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set');
    }
    
    let credentials;
    try {
      // Try to parse as base64 encoded JSON
      credentials = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));
    } catch {
      // If not base64, try to parse as direct JSON
      credentials = JSON.parse(serviceAccountJson);
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Failed to initialize Google Drive client:', error);
    throw new Error('Google Drive authentication failed');
  }
}

// Create folder if it doesn't exist
async function ensureFolderExists(
  drive: any, 
  folderName: string, 
  parentFolderId?: string
): Promise<string> {
  try {
    // Search for existing folder
    const searchQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'${
      parentFolderId ? ` and '${parentFolderId}' in parents` : ''
    } and trashed=false`;
    
    const searchResponse = await drive.files.list({
      q: searchQuery,
      fields: 'files(id, name)'
    });
    
    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      return searchResponse.data.files[0].id;
    }
    
    // Create new folder
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentFolderId && { parents: [parentFolderId] })
    };
    
    const createResponse = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id'
    });
    
    return createResponse.data.id;
  } catch (error) {
    console.error('Failed to create/find folder:', error);
    throw new Error(`Failed to access folder: ${folderName}`);
  }
}

// Convert leads to CSV format
function convertToCSV(leads: LeadData[]): string {
  const csvData = leads.map(lead => ({
    'Business Name': lead.business_name,
    'Address': lead.address || '',
    'Phone': lead.phone || '',
    'Email': lead.email || '',
    'Website': lead.website || '',
    'Google Rating': lead.google_rating || '',
    'Review Count': lead.review_count || 0,
    'Risk Tag': lead.risk_tag,
    'Risk Score': lead.risk_score ? (lead.risk_score * 100).toFixed(1) + '%' : '',
    'Quality Score': lead.lead_quality_score ? (lead.lead_quality_score * 100).toFixed(1) + '%' : '',
    'Domain Status': lead.domain_status,
    'Keywords': Array.isArray(lead.keywords) ? lead.keywords.join(', ') : '',
    'Category': lead.category || '',
    'Description': lead.business_description || '',
    'Completeness': lead.completeness_score ? (lead.completeness_score * 100).toFixed(1) + '%' : '',
    'Risk Factors': Array.isArray(lead.risk_factors) ? lead.risk_factors.join('; ') : '',
    'Created At': lead.created_at,
    'Exported At': lead.exported_at
  }));
  
  return stringify(csvData, {
    header: true,
    columns: [
      'Business Name', 'Address', 'Phone', 'Email', 'Website',
      'Google Rating', 'Review Count', 'Risk Tag', 'Risk Score', 'Quality Score',
      'Domain Status', 'Keywords', 'Category', 'Description', 'Completeness',
      'Risk Factors', 'Created At', 'Exported At'
    ]
  });
}

// Upload file to Google Drive
async function uploadFileToDrive(
  drive: any,
  filename: string,
  content: string,
  folderId: string,
  mimeType: string = 'text/csv'
): Promise<{ fileId: string; fileUrl: string }> {
  try {
    const fileMetadata = {
      name: filename,
      parents: [folderId]
    };
    
    const media = {
      mimeType,
      body: content
    };
    
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });
    
    const fileId = response.data.id;
    const fileUrl = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    
    return { fileId, fileUrl };
  } catch (error) {
    console.error('Failed to upload file to Drive:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
}

// Share file with user (make it accessible)
async function shareFileWithUser(
  drive: any,
  fileId: string,
  userEmail?: string
): Promise<void> {
  try {
    if (userEmail) {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: userEmail
        }
      });
    }
  } catch (error) {
    console.warn('Failed to share file with user:', error);
    // Don't fail the whole request for sharing issues
  }
}

// POST /api/google-drive/backup
export async function POST(request: NextRequest) {
  try {
    const body: DriveBackupRequest = await request.json();
    const {
      batchId,
      folderId,
      filename,
      includeRiskyLeads = true,
      minQualityScore = 0,
      format = 'csv',
      separateByRisk = false
    } = body;
    
    if (!batchId) {
      return NextResponse.json(
        { error: 'Missing required field: batchId' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch enriched leads from database
    let query = supabase
      .from('enriched_leads')
      .select('*')
      .eq('batch_id', batchId)
      .eq('user_id', user.id)
      .eq('enrichment_status', 'completed');
    
    // Apply filters
    if (!includeRiskyLeads) {
      query = query.neq('risk_tag', 'risky');
    }
    
    if (minQualityScore > 0) {
      query = query.gte('lead_quality_score', minQualityScore);
    }
    
    const { data: leads, error: fetchError } = await query;
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'No leads found for backup' },
        { status: 404 }
      );
    }
    
    // Initialize Google Drive client
    const drive = getGoogleDriveClient();
    
    // Determine target folder
    let targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!targetFolderId) {
      // Create a default LeadLove folder
      targetFolderId = await ensureFolderExists(drive, 'LeadLove Exports');
    }
    
    // Create date-based subfolder
    const today = new Date().toISOString().split('T')[0];
    const dateFolderId = await ensureFolderExists(drive, today, targetFolderId);
    
    // Prepare lead data with export timestamp
    const exportTimestamp = new Date().toISOString();
    const leadData: LeadData[] = leads.map(lead => ({
      ...lead,
      exported_at: exportTimestamp
    }));
    
    const uploadedFiles: Array<{ 
      filename: string; 
      fileId: string; 
      fileUrl: string; 
      recordCount: number; 
      riskTag?: string 
    }> = [];
    
    if (separateByRisk) {
      // Create separate files for each risk category
      const riskCategories = ['trusted', 'opportunity', 'risky'];
      
      for (const riskTag of riskCategories) {
        const filteredLeads = leadData.filter(lead => lead.risk_tag === riskTag);
        
        if (filteredLeads.length > 0) {
          const riskFilename = filename 
            ? `${filename.replace(/\.[^/.]+$/, '')}_${riskTag}.${format}`
            : `leadlove_backup_${batchId}_${riskTag}_${today}.${format}`;
          
          let content: string;
          let mimeType: string;
          
          if (format === 'json') {
            content = JSON.stringify(filteredLeads, null, 2);
            mimeType = 'application/json';
          } else {
            content = convertToCSV(filteredLeads);
            mimeType = 'text/csv';
          }
          
          const { fileId, fileUrl } = await uploadFileToDrive(
            drive,
            riskFilename,
            content,
            dateFolderId,
            mimeType
          );
          
          await shareFileWithUser(drive, fileId, user.email);
          
          uploadedFiles.push({
            filename: riskFilename,
            fileId,
            fileUrl,
            recordCount: filteredLeads.length,
            riskTag
          });
        }
      }
    } else {
      // Create single file with all leads
      const singleFilename = filename 
        ? filename
        : `leadlove_backup_${batchId}_${today}.${format}`;
      
      let content: string;
      let mimeType: string;
      
      if (format === 'json') {
        content = JSON.stringify(leadData, null, 2);
        mimeType = 'application/json';
      } else {
        content = convertToCSV(leadData);
        mimeType = 'text/csv';
      }
      
      const { fileId, fileUrl } = await uploadFileToDrive(
        drive,
        singleFilename,
        content,
        dateFolderId,
        mimeType
      );
      
      await shareFileWithUser(drive, fileId, user.email);
      
      uploadedFiles.push({
        filename: singleFilename,
        fileId,
        fileUrl,
        recordCount: leadData.length
      });
    }
    
    // Update database to mark leads as exported to Drive
    const { error: updateError } = await supabase
      .from('enriched_leads')
      .update({
        exported_to_drive: true,
        drive_export_at: exportTimestamp
      })
      .eq('batch_id', batchId)
      .eq('user_id', user.id);
    
    if (updateError) {
      console.error('Failed to update export status:', updateError);
      // Don't fail the request for this
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      batch_id: batchId,
      folder_id: dateFolderId,
      folder_url: `https://drive.google.com/drive/folders/${dateFolderId}`,
      uploaded_files: uploadedFiles,
      total_records: leadData.length,
      export_timestamp: exportTimestamp,
      format,
      filters_applied: {
        include_risky_leads: includeRiskyLeads,
        min_quality_score: minQualityScore,
        separate_by_risk: separateByRisk
      },
      export_statistics: {
        total_leads: leadData.length,
        risky_leads: leadData.filter(l => l.risk_tag === 'risky').length,
        trusted_leads: leadData.filter(l => l.risk_tag === 'trusted').length,
        opportunity_leads: leadData.filter(l => l.risk_tag === 'opportunity').length,
        avg_quality_score: leadData.reduce((sum, l) => sum + l.lead_quality_score, 0) / leadData.length
      }
    });
    
  } catch (error) {
    console.error('Google Drive backup error:', error);
    return NextResponse.json(
      {
        error: 'Backup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/google-drive/backup - Check backup status or list backups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const folderId = searchParams.get('folderId');
    const listBackups = searchParams.get('listBackups') === 'true';
    
    const supabase = createClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (batchId) {
      // Get backup status for batch
      const { data: leads, error } = await supabase
        .from('enriched_leads')
        .select('exported_to_drive, drive_export_at')
        .eq('batch_id', batchId)
        .eq('user_id', user.id);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch backup status' },
          { status: 500 }
        );
      }
      
      const backedUpCount = leads?.filter(l => l.exported_to_drive).length || 0;
      const totalCount = leads?.length || 0;
      const lastBackupAt = leads?.find(l => l.drive_export_at)?.drive_export_at;
      
      return NextResponse.json({
        batch_id: batchId,
        backed_up_count: backedUpCount,
        total_count: totalCount,
        backup_status: backedUpCount === totalCount ? 'completed' : 
                      backedUpCount > 0 ? 'partial' : 'not_backed_up',
        last_backup_at: lastBackupAt
      });
    }
    
    if (listBackups && folderId) {
      // List backup files in folder
      try {
        const drive = getGoogleDriveClient();
        const response = await drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: 'files(id, name, size, createdTime, webViewLink, mimeType)',
          orderBy: 'createdTime desc'
        });
        
        const files = response.data.files?.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size ? parseInt(file.size) : null,
          created_at: file.createdTime,
          url: file.webViewLink,
          mime_type: file.mimeType,
          is_leadlove_backup: file.name?.includes('leadlove_backup') || false
        })) || [];
        
        return NextResponse.json({
          folder_id: folderId,
          files: files.filter(f => f.is_leadlove_backup),
          total_files: files.length
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to access Drive folder' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Please provide batchId parameter or folderId with listBackups=true' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Get backup info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}