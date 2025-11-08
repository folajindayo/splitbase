import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum DocumentCategory {
  IDENTITY = 'identity',
  ADDRESS = 'address',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  OTHER = 'other',
}

export enum VerificationMethod {
  MANUAL = 'manual',
  OCR = 'ocr',
  AI = 'ai',
  THIRD_PARTY = 'third_party',
}

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  PENDING_REVIEW = 'pending_review',
}

export enum ExtractionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface DocumentUpload {
  file: File | Buffer;
  fileName: string;
  category: DocumentCategory;
  userId: string;
  escrowId?: string;
  metadata?: Record<string, any>;
}

export interface Document {
  id: string;
  userId: string;
  escrowId?: string;
  category: DocumentCategory;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  verificationMethod?: VerificationMethod;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  expiryDate?: string;
  extractedData?: Record<string, any>;
  ocrText?: string;
  confidence?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionResult {
  id: string;
  documentId: string;
  status: ExtractionStatus;
  method: VerificationMethod;
  data: Record<string, any>;
  rawText?: string;
  confidence: number;
  fields: ExtractedField[];
  createdAt: string;
}

export interface ExtractedField {
  name: string;
  value: any;
  confidence: number;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  checks: VerificationCheck[];
  warnings?: string[];
  errors?: string[];
}

export interface VerificationCheck {
  type: string;
  passed: boolean;
  confidence: number;
  message?: string;
  details?: Record<string, any>;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: DocumentCategory;
  requiredFields: string[];
  optionalFields: string[];
  validationRules: Record<string, any>;
}

class DocumentVerificationSystem {
  private static instance: DocumentVerificationSystem;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  private constructor() {}

  static getInstance(): DocumentVerificationSystem {
    if (!DocumentVerificationSystem.instance) {
      DocumentVerificationSystem.instance = new DocumentVerificationSystem();
    }
    return DocumentVerificationSystem.instance;
  }

  // Upload and process document
  async upload(upload: DocumentUpload): Promise<Document> {
    try {
      // Validate file
      this.validateFile(upload);

      // Upload file to storage
      const fileUrl = await this.uploadToStorage(upload);

      // Create document record
      const documentData = {
        user_id: upload.userId,
        escrow_id: upload.escrowId,
        category: upload.category,
        file_name: upload.fileName,
        file_url: fileUrl,
        file_size: upload.file instanceof File ? upload.file.size : upload.file.length,
        mime_type: upload.file instanceof File ? upload.file.type : 'application/octet-stream',
        status: DocumentStatus.UPLOADED,
        metadata: upload.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;

      const document = this.mapToDocument(data);

      // Start processing
      this.processDocument(document.id);

      return document;
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  }

  // Process document
  private async processDocument(documentId: string): Promise<void> {
    try {
      // Update status
      await this.updateStatus(documentId, DocumentStatus.PROCESSING);

      // Extract data
      const extraction = await this.extractData(documentId);

      // Verify document
      const verification = await this.verifyDocument(documentId, extraction);

      // Update document with results
      const status = verification.verified
        ? DocumentStatus.VERIFIED
        : DocumentStatus.PENDING_REVIEW;

      await supabase
        .from('documents')
        .update({
          status,
          verification_method: extraction.method,
          extracted_data: extraction.data,
          ocr_text: extraction.rawText,
          confidence: extraction.confidence,
          verified_at: verification.verified ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);
    } catch (error) {
      console.error('Failed to process document:', error);

      await this.updateStatus(documentId, DocumentStatus.PENDING_REVIEW);
    }
  }

  // Extract data from document
  async extractData(documentId: string): Promise<ExtractionResult> {
    try {
      const document = await this.get(documentId);

      if (!document) {
        throw new Error('Document not found');
      }

      // Mock OCR/AI extraction - integrate with actual service
      // (e.g., Google Cloud Vision, AWS Textract, Azure Form Recognizer)
      const extractedFields = await this.performOCR(document);

      const extractionData = {
        document_id: documentId,
        status: ExtractionStatus.COMPLETED,
        method: VerificationMethod.OCR,
        data: this.structureExtractedData(extractedFields),
        raw_text: extractedFields.map((f) => f.value).join(' '),
        confidence: this.calculateAverageConfidence(extractedFields),
        fields: extractedFields,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('document_extractions')
        .insert(extractionData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        documentId: data.document_id,
        status: data.status,
        method: data.method,
        data: data.data,
        rawText: data.raw_text,
        confidence: data.confidence,
        fields: data.fields,
        createdAt: data.created_at,
      };
    } catch (error: any) {
      console.error('Failed to extract data:', error);
      throw error;
    }
  }

  // Perform OCR
  private async performOCR(document: Document): Promise<ExtractedField[]> {
    // Mock implementation - integrate with actual OCR service
    const mockFields: ExtractedField[] = [];

    switch (document.category) {
      case DocumentCategory.IDENTITY:
        mockFields.push(
          { name: 'firstName', value: 'John', confidence: 0.95 },
          { name: 'lastName', value: 'Doe', confidence: 0.93 },
          { name: 'dateOfBirth', value: '1990-01-15', confidence: 0.91 },
          { name: 'documentNumber', value: 'AB123456', confidence: 0.89 }
        );
        break;

      case DocumentCategory.ADDRESS:
        mockFields.push(
          { name: 'street', value: '123 Main St', confidence: 0.92 },
          { name: 'city', value: 'San Francisco', confidence: 0.94 },
          { name: 'state', value: 'CA', confidence: 0.96 },
          { name: 'postalCode', value: '94102', confidence: 0.93 },
          { name: 'country', value: 'USA', confidence: 0.95 }
        );
        break;

      case DocumentCategory.INVOICE:
        mockFields.push(
          { name: 'invoiceNumber', value: 'INV-001', confidence: 0.97 },
          { name: 'date', value: '2024-01-15', confidence: 0.94 },
          { name: 'amount', value: 1500.0, confidence: 0.96 },
          { name: 'currency', value: 'USD', confidence: 0.98 }
        );
        break;

      default:
        mockFields.push({ name: 'text', value: 'Extracted text content', confidence: 0.85 });
    }

    return mockFields;
  }

  // Verify document
  private async verifyDocument(
    documentId: string,
    extraction: ExtractionResult
  ): Promise<VerificationResult> {
    const checks: VerificationCheck[] = [];

    // Confidence check
    checks.push({
      type: 'confidence',
      passed: extraction.confidence >= 0.85,
      confidence: extraction.confidence,
      message:
        extraction.confidence >= 0.85
          ? 'High confidence extraction'
          : 'Low confidence extraction',
    });

    // Completeness check
    const requiredFieldsPresent = this.checkRequiredFields(extraction);
    checks.push({
      type: 'completeness',
      passed: requiredFieldsPresent,
      confidence: requiredFieldsPresent ? 1.0 : 0.5,
      message: requiredFieldsPresent
        ? 'All required fields present'
        : 'Missing required fields',
    });

    // Format validation
    const formatValid = this.validateFormat(extraction);
    checks.push({
      type: 'format',
      passed: formatValid,
      confidence: formatValid ? 1.0 : 0.5,
      message: formatValid ? 'Valid format' : 'Invalid format',
    });

    const allPassed = checks.every((c) => c.passed);
    const avgConfidence = checks.reduce((sum, c) => sum + c.confidence, 0) / checks.length;

    return {
      verified: allPassed && avgConfidence >= 0.85,
      confidence: avgConfidence,
      checks,
      warnings: allPassed ? [] : ['Document requires manual review'],
    };
  }

  // Check required fields
  private checkRequiredFields(extraction: ExtractionResult): boolean {
    // Mock implementation - check based on document type
    return extraction.fields.length > 0;
  }

  // Validate format
  private validateFormat(extraction: ExtractionResult): boolean {
    // Mock implementation - validate field formats
    return true;
  }

  // Structure extracted data
  private structureExtractedData(fields: ExtractedField[]): Record<string, any> {
    const structured: Record<string, any> = {};

    fields.forEach((field) => {
      structured[field.name] = field.value;
    });

    return structured;
  }

  // Calculate average confidence
  private calculateAverageConfidence(fields: ExtractedField[]): number {
    if (fields.length === 0) return 0;

    const sum = fields.reduce((acc, field) => acc + field.confidence, 0);
    return sum / fields.length;
  }

  // Manual review approval
  async approve(documentId: string, reviewerId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: DocumentStatus.VERIFIED,
          verification_method: VerificationMethod.MANUAL,
          verified_at: new Date().toISOString(),
          verified_by: reviewerId,
          metadata: { notes },
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return !error;
    } catch (error) {
      console.error('Failed to approve document:', error);
      return false;
    }
  }

  // Manual review rejection
  async reject(documentId: string, reviewerId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: DocumentStatus.REJECTED,
          rejection_reason: reason,
          verified_by: reviewerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return !error;
    } catch (error) {
      console.error('Failed to reject document:', error);
      return false;
    }
  }

  // Get document
  async get(documentId: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !data) return null;

      return this.mapToDocument(data);
    } catch (error) {
      console.error('Failed to get document:', error);
      return null;
    }
  }

  // List documents
  async list(options: {
    userId?: string;
    escrowId?: string;
    category?: DocumentCategory;
    status?: DocumentStatus;
    limit?: number;
  } = {}): Promise<Document[]> {
    try {
      let query = supabase.from('documents').select('*');

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.escrowId) {
        query = query.eq('escrow_id', options.escrowId);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToDocument);
    } catch (error) {
      console.error('Failed to list documents:', error);
      return [];
    }
  }

  // Delete document
  async delete(documentId: string): Promise<boolean> {
    try {
      const document = await this.get(documentId);

      if (!document) {
        return false;
      }

      // Delete from storage
      await this.deleteFromStorage(document.fileUrl);

      // Delete from database
      const { error } = await supabase.from('documents').delete().eq('id', documentId);

      return !error;
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
  }

  // Compare documents
  async compare(documentId1: string, documentId2: string): Promise<{
    similarity: number;
    differences: Array<{ field: string; value1: any; value2: any }>;
  }> {
    try {
      const [doc1, doc2] = await Promise.all([this.get(documentId1), this.get(documentId2)]);

      if (!doc1 || !doc2) {
        throw new Error('One or both documents not found');
      }

      const data1 = doc1.extractedData || {};
      const data2 = doc2.extractedData || {};

      const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);
      let matchingFields = 0;
      const differences: Array<{ field: string; value1: any; value2: any }> = [];

      allKeys.forEach((key) => {
        const value1 = data1[key];
        const value2 = data2[key];

        if (JSON.stringify(value1) === JSON.stringify(value2)) {
          matchingFields++;
        } else {
          differences.push({ field: key, value1, value2 });
        }
      });

      const similarity = allKeys.size > 0 ? matchingFields / allKeys.size : 0;

      return { similarity, differences };
    } catch (error: any) {
      console.error('Failed to compare documents:', error);
      throw error;
    }
  }

  // Get statistics
  async getStats(options: { userId?: string } = {}): Promise<{
    total: number;
    byCategory: Record<DocumentCategory, number>;
    byStatus: Record<DocumentStatus, number>;
    averageConfidence: number;
    verificationRate: number;
  }> {
    try {
      let query = supabase.from('documents').select('category, status, confidence');

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byCategory: {} as Record<DocumentCategory, number>,
        byStatus: {} as Record<DocumentStatus, number>,
        averageConfidence: 0,
        verificationRate: 0,
      };

      let totalConfidence = 0;
      let confidenceCount = 0;

      data?.forEach((doc) => {
        stats.byCategory[doc.category as DocumentCategory] =
          (stats.byCategory[doc.category as DocumentCategory] || 0) + 1;

        stats.byStatus[doc.status as DocumentStatus] =
          (stats.byStatus[doc.status as DocumentStatus] || 0) + 1;

        if (doc.confidence) {
          totalConfidence += doc.confidence;
          confidenceCount++;
        }
      });

      stats.averageConfidence =
        confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

      const verified = stats.byStatus[DocumentStatus.VERIFIED] || 0;
      stats.verificationRate = stats.total > 0 ? (verified / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        total: 0,
        byCategory: {} as any,
        byStatus: {} as any,
        averageConfidence: 0,
        verificationRate: 0,
      };
    }
  }

  // Validate file
  private validateFile(upload: DocumentUpload): void {
    const file = upload.file;
    const size = file instanceof File ? file.size : file.length;
    const mimeType = file instanceof File ? file.type : 'application/octet-stream';

    if (size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`File type ${mimeType} not allowed`);
    }
  }

  // Upload to storage
  private async uploadToStorage(upload: DocumentUpload): Promise<string> {
    // Mock implementation - integrate with actual storage service
    return `https://storage.example.com/documents/${upload.userId}/${Date.now()}-${upload.fileName}`;
  }

  // Delete from storage
  private async deleteFromStorage(fileUrl: string): Promise<void> {
    // Mock implementation - integrate with actual storage service
  }

  // Update status
  private async updateStatus(documentId: string, status: DocumentStatus): Promise<void> {
    await supabase
      .from('documents')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);
  }

  // Map database record to Document
  private mapToDocument(data: any): Document {
    return {
      id: data.id,
      userId: data.user_id,
      escrowId: data.escrow_id,
      category: data.category,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      status: data.status,
      verificationMethod: data.verification_method,
      verifiedAt: data.verified_at,
      verifiedBy: data.verified_by,
      rejectionReason: data.rejection_reason,
      expiryDate: data.expiry_date,
      extractedData: data.extracted_data,
      ocrText: data.ocr_text,
      confidence: data.confidence,
      tags: data.tags,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const documentVerification = DocumentVerificationSystem.getInstance();

// Convenience functions
export const uploadDocument = (upload: DocumentUpload) =>
  documentVerification.upload(upload);

export const getDocument = (documentId: string) => documentVerification.get(documentId);

export const approveDocument = (documentId: string, reviewerId: string, notes?: string) =>
  documentVerification.approve(documentId, reviewerId, notes);

export const rejectDocument = (documentId: string, reviewerId: string, reason: string) =>
  documentVerification.reject(documentId, reviewerId, reason);

export const extractDocumentData = (documentId: string) =>
  documentVerification.extractData(documentId);

