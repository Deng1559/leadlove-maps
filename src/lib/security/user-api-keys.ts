import { createClient } from '@/lib/supabase/client';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// User API Key Management System
// Stores user's third-party API keys securely in Supabase with encryption

interface UserApiKey {
  id: string;
  user_id: string;
  service: string;
  key_name: string;
  encrypted_value: string;
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface ApiKeyConfig {
  service: string;
  key_name: string;
  value: string;
  expires_at?: Date;
}

// Supported third-party services
export enum SupportedServices {
  GOOGLE = 'google',
  SNOV = 'snov',
  OPENAI = 'openai',
  STRIPE = 'stripe',
  CUSTOM = 'custom'
}

export class UserApiKeyManager {
  private supabase;
  private encryptionKey: Buffer;
  
  constructor() {
    this.supabase = createClient();
    
    // Use application-level encryption key
    // In production, this should be stored in a secure vault
    const keyString = process.env.API_KEY_ENCRYPTION_SECRET || 'default-dev-key-change-in-production';
    this.encryptionKey = createHash('sha256').update(keyString).digest();
  }
  
  // Encrypt API key value
  private encrypt(value: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }
  
  // Decrypt API key value
  private decrypt(encryptedValue: string): string {
    const parts = encryptedValue.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted value format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Store user API key
  async storeApiKey(
    userId: string, 
    config: ApiKeyConfig
  ): Promise<{ success: boolean; keyId?: string; error?: string }> {
    try {
      // Validate service
      if (!Object.values(SupportedServices).includes(config.service as SupportedServices)) {
        return { success: false, error: 'Unsupported service' };
      }
      
      // Validate key format based on service
      const validationError = this.validateApiKey(config.service, config.value);
      if (validationError) {
        return { success: false, error: validationError };
      }
      
      // Encrypt the API key
      const encryptedValue = this.encrypt(config.value);
      
      // Check if key already exists for this service
      const { data: existing } = await this.supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', userId)
        .eq('service', config.service)
        .eq('key_name', config.key_name)
        .single();
      
      if (existing) {
        // Update existing key
        const { data, error } = await this.supabase
          .from('user_api_keys')
          .update({
            encrypted_value: encryptedValue,
            expires_at: config.expires_at?.toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          })
          .eq('id', existing.id)
          .select('id')
          .single();
        
        if (error) {
          return { success: false, error: 'Failed to update API key' };
        }
        
        return { success: true, keyId: data.id };
      } else {
        // Create new key
        const { data, error } = await this.supabase
          .from('user_api_keys')
          .insert({
            user_id: userId,
            service: config.service,
            key_name: config.key_name,
            encrypted_value: encryptedValue,
            expires_at: config.expires_at?.toISOString(),
            is_active: true
          })
          .select('id')
          .single();
        
        if (error) {
          return { success: false, error: 'Failed to store API key' };
        }
        
        return { success: true, keyId: data.id };
      }
    } catch (error) {
      console.error('Store API key error:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }
  
  // Retrieve user API key (decrypted)
  async getApiKey(
    userId: string, 
    service: string, 
    keyName: string = 'default'
  ): Promise<{ success: boolean; value?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('user_api_keys')
        .select('encrypted_value, is_active, expires_at')
        .eq('user_id', userId)
        .eq('service', service)
        .eq('key_name', keyName)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        return { success: false, error: 'API key not found' };
      }
      
      // Check if key is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Mark as inactive
        await this.supabase
          .from('user_api_keys')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('service', service)
          .eq('key_name', keyName);
        
        return { success: false, error: 'API key has expired' };
      }
      
      // Decrypt and return
      const decryptedValue = this.decrypt(data.encrypted_value);
      
      // Update last used timestamp
      await this.updateLastUsed(userId, service, keyName);
      
      return { success: true, value: decryptedValue };
    } catch (error) {
      console.error('Get API key error:', error);
      return { success: false, error: 'Failed to retrieve API key' };
    }
  }
  
  // List user's API keys (metadata only, no values)
  async listApiKeys(userId: string): Promise<{
    success: boolean;
    keys?: Array<{
      id: string;
      service: string;
      key_name: string;
      is_active: boolean;
      last_used_at?: string;
      expires_at?: string;
      created_at: string;
    }>;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('user_api_keys')
        .select('id, service, key_name, is_active, last_used_at, expires_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        return { success: false, error: 'Failed to fetch API keys' };
      }
      
      return { success: true, keys: data || [] };
    } catch (error) {
      console.error('List API keys error:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }
  
  // Delete user API key
  async deleteApiKey(
    userId: string, 
    keyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('user_api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', userId);
      
      if (error) {
        return { success: false, error: 'Failed to delete API key' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Delete API key error:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }
  
  // Deactivate API key
  async deactivateApiKey(
    userId: string, 
    keyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('user_api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('user_id', userId);
      
      if (error) {
        return { success: false, error: 'Failed to deactivate API key' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Deactivate API key error:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }
  
  // Update last used timestamp
  private async updateLastUsed(
    userId: string, 
    service: string, 
    keyName: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('user_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('service', service)
        .eq('key_name', keyName);
    } catch (error) {
      // Non-critical error, don't fail the main operation
      console.warn('Failed to update last_used_at:', error);
    }
  }
  
  // Validate API key format based on service
  private validateApiKey(service: string, value: string): string | null {
    if (!value || value.length < 10) {
      return 'API key too short';
    }
    
    switch (service) {
      case SupportedServices.GOOGLE:
        // Google API keys are typically 39 characters
        if (value.length < 20 || value.length > 100) {
          return 'Invalid Google API key format';
        }
        break;
        
      case SupportedServices.SNOV:
        // Snov.io keys are typically longer
        if (value.length < 20) {
          return 'Invalid Snov.io API key format';
        }
        break;
        
      case SupportedServices.OPENAI:
        // OpenAI keys start with sk-
        if (!value.startsWith('sk-') || value.length < 20) {
          return 'Invalid OpenAI API key format (should start with sk-)';
        }
        break;
        
      case SupportedServices.STRIPE:
        // Stripe keys start with sk_ or pk_
        if (!(value.startsWith('sk_') || value.startsWith('pk_')) || value.length < 20) {
          return 'Invalid Stripe API key format';
        }
        break;
        
      case SupportedServices.CUSTOM:
        // Less strict validation for custom keys
        if (value.length < 5) {
          return 'Custom API key too short';
        }
        break;
        
      default:
        return 'Unknown service type';
    }
    
    return null; // Valid
  }
  
  // Test API key by making a simple request
  async testApiKey(
    userId: string, 
    service: string, 
    keyName: string = 'default'
  ): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      const keyResult = await this.getApiKey(userId, service, keyName);
      if (!keyResult.success || !keyResult.value) {
        return { success: false, error: keyResult.error };
      }
      
      // Test the key based on service
      switch (service) {
        case SupportedServices.GOOGLE:
          return await this.testGoogleKey(keyResult.value);
          
        case SupportedServices.SNOV:
          return await this.testSnovKey(keyResult.value);
          
        case SupportedServices.OPENAI:
          return await this.testOpenAIKey(keyResult.value);
          
        default:
          return { success: true, details: 'Key format valid, but testing not implemented for this service' };
      }
    } catch (error) {
      console.error('Test API key error:', error);
      return { success: false, error: 'Failed to test API key' };
    }
  }
  
  // Test Google API key
  private async testGoogleKey(apiKey: string): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      // Test with a simple Maps API call
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`);
      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        return { success: false, error: 'Google API key is invalid or denied' };
      }
      
      return { success: true, details: { status: data.status } };
    } catch (error) {
      return { success: false, error: 'Failed to test Google API key' };
    }
  }
  
  // Test Snov.io API key
  private async testSnovKey(apiKey: string): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      const response = await fetch('https://api.snov.io/v1/account-info', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return { success: false, error: 'Snov.io API key is invalid' };
      }
      
      const data = await response.json();
      return { success: true, details: { plan: data.plan, credits: data.credits } };
    } catch (error) {
      return { success: false, error: 'Failed to test Snov.io API key' };
    }
  }
  
  // Test OpenAI API key
  private async testOpenAIKey(apiKey: string): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return { success: false, error: 'OpenAI API key is invalid' };
      }
      
      return { success: true, details: 'API key is valid' };
    } catch (error) {
      return { success: false, error: 'Failed to test OpenAI API key' };
    }
  }
}

// Database table creation SQL
export const createUserApiKeysTable = `
  CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL CHECK (service IN ('google', 'snov', 'openai', 'stripe', 'custom')),
    key_name TEXT NOT NULL DEFAULT 'default',
    encrypted_value TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, service, key_name)
  );
  
  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_service ON user_api_keys(user_id, service);
  CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(is_active, expires_at);
  
  -- Enable RLS
  ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
  
  -- Users can only manage their own API keys
  CREATE POLICY "Users can manage own API keys" ON user_api_keys
    FOR ALL USING (auth.uid() = user_id);
  
  -- Update timestamp trigger
  CREATE OR REPLACE FUNCTION update_user_api_keys_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  DROP TRIGGER IF EXISTS trigger_update_user_api_keys_updated_at ON user_api_keys;
  CREATE TRIGGER trigger_update_user_api_keys_updated_at
    BEFORE UPDATE ON user_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_user_api_keys_updated_at();
`;