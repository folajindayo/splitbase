import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  issuer: string;
  accountName: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  method?: 'totp' | 'sms' | 'email';
  verifiedAt?: string;
  backupCodesRemaining?: number;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  usedBackupCode?: boolean;
}

class TwoFactorAuthSystem {
  private static instance: TwoFactorAuthSystem;
  private readonly APP_NAME = 'Splitbase';
  private readonly TOTP_WINDOW = 2; // Allow 2 windows before/after for clock drift
  private readonly BACKUP_CODE_COUNT = 10;

  private constructor() {}

  static getInstance(): TwoFactorAuthSystem {
    if (!TwoFactorAuthSystem.instance) {
      TwoFactorAuthSystem.instance = new TwoFactorAuthSystem();
    }
    return TwoFactorAuthSystem.instance;
  }

  // Generate TOTP secret and QR code
  async setup(userId: string, email: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.APP_NAME} (${email})`,
        issuer: this.APP_NAME,
        length: 32,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store secret temporarily (not yet enabled)
      await supabase.from('two_factor_auth').upsert({
        user_id: userId,
        secret: this.encrypt(secret.base32),
        backup_codes: backupCodes.map(code => this.hashBackupCode(code)),
        enabled: false,
        method: 'totp',
        setup_at: new Date().toISOString(),
      });

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
        issuer: this.APP_NAME,
        accountName: email,
      };
    } catch (error: any) {
      throw new Error(`Failed to setup 2FA: ${error.message}`);
    }
  }

  // Verify TOTP code and enable 2FA
  async enable(userId: string, token: string): Promise<VerificationResult> {
    try {
      // Get user's secret
      const { data: twoFactorData, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !twoFactorData) {
        return {
          success: false,
          message: '2FA not set up. Please complete setup first.',
        };
      }

      // Decrypt secret
      const secret = this.decrypt(twoFactorData.secret);

      // Verify token
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.TOTP_WINDOW,
      });

      if (!isValid) {
        return {
          success: false,
          message: 'Invalid verification code. Please try again.',
        };
      }

      // Enable 2FA
      await supabase
        .from('two_factor_auth')
        .update({
          enabled: true,
          verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return {
        success: true,
        message: '2FA has been successfully enabled.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to enable 2FA: ${error.message}`,
      };
    }
  }

  // Verify TOTP code for login
  async verify(userId: string, token: string): Promise<VerificationResult> {
    try {
      // Get user's 2FA data
      const { data: twoFactorData, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .single();

      if (error || !twoFactorData) {
        return {
          success: false,
          message: '2FA is not enabled for this account.',
        };
      }

      // Try TOTP verification first
      const secret = this.decrypt(twoFactorData.secret);
      const isValidTOTP = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.TOTP_WINDOW,
      });

      if (isValidTOTP) {
        // Update last verified timestamp
        await supabase
          .from('two_factor_auth')
          .update({
            last_verified_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        return {
          success: true,
          message: 'Verification successful.',
        };
      }

      // Try backup code verification
      const backupCodeResult = await this.verifyBackupCode(userId, token, twoFactorData.backup_codes);
      
      return backupCodeResult;
    } catch (error: any) {
      return {
        success: false,
        message: `Verification failed: ${error.message}`,
      };
    }
  }

  // Verify backup code
  private async verifyBackupCode(
    userId: string,
    code: string,
    backupCodes: string[]
  ): Promise<VerificationResult> {
    const hashedCode = this.hashBackupCode(code);

    // Check if code exists and hasn't been used
    const codeIndex = backupCodes.indexOf(hashedCode);
    
    if (codeIndex === -1) {
      return {
        success: false,
        message: 'Invalid verification code or backup code.',
      };
    }

    // Remove used backup code
    const updatedCodes = [...backupCodes];
    updatedCodes.splice(codeIndex, 1);

    // Update database
    await supabase
      .from('two_factor_auth')
      .update({
        backup_codes: updatedCodes,
        last_verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return {
      success: true,
      message: 'Backup code verified successfully. This code cannot be used again.',
      usedBackupCode: true,
    };
  }

  // Disable 2FA
  async disable(userId: string, token: string): Promise<VerificationResult> {
    // Verify token first
    const verifyResult = await this.verify(userId, token);
    
    if (!verifyResult.success) {
      return verifyResult;
    }

    try {
      // Disable 2FA
      await supabase
        .from('two_factor_auth')
        .delete()
        .eq('user_id', userId);

      return {
        success: true,
        message: '2FA has been disabled.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to disable 2FA: ${error.message}`,
      };
    }
  }

  // Get 2FA status
  async getStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .single();

      if (error || !data) {
        return { enabled: false };
      }

      return {
        enabled: true,
        method: data.method,
        verifiedAt: data.verified_at,
        backupCodesRemaining: data.backup_codes?.length || 0,
      };
    } catch (error) {
      return { enabled: false };
    }
  }

  // Regenerate backup codes
  async regenerateBackupCodes(userId: string, token: string): Promise<{
    success: boolean;
    backupCodes?: string[];
    message: string;
  }> {
    // Verify token first
    const verifyResult = await this.verify(userId, token);
    
    if (!verifyResult.success) {
      return {
        success: false,
        message: verifyResult.message,
      };
    }

    try {
      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();

      // Update database
      await supabase
        .from('two_factor_auth')
        .update({
          backup_codes: backupCodes.map(code => this.hashBackupCode(code)),
        })
        .eq('user_id', userId);

      return {
        success: true,
        backupCodes,
        message: 'Backup codes regenerated successfully.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to regenerate backup codes: ${error.message}`,
      };
    }
  }

  // Generate backup codes
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      // Generate 8-character alphanumeric code
      const code = this.generateRandomCode(8);
      codes.push(code);
    }

    return codes;
  }

  // Generate random code
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Format as XXXX-XXXX for readability
    return code.slice(0, 4) + '-' + code.slice(4);
  }

  // Hash backup code
  private hashBackupCode(code: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  // Encrypt secret
  private encrypt(text: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt secret
  private decrypt(text: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');

    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Send SMS code (mock implementation - integrate with SMS provider)
  async sendSMSCode(userId: string, phoneNumber: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code temporarily (expires in 5 minutes)
      await supabase.from('verification_codes').insert({
        user_id: userId,
        code: this.hashBackupCode(code),
        type: 'sms',
        phone_number: phoneNumber,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      // TODO: Integrate with SMS provider (Twilio, etc.)
      console.log(`SMS Code for ${phoneNumber}: ${code}`);

      return {
        success: true,
        message: 'Verification code sent via SMS.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send SMS: ${error.message}`,
      };
    }
  }

  // Send email code
  async sendEmailCode(userId: string, email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code temporarily (expires in 5 minutes)
      await supabase.from('verification_codes').insert({
        user_id: userId,
        code: this.hashBackupCode(code),
        type: 'email',
        email,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      // TODO: Send email with code
      console.log(`Email Code for ${email}: ${code}`);

      return {
        success: true,
        message: 'Verification code sent via email.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
      };
    }
  }

  // Get trusted devices
  async getTrustedDevices(userId: string): Promise<Array<{
    id: string;
    name: string;
    lastUsed: string;
    ipAddress: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_used_at', { ascending: false });

      if (error) {
        console.error('Error fetching trusted devices:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching trusted devices:', error);
      return [];
    }
  }

  // Remove trusted device
  async removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .delete()
        .eq('user_id', userId)
        .eq('id', deviceId);

      return !error;
    } catch (error) {
      console.error('Error removing trusted device:', error);
      return false;
    }
  }
}

// Export singleton instance
export const twoFactorAuth = TwoFactorAuthSystem.getInstance();

// Convenience functions
export const setup2FA = (userId: string, email: string) =>
  twoFactorAuth.setup(userId, email);

export const enable2FA = (userId: string, token: string) =>
  twoFactorAuth.enable(userId, token);

export const verify2FA = (userId: string, token: string) =>
  twoFactorAuth.verify(userId, token);

export const disable2FA = (userId: string, token: string) =>
  twoFactorAuth.disable(userId, token);

export const get2FAStatus = (userId: string) =>
  twoFactorAuth.getStatus(userId);

export const regenerate2FABackupCodes = (userId: string, token: string) =>
  twoFactorAuth.regenerateBackupCodes(userId, token);

