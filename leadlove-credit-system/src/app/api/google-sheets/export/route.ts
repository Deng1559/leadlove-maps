import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { google } from 'googleapis';

// Types for Google Sheets integration
interface SheetsExportRequest {
  batchId: string;
  spreadsheetId?: string;
  sheetName?: string;
  createNewSheet?: boolean;
  includeRiskyLeads?: boolean;
  minQualityScore?: number;
}

interface SheetRow {
  'Business Name': string;
  'Address': string;
  'Phone': string;
  'Email': string;
  'Website': string;
  'Google Rating': string;
  'Review Count': string;
  'Risk Tag': string;
  'Risk Score': string;
  'Quality Score': string;
  'Domain Status': string;
  'Keywords': string;
  'Category': string;
  'Description': string;
  'Completeness': string;
  'Risk Factors': string;
  'Exported At': string;
}

// Initialize Google Sheets API client
function getGoogleSheetsClient() {
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
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error);
    throw new Error('Google Sheets authentication failed');
  }
}

// Create a new spreadsheet
async function createSpreadsheet(
  sheets: any, 
  title: string, 
  userEmail?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  try {
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: title
        },
        sheets: [{
          properties: {
            title: 'Enriched Leads',
            gridProperties: {
              rowCount: 1000,
              columnCount: 20
            }
          }
        }]
      }
    });
    
    const spreadsheetId = response.data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    
    // If user email is provided, share the spreadsheet
    if (userEmail) {
      try {
        const drive = google.drive({ version: 'v3', auth: sheets._options.auth });
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role: 'writer',
            type: 'user',
            emailAddress: userEmail
          }
        });
      } catch (shareError) {
        console.warn('Failed to share spreadsheet with user:', shareError);
        // Continue without sharing - user can still access via link
      }
    }
    
    return { spreadsheetId: spreadsheetId!, spreadsheetUrl };
  } catch (error) {
    console.error('Failed to create spreadsheet:', error);
    throw new Error('Failed to create new spreadsheet');
  }
}

// Add or update sheet headers
async function setupSheetHeaders(
  sheets: any,
  spreadsheetId: string,
  sheetName: string = 'Enriched Leads'
): Promise<void> {
  const headers = [
    'Business Name', 'Address', 'Phone', 'Email', 'Website',
    'Google Rating', 'Review Count', 'Risk Tag', 'Risk Score', 'Quality Score',
    'Domain Status', 'Keywords', 'Category', 'Description', 'Completeness',
    'Risk Factors', 'Exported At'
  ];
  
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:Q1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers]
      }
    });
    
    // Format headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: headers.length
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true
                }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }]
      }
    });
  } catch (error) {
    console.error('Failed to setup sheet headers:', error);
    throw new Error('Failed to setup sheet headers');
  }
}

// Convert enriched leads to sheet rows
function convertLeadsToSheetRows(leads: any[]): SheetRow[] {
  return leads.map(lead => ({
    'Business Name': lead.business_name || '',
    'Address': lead.address || '',
    'Phone': lead.phone || '',
    'Email': lead.email || '',
    'Website': lead.website || '',
    'Google Rating': lead.google_rating ? lead.google_rating.toString() : '',
    'Review Count': lead.review_count ? lead.review_count.toString() : '0',
    'Risk Tag': lead.risk_tag || '',
    'Risk Score': lead.risk_score ? (lead.risk_score * 100).toFixed(1) + '%' : '',
    'Quality Score': lead.lead_quality_score ? (lead.lead_quality_score * 100).toFixed(1) + '%' : '',
    'Domain Status': lead.domain_status || '',
    'Keywords': Array.isArray(lead.keywords) ? lead.keywords.join(', ') : '',
    'Category': lead.category || '',
    'Description': lead.business_description || '',
    'Completeness': lead.completeness_score ? (lead.completeness_score * 100).toFixed(1) + '%' : '',
    'Risk Factors': Array.isArray(lead.risk_factors) ? lead.risk_factors.join('; ') : '',
    'Exported At': new Date().toISOString()
  }));
}

// Add data to sheet
async function appendDataToSheet(
  sheets: any,
  spreadsheetId: string,
  sheetName: string,
  rows: SheetRow[]
): Promise<void> {
  try {
    const values = rows.map(row => Object.values(row));
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Q`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values
      }
    });
  } catch (error) {
    console.error('Failed to append data to sheet:', error);
    throw new Error('Failed to add data to sheet');
  }
}

// POST /api/google-sheets/export
export async function POST(request: NextRequest) {
  try {
    const body: SheetsExportRequest = await request.json();
    const { 
      batchId, 
      spreadsheetId: providedSpreadsheetId,
      sheetName = 'Enriched Leads',
      createNewSheet = false,
      includeRiskyLeads = true,
      minQualityScore = 0
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
        { error: 'No leads found for export' },
        { status: 404 }
      );
    }
    
    // Initialize Google Sheets client
    const sheets = getGoogleSheetsClient();
    
    let spreadsheetId = providedSpreadsheetId;
    let spreadsheetUrl = '';
    let isNewSheet = false;
    
    // Create new spreadsheet if needed
    if (createNewSheet || !spreadsheetId) {
      const timestamp = new Date().toISOString().split('T')[0];
      const title = `LeadLove Exports - ${timestamp}`;
      
      const newSheet = await createSpreadsheet(sheets, title, user.email);
      spreadsheetId = newSheet.spreadsheetId;
      spreadsheetUrl = newSheet.spreadsheetUrl;
      isNewSheet = true;
    } else {
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    }
    
    // Use default spreadsheet if none provided and user doesn't want to create new one
    if (!spreadsheetId) {
      spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      if (!spreadsheetId) {
        return NextResponse.json(
          { error: 'No spreadsheet ID provided and no default configured' },
          { status: 400 }
        );
      }
    }
    
    // Setup headers (for new sheets or first time export)
    if (isNewSheet) {
      await setupSheetHeaders(sheets, spreadsheetId, sheetName);
    }
    
    // Convert leads to sheet format
    const sheetRows = convertLeadsToSheetRows(leads);
    
    // Add data to sheet
    await appendDataToSheet(sheets, spreadsheetId, sheetName, sheetRows);
    
    // Update database to mark leads as exported
    const { error: updateError } = await supabase
      .from('enriched_leads')
      .update({
        exported_to_sheets: true,
        sheets_export_at: new Date().toISOString()
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
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl,
      sheet_name: sheetName,
      exported_count: leads.length,
      export_timestamp: new Date().toISOString(),
      filters_applied: {
        include_risky_leads: includeRiskyLeads,
        min_quality_score: minQualityScore
      },
      export_statistics: {
        total_leads: leads.length,
        risky_leads: leads.filter(l => l.risk_tag === 'risky').length,
        trusted_leads: leads.filter(l => l.risk_tag === 'trusted').length,
        opportunity_leads: leads.filter(l => l.risk_tag === 'opportunity').length,
        avg_quality_score: leads.reduce((sum, l) => sum + (l.lead_quality_score || 0), 0) / leads.length
      }
    });
    
  } catch (error) {
    console.error('Google Sheets export error:', error);
    return NextResponse.json(
      { 
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/google-sheets/export - Check export status or get spreadsheet info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const spreadsheetId = searchParams.get('spreadsheetId');
    
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
      // Get export status for batch
      const { data: leads, error } = await supabase
        .from('enriched_leads')
        .select('exported_to_sheets, sheets_export_at')
        .eq('batch_id', batchId)
        .eq('user_id', user.id);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch export status' },
          { status: 500 }
        );
      }
      
      const exportedCount = leads?.filter(l => l.exported_to_sheets).length || 0;
      const totalCount = leads?.length || 0;
      const lastExportAt = leads?.find(l => l.sheets_export_at)?.sheets_export_at;
      
      return NextResponse.json({
        batch_id: batchId,
        exported_count: exportedCount,
        total_count: totalCount,
        export_status: exportedCount === totalCount ? 'completed' : 
                      exportedCount > 0 ? 'partial' : 'not_exported',
        last_export_at: lastExportAt
      });
    }
    
    if (spreadsheetId) {
      // Get spreadsheet info
      try {
        const sheets = getGoogleSheetsClient();
        const response = await sheets.spreadsheets.get({
          spreadsheetId
        });
        
        return NextResponse.json({
          spreadsheet_id: spreadsheetId,
          title: response.data.properties?.title,
          url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          sheets: response.data.sheets?.map(sheet => ({
            name: sheet.properties?.title,
            id: sheet.properties?.sheetId,
            row_count: sheet.properties?.gridProperties?.rowCount,
            column_count: sheet.properties?.gridProperties?.columnCount
          }))
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to access spreadsheet' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Please provide either batchId or spreadsheetId parameter' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Get sheets info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}