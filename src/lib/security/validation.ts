import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Security validation utilities for LeadLove Maps
// Prevents XSS, SQL injection, CSV injection, and other attack vectors

/**
 * Input sanitization functions
 */
export class SecurityValidator {
  
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  // Sanitize text input for database operations
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>'"&]/g, '') // Remove HTML/XML chars
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
      .trim()
      .substring(0, 10000); // Limit length to prevent DoS
  }

  // Sanitize email addresses
  static sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Basic email sanitization
    const email = input.toLowerCase().trim();
    
    // Remove dangerous characters while keeping valid email chars
    return email.replace(/[^\w@.-]/g, '').substring(0, 254);
  }

  // Prevent CSV injection attacks
  static sanitizeCsvField(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove CSV injection prefixes
    const dangerous = /^[@=+\-]/;
    let sanitized = input.trim();
    
    if (dangerous.test(sanitized)) {
      sanitized = `'${sanitized}`; // Prefix with quote to neutralize
    }
    
    // Escape quotes and remove line breaks
    return sanitized
      .replace(/"/g, '""')
      .replace(/[\r\n]/g, ' ')
      .substring(0, 32767); // Excel cell limit
  }

  // Sanitize file names
  static sanitizeFileName(input: string): string {
    if (!input || typeof input !== 'string') return 'untitled';
    
    return input
      .replace(/[^\w\-_.]/g, '_') // Replace non-alphanumeric with underscore
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .substring(0, 255)
      .toLowerCase();
  }

  // Validate UUID format
  static isValidUuid(input: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(input);
  }

  // Rate limiting key generation
  static generateRateLimitKey(userId: string, endpoint: string): string {
    if (!this.isValidUuid(userId)) {
      throw new Error('Invalid user ID format');
    }
    return `rate_limit:${userId}:${endpoint.replace(/[^\w]/g, '_')}`;
  }
}

/**
 * Zod validation schemas for API endpoints
 */

// Common field validation
const businessNameSchema = z.string()
  .min(1, 'Business name is required')
  .max(200, 'Business name too long')
  .transform(SecurityValidator.sanitizeText);

const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .transform(SecurityValidator.sanitizeEmail);

const uuidSchema = z.string()
  .uuid('Invalid UUID format');

// Enrichment API validation
export const enrichmentRequestSchema = z.object({
  batchId: uuidSchema,
  leads: z.array(z.object({
    business_name: businessNameSchema,
    address: z.string().max(500).transform(SecurityValidator.sanitizeText).optional(),
    phone: z.string().max(20).regex(/^[+\-\s\d()]+$/, 'Invalid phone format').optional(),
    email: emailSchema.optional(),
    website: z.string().url('Invalid URL').max(2048).optional(),
    place_id: z.string().max(100).transform(SecurityValidator.sanitizeText).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })).min(1, 'At least one lead required').max(1000, 'Too many leads'),
  options: z.object({
    skipDomainCheck: z.boolean().optional(),
    skipGoogleReviews: z.boolean().optional(),
    maxConcurrent: z.number().int().min(1).max(10).optional(),
  }).optional(),
});

// Google Sheets export validation
export const sheetsExportSchema = z.object({
  batchId: uuidSchema,
  spreadsheetId: z.string().max(100).regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid spreadsheet ID').optional(),
  sheetName: z.string().max(100).transform(SecurityValidator.sanitizeText).optional(),
  createNewSheet: z.boolean().optional(),
  includeRiskyLeads: z.boolean().optional(),
  minQualityScore: z.number().min(0).max(1).optional(),
});

// Google Drive backup validation
export const driveBackupSchema = z.object({
  batchId: uuidSchema,
  folderId: z.string().max(100).regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid folder ID').optional(),
  filename: z.string().max(255).transform(SecurityValidator.sanitizeFileName).optional(),
  includeRiskyLeads: z.boolean().optional(),
  minQualityScore: z.number().min(0).max(1).optional(),
  format: z.enum(['csv', 'json']).optional(),
  separateByRisk: z.boolean().optional(),
});

// Snov.io export validation
export const snovExportSchema = z.object({
  batchId: uuidSchema,
  campaignName: z.string().min(1).max(200).transform(SecurityValidator.sanitizeText),
  onlyTrustedLeads: z.boolean().optional(),
  excludeRiskyLeads: z.boolean().optional(),
  minQualityScore: z.number().min(0).max(1).optional(),
  maxRiskScore: z.number().min(0).max(1).optional(),
  verifyEmails: z.boolean().optional(),
  createCampaign: z.boolean().optional(),
  emailTemplate: z.string().max(10000).transform(SecurityValidator.sanitizeHtml).optional(),
});

// Feedback submission validation
export const feedbackSchema = z.object({
  enrichedLeadId: uuidSchema.optional(),
  snovCampaignId: uuidSchema.optional(),
  batchId: uuidSchema.optional(),
  businessName: businessNameSchema.optional(),
  emailSent: z.boolean().optional(),
  emailDelivered: z.boolean().optional(),
  emailOpened: z.boolean().optional(),
  emailReplied: z.boolean().optional(),
  repliedPositively: z.boolean().optional(),
  meetingScheduled: z.boolean().optional(),
  dealClosed: z.boolean().optional(),
  dealValue: z.number().min(0).max(10000000).optional(), // Max $10M
  responseQuality: z.number().int().min(1).max(5).optional(),
  leadQualityRating: z.number().int().min(1).max(5).optional(),
  feedbackNotes: z.string().max(2000).transform(SecurityValidator.sanitizeText).optional(),
  responseDate: z.string().datetime().optional(),
  feedbackSource: z.enum(['manual', 'snov_webhook', 'api']).optional(),
}).refine(
  (data) => data.enrichedLeadId || data.snovCampaignId || data.batchId || data.businessName,
  { message: 'At least one identifier must be provided' }
);

// Bulk feedback validation
export const bulkFeedbackSchema = z.object({
  feedbacks: z.array(feedbackSchema).min(1).max(1000),
  campaignId: uuidSchema.optional(),
});

// Feature request validation
export const featureRequestSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200, 'Title too long').transform(SecurityValidator.sanitizeText),
  description: z.string().min(10, 'Description too short').max(5000, 'Description too long').transform(SecurityValidator.sanitizeHtml),
  category: z.enum(['enrichment', 'integration', 'ui', 'analytics', 'api', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// Feature update validation (admin only)
export const featureUpdateSchema = z.object({
  featureId: uuidSchema,
  status: z.enum(['submitted', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected']).optional(),
  estimatedEffort: z.enum(['small', 'medium', 'large', 'epic']).optional(),
  targetPhase: z.number().int().min(1).max(10).optional(),
  adminComment: z.string().max(1000).transform(SecurityValidator.sanitizeText).optional(),
});

// Vote validation
export const voteSchema = z.object({
  featureId: uuidSchema,
  action: z.enum(['vote', 'unvote']),
});

/**
 * Security middleware functions
 */

// CSRF protection
export function validateCSRF(request: Request): boolean {
  // In production, implement proper CSRF token validation
  const csrfToken = request.headers.get('X-CSRF-Token');
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  
  // Basic origin validation
  if (origin && !origin.includes(process.env.NEXT_PUBLIC_APP_URL || 'localhost')) {
    return false;
  }
  
  return true;
}

// Content Security Policy headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.stripe.com https://api.openai.com https://api.snov.io https://maps.googleapis.com",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
  };
}

// Error sanitization
export function sanitizeError(error: any): { error: string; details?: string } {
  // Never expose sensitive information in errors
  if (error instanceof z.ZodError) {
    return {
      error: 'Invalid input data',
      details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    };
  }
  
  if (error?.code === 'PGRST116') {
    return { error: 'Resource not found' };
  }
  
  if (error?.code?.startsWith('PG')) {
    return { error: 'Database operation failed' };
  }
  
  if (error instanceof Error) {
    // Log full error internally but return sanitized version
    console.error('API Error:', error);
    return { error: 'Internal server error' };
  }
  
  return { error: 'Unknown error occurred' };
}