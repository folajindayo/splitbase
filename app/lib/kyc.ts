import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum VerificationStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum DocumentType {
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  NATIONAL_ID = 'national_id',
  PROOF_OF_ADDRESS = 'proof_of_address',
  BANK_STATEMENT = 'bank_statement',
  UTILITY_BILL = 'utility_bill',
  BUSINESS_LICENSE = 'business_license',
  ARTICLES_OF_INCORPORATION = 'articles_of_incorporation',
}

export enum VerificationLevel {
  BASIC = 'basic', // Email + Phone
  STANDARD = 'standard', // Basic + ID Document
  ENHANCED = 'enhanced', // Standard + Address Verification
  PREMIUM = 'premium', // Enhanced + Additional Checks
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface KYCProfile {
  id: string;
  userId: string;
  level: VerificationLevel;
  status: VerificationStatus;
  riskLevel: RiskLevel;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  businessInfo?: {
    name?: string;
    registrationNumber?: string;
    taxId?: string;
    type?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  documents: DocumentSubmission[];
  checks: VerificationCheck[];
  verifiedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSubmission {
  id: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

export interface VerificationCheck {
  id: string;
  type: string;
  status: VerificationStatus;
  result?: any;
  performedAt: string;
  provider?: string;
  confidence?: number;
  flags?: string[];
}

export interface KYCRequest {
  userId: string;
  level: VerificationLevel;
  personalInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
  };
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  businessInfo?: {
    name: string;
    registrationNumber: string;
    taxId?: string;
    type: string;
  };
}

class KYCSystem {
  private static instance: KYCSystem;
  private readonly VERIFICATION_EXPIRY_DAYS = 365;
  private readonly MAX_DOCUMENTS = 10;

  private constructor() {}

  static getInstance(): KYCSystem {
    if (!KYCSystem.instance) {
      KYCSystem.instance = new KYCSystem();
    }
    return KYCSystem.instance;
  }

  // Start KYC verification
  async startVerification(request: KYCRequest): Promise<KYCProfile> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.VERIFICATION_EXPIRY_DAYS);

      const profileData = {
        user_id: request.userId,
        level: request.level,
        status: VerificationStatus.PENDING,
        risk_level: RiskLevel.MEDIUM,
        personal_info: request.personalInfo,
        business_info: request.businessInfo,
        documents: [],
        checks: [],
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('kyc_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;

      // Perform initial checks
      await this.performBasicChecks(data.id, request);

      return this.mapToKYCProfile(data);
    } catch (error: any) {
      console.error('Failed to start verification:', error);
      throw error;
    }
  }

  // Get KYC profile
  async getProfile(userId: string): Promise<KYCProfile | null> {
    try {
      const { data, error } = await supabase
        .from('kyc_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return this.mapToKYCProfile(data);
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }

  // Submit document
  async submitDocument(
    userId: string,
    document: {
      type: DocumentType;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      metadata?: Record<string, any>;
    }
  ): Promise<DocumentSubmission> {
    try {
      const profile = await this.getProfile(userId);

      if (!profile) {
        throw new Error('KYC profile not found');
      }

      if (profile.documents.length >= this.MAX_DOCUMENTS) {
        throw new Error('Maximum documents limit reached');
      }

      const docData = {
        kyc_profile_id: profile.id,
        type: document.type,
        file_url: document.fileUrl,
        file_name: document.fileName,
        file_size: document.fileSize,
        status: VerificationStatus.PENDING,
        metadata: document.metadata,
        submitted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('kyc_documents')
        .insert(docData)
        .select()
        .single();

      if (error) throw error;

      // Update profile status
      await this.updateProfileStatus(profile.id, VerificationStatus.IN_REVIEW);

      // Trigger document verification
      await this.verifyDocument(data.id);

      return {
        id: data.id,
        type: data.type,
        fileUrl: data.file_url,
        fileName: data.file_name,
        fileSize: data.file_size,
        status: data.status,
        submittedAt: data.submitted_at,
        reviewedAt: data.reviewed_at,
        rejectionReason: data.rejection_reason,
        metadata: data.metadata,
      };
    } catch (error: any) {
      console.error('Failed to submit document:', error);
      throw error;
    }
  }

  // Verify document
  private async verifyDocument(documentId: string): Promise<void> {
    try {
      // Mock verification - integrate with actual document verification service
      // (e.g., Onfido, Jumio, Veriff)

      const checks = [
        {
          type: 'document_authenticity',
          status: VerificationStatus.VERIFIED,
          confidence: 0.95,
          provider: 'mock_provider',
        },
        {
          type: 'face_match',
          status: VerificationStatus.VERIFIED,
          confidence: 0.92,
          provider: 'mock_provider',
        },
      ];

      for (const check of checks) {
        await supabase.from('verification_checks').insert({
          document_id: documentId,
          type: check.type,
          status: check.status,
          confidence: check.confidence,
          provider: check.provider,
          performed_at: new Date().toISOString(),
        });
      }

      // Update document status
      await supabase
        .from('kyc_documents')
        .update({
          status: VerificationStatus.VERIFIED,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', documentId);
    } catch (error) {
      console.error('Failed to verify document:', error);
    }
  }

  // Perform basic checks
  private async performBasicChecks(
    profileId: string,
    request: KYCRequest
  ): Promise<void> {
    try {
      const checks = [
        {
          type: 'email_verification',
          status: VerificationStatus.VERIFIED,
          provider: 'internal',
        },
        {
          type: 'phone_verification',
          status: VerificationStatus.PENDING,
          provider: 'internal',
        },
      ];

      if (request.level >= VerificationLevel.STANDARD) {
        checks.push({
          type: 'identity_check',
          status: VerificationStatus.PENDING,
          provider: 'mock_provider',
        });
      }

      if (request.level >= VerificationLevel.ENHANCED) {
        checks.push({
          type: 'address_verification',
          status: VerificationStatus.PENDING,
          provider: 'mock_provider',
        });
      }

      if (request.level === VerificationLevel.PREMIUM) {
        checks.push(
          {
            type: 'aml_screening',
            status: VerificationStatus.PENDING,
            provider: 'mock_provider',
          },
          {
            type: 'sanctions_check',
            status: VerificationStatus.PENDING,
            provider: 'mock_provider',
          },
          {
            type: 'pep_screening',
            status: VerificationStatus.PENDING,
            provider: 'mock_provider',
          }
        );
      }

      for (const check of checks) {
        await supabase.from('verification_checks').insert({
          kyc_profile_id: profileId,
          type: check.type,
          status: check.status,
          provider: check.provider,
          performed_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to perform basic checks:', error);
    }
  }

  // Approve KYC
  async approve(profileId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('kyc_profiles')
        .update({
          status: VerificationStatus.VERIFIED,
          verified_at: new Date().toISOString(),
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      return !error;
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      return false;
    }
  }

  // Reject KYC
  async reject(profileId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('kyc_profiles')
        .update({
          status: VerificationStatus.REJECTED,
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      return !error;
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      return false;
    }
  }

  // Check if user is verified
  async isVerified(userId: string, level?: VerificationLevel): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);

      if (!profile) return false;

      if (profile.status !== VerificationStatus.VERIFIED) return false;

      if (level && profile.level < level) return false;

      // Check if expired
      if (profile.expiresAt && new Date(profile.expiresAt) < new Date()) {
        await this.updateProfileStatus(profile.id, VerificationStatus.EXPIRED);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check verification:', error);
      return false;
    }
  }

  // Get required documents for level
  getRequiredDocuments(level: VerificationLevel): DocumentType[] {
    switch (level) {
      case VerificationLevel.BASIC:
        return [];
      case VerificationLevel.STANDARD:
        return [DocumentType.PASSPORT, DocumentType.DRIVERS_LICENSE, DocumentType.NATIONAL_ID];
      case VerificationLevel.ENHANCED:
        return [
          DocumentType.PASSPORT,
          DocumentType.DRIVERS_LICENSE,
          DocumentType.NATIONAL_ID,
          DocumentType.PROOF_OF_ADDRESS,
        ];
      case VerificationLevel.PREMIUM:
        return [
          DocumentType.PASSPORT,
          DocumentType.DRIVERS_LICENSE,
          DocumentType.NATIONAL_ID,
          DocumentType.PROOF_OF_ADDRESS,
          DocumentType.BANK_STATEMENT,
        ];
      default:
        return [];
    }
  }

  // Calculate risk score
  async calculateRiskScore(userId: string): Promise<{
    score: number;
    level: RiskLevel;
    factors: string[];
  }> {
    try {
      const profile = await this.getProfile(userId);

      if (!profile) {
        return { score: 100, level: RiskLevel.CRITICAL, factors: ['No KYC profile'] };
      }

      let score = 0;
      const factors: string[] = [];

      // Check verification status
      if (profile.status !== VerificationStatus.VERIFIED) {
        score += 50;
        factors.push('Not verified');
      }

      // Check verification level
      if (profile.level < VerificationLevel.STANDARD) {
        score += 20;
        factors.push('Low verification level');
      }

      // Check document verification
      const unverifiedDocs = profile.documents.filter(
        (doc) => doc.status !== VerificationStatus.VERIFIED
      );
      if (unverifiedDocs.length > 0) {
        score += 15;
        factors.push(`${unverifiedDocs.length} unverified documents`);
      }

      // Check failed checks
      const failedChecks = profile.checks.filter(
        (check) => check.status === VerificationStatus.REJECTED
      );
      if (failedChecks.length > 0) {
        score += 30;
        factors.push(`${failedChecks.length} failed checks`);
      }

      // Determine risk level
      let level: RiskLevel;
      if (score >= 80) level = RiskLevel.CRITICAL;
      else if (score >= 50) level = RiskLevel.HIGH;
      else if (score >= 30) level = RiskLevel.MEDIUM;
      else level = RiskLevel.LOW;

      // Update risk level in profile
      await supabase
        .from('kyc_profiles')
        .update({ risk_level: level })
        .eq('id', profile.id);

      return { score, level, factors };
    } catch (error) {
      console.error('Failed to calculate risk score:', error);
      return { score: 100, level: RiskLevel.CRITICAL, factors: ['Error calculating risk'] };
    }
  }

  // Get verification statistics
  async getStats(): Promise<{
    total: number;
    byStatus: Record<VerificationStatus, number>;
    byLevel: Record<VerificationLevel, number>;
    byRisk: Record<RiskLevel, number>;
    averageCompletionTime?: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('kyc_profiles')
        .select('status, level, risk_level, created_at, verified_at');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byStatus: {} as Record<VerificationStatus, number>,
        byLevel: {} as Record<VerificationLevel, number>,
        byRisk: {} as Record<RiskLevel, number>,
        averageCompletionTime: 0,
      };

      let totalCompletionTime = 0;
      let completedCount = 0;

      data?.forEach((profile) => {
        stats.byStatus[profile.status as VerificationStatus] =
          (stats.byStatus[profile.status as VerificationStatus] || 0) + 1;

        stats.byLevel[profile.level as VerificationLevel] =
          (stats.byLevel[profile.level as VerificationLevel] || 0) + 1;

        stats.byRisk[profile.risk_level as RiskLevel] =
          (stats.byRisk[profile.risk_level as RiskLevel] || 0) + 1;

        if (profile.verified_at) {
          const completionTime =
            new Date(profile.verified_at).getTime() -
            new Date(profile.created_at).getTime();
          totalCompletionTime += completionTime;
          completedCount++;
        }
      });

      if (completedCount > 0) {
        stats.averageCompletionTime = totalCompletionTime / completedCount;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        total: 0,
        byStatus: {} as any,
        byLevel: {} as any,
        byRisk: {} as any,
      };
    }
  }

  // Update profile status
  private async updateProfileStatus(
    profileId: string,
    status: VerificationStatus
  ): Promise<void> {
    await supabase
      .from('kyc_profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);
  }

  // Map database record to KYCProfile
  private mapToKYCProfile(data: any): KYCProfile {
    return {
      id: data.id,
      userId: data.user_id,
      level: data.level,
      status: data.status,
      riskLevel: data.risk_level,
      personalInfo: data.personal_info,
      businessInfo: data.business_info,
      documents: data.documents || [],
      checks: data.checks || [],
      verifiedAt: data.verified_at,
      expiresAt: data.expires_at,
      rejectionReason: data.rejection_reason,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Check for expired verifications
  async checkExpired(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('kyc_profiles')
        .update({
          status: VerificationStatus.EXPIRED,
          updated_at: new Date().toISOString(),
        })
        .eq('status', VerificationStatus.VERIFIED)
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to check expired verifications:', error);
      return 0;
    }
  }

  // Require verification middleware
  requireVerification(level?: VerificationLevel) {
    return async (req: any, res: any, next: any) => {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const verified = await this.isVerified(req.user.id, level);

      if (!verified) {
        return res.status(403).json({
          error: 'KYC verification required',
          requiredLevel: level || VerificationLevel.BASIC,
        });
      }

      next();
    };
  }
}

// Export singleton instance
export const kycSystem = KYCSystem.getInstance();

// Convenience functions
export const startVerification = (request: KYCRequest) =>
  kycSystem.startVerification(request);

export const isVerified = (userId: string, level?: VerificationLevel) =>
  kycSystem.isVerified(userId, level);

export const submitDocument = (
  userId: string,
  document: {
    type: DocumentType;
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }
) => kycSystem.submitDocument(userId, document);

export const getKYCProfile = (userId: string) => kycSystem.getProfile(userId);

export const calculateRiskScore = (userId: string) =>
  kycSystem.calculateRiskScore(userId);

