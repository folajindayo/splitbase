import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum ReportType {
  TRANSACTIONS = 'transactions',
  ESCROWS = 'escrows',
  USERS = 'users',
  PAYMENTS = 'payments',
  DISPUTES = 'disputes',
  REVENUE = 'revenue',
  COMPLIANCE = 'compliance',
  ACTIVITY = 'activity',
  FINANCIAL = 'financial',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export interface Report {
  id: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  name: string;
  description?: string;
  parameters: ReportParameters;
  fileUrl?: string;
  fileSize?: number;
  generatedBy: string;
  generatedAt?: string;
  expiresAt?: string;
  downloadCount: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface ReportParameters {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  filters?: Record<string, any>;
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeDetails?: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  parameters: ReportParameters;
  schedule?: ReportSchedule;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  time?: string; // HH:mm
  timezone?: string;
  recipients?: string[];
}

export interface ReportData {
  headers: string[];
  rows: any[][];
  summary?: Record<string, any>;
  charts?: ReportChart[];
  metadata?: Record<string, any>;
}

export interface ReportChart {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: Array<{ label: string; value: number }>;
}

export interface ExportOptions {
  format: ReportFormat;
  includeHeaders?: boolean;
  includeCharts?: boolean;
  includeSummary?: boolean;
  compression?: boolean;
}

class ReportingSystem {
  private static instance: ReportingSystem;
  private readonly REPORT_EXPIRY_DAYS = 30;

  private constructor() {}

  static getInstance(): ReportingSystem {
    if (!ReportingSystem.instance) {
      ReportingSystem.instance = new ReportingSystem();
    }
    return ReportingSystem.instance;
  }

  // Generate report
  async generate(request: {
    type: ReportType;
    format: ReportFormat;
    name: string;
    description?: string;
    parameters: ReportParameters;
    generatedBy: string;
  }): Promise<Report> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.REPORT_EXPIRY_DAYS);

      const reportData = {
        type: request.type,
        format: request.format,
        status: ReportStatus.PENDING,
        name: request.name,
        description: request.description,
        parameters: request.parameters,
        generated_by: request.generatedBy,
        expires_at: expiresAt.toISOString(),
        download_count: 0,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single();

      if (error) throw error;

      const report = this.mapToReport(data);

      // Generate report asynchronously
      this.generateReportData(report.id);

      return report;
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  // Generate report data
  private async generateReportData(reportId: string): Promise<void> {
    try {
      await this.updateStatus(reportId, ReportStatus.GENERATING);

      const report = await this.get(reportId);

      if (!report) return;

      // Fetch data based on report type
      const data = await this.fetchReportData(report);

      // Generate file
      const fileUrl = await this.generateFile(report, data);

      // Update report
      await supabase
        .from('reports')
        .update({
          status: ReportStatus.COMPLETED,
          file_url: fileUrl,
          file_size: Math.floor(Math.random() * 1000000), // Mock file size
          generated_at: new Date().toISOString(),
        })
        .eq('id', reportId);
    } catch (error) {
      console.error('Failed to generate report data:', error);
      await this.updateStatus(reportId, ReportStatus.FAILED);
    }
  }

  // Fetch report data
  private async fetchReportData(report: Report): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(report.parameters);

    switch (report.type) {
      case ReportType.TRANSACTIONS:
        return this.fetchTransactionData(startDate, endDate, report.parameters);

      case ReportType.ESCROWS:
        return this.fetchEscrowData(startDate, endDate, report.parameters);

      case ReportType.USERS:
        return this.fetchUserData(startDate, endDate, report.parameters);

      case ReportType.REVENUE:
        return this.fetchRevenueData(startDate, endDate, report.parameters);

      case ReportType.DISPUTES:
        return this.fetchDisputeData(startDate, endDate, report.parameters);

      default:
        return { headers: [], rows: [] };
    }
  }

  // Fetch transaction data
  private async fetchTransactionData(
    startDate: string,
    endDate: string,
    params: ReportParameters
  ): Promise<ReportData> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (params.sortBy) {
        query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      const headers = ['ID', 'Type', 'Amount', 'Currency', 'Status', 'Date'];
      const rows = (data || []).map((tx) => [
        tx.id,
        tx.type,
        tx.amount,
        tx.currency,
        tx.status,
        tx.created_at,
      ]);

      const summary = {
        totalTransactions: data?.length || 0,
        totalAmount: data?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0,
      };

      return { headers, rows, summary };
    } catch (error) {
      console.error('Failed to fetch transaction data:', error);
      return { headers: [], rows: [] };
    }
  }

  // Fetch escrow data
  private async fetchEscrowData(
    startDate: string,
    endDate: string,
    params: ReportParameters
  ): Promise<ReportData> {
    try {
      let query = supabase
        .from('escrows')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const { data, error } = await query;

      if (error) throw error;

      const headers = ['ID', 'Title', 'Amount', 'Status', 'Created', 'Completed'];
      const rows = (data || []).map((escrow) => [
        escrow.id,
        escrow.title,
        escrow.amount,
        escrow.status,
        escrow.created_at,
        escrow.completed_at || 'N/A',
      ]);

      const summary = {
        totalEscrows: data?.length || 0,
        totalValue: data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
        completed: data?.filter((e) => e.status === 'completed').length || 0,
      };

      return { headers, rows, summary };
    } catch (error) {
      console.error('Failed to fetch escrow data:', error);
      return { headers: [], rows: [] };
    }
  }

  // Fetch user data
  private async fetchUserData(
    startDate: string,
    endDate: string,
    params: ReportParameters
  ): Promise<ReportData> {
    try {
      let query = supabase
        .from('users')
        .select('id, email, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const { data, error } = await query;

      if (error) throw error;

      const headers = ['ID', 'Email', 'Created'];
      const rows = (data || []).map((user) => [
        user.id,
        user.email,
        user.created_at,
      ]);

      const summary = {
        totalUsers: data?.length || 0,
      };

      return { headers, rows, summary };
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return { headers: [], rows: [] };
    }
  }

  // Fetch revenue data
  private async fetchRevenueData(
    startDate: string,
    endDate: string,
    params: ReportParameters
  ): Promise<ReportData> {
    try {
      // Fetch fees from transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'fee')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const headers = ['Date', 'Transaction ID', 'Amount', 'Currency'];
      const rows = (data || []).map((tx) => [
        tx.created_at,
        tx.id,
        tx.amount,
        tx.currency,
      ]);

      const summary = {
        totalRevenue: data?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0,
        transactionCount: data?.length || 0,
      };

      // Create chart data
      const charts: ReportChart[] = [
        {
          type: 'line',
          title: 'Revenue Over Time',
          data: this.aggregateByDate(data || []),
        },
      ];

      return { headers, rows, summary, charts };
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      return { headers: [], rows: [] };
    }
  }

  // Fetch dispute data
  private async fetchDisputeData(
    startDate: string,
    endDate: string,
    params: ReportParameters
  ): Promise<ReportData> {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const headers = ['ID', 'Type', 'Status', 'Amount', 'Created', 'Resolved'];
      const rows = (data || []).map((dispute) => [
        dispute.id,
        dispute.type,
        dispute.status,
        dispute.amount,
        dispute.created_at,
        dispute.resolved_at || 'N/A',
      ]);

      const summary = {
        totalDisputes: data?.length || 0,
        resolved: data?.filter((d) => d.status === 'resolved').length || 0,
        open: data?.filter((d) => d.status === 'open').length || 0,
      };

      return { headers, rows, summary };
    } catch (error) {
      console.error('Failed to fetch dispute data:', error);
      return { headers: [], rows: [] };
    }
  }

  // Generate file
  private async generateFile(report: Report, data: ReportData): Promise<string> {
    // Mock file generation - integrate with actual file generation library
    switch (report.format) {
      case ReportFormat.CSV:
        return this.generateCSV(data);

      case ReportFormat.PDF:
        return this.generatePDF(report, data);

      case ReportFormat.EXCEL:
        return this.generateExcel(data);

      case ReportFormat.JSON:
        return this.generateJSON(data);

      default:
        return '';
    }
  }

  // Generate CSV
  private generateCSV(data: ReportData): string {
    // Mock implementation
    return `https://storage.example.com/reports/${Date.now()}.csv`;
  }

  // Generate PDF
  private generatePDF(report: Report, data: ReportData): string {
    // Mock implementation
    return `https://storage.example.com/reports/${Date.now()}.pdf`;
  }

  // Generate Excel
  private generateExcel(data: ReportData): string {
    // Mock implementation
    return `https://storage.example.com/reports/${Date.now()}.xlsx`;
  }

  // Generate JSON
  private generateJSON(data: ReportData): string {
    // Mock implementation
    return `https://storage.example.com/reports/${Date.now()}.json`;
  }

  // Get report
  async get(reportId: string): Promise<Report | null> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error || !data) return null;

      return this.mapToReport(data);
    } catch (error) {
      console.error('Failed to get report:', error);
      return null;
    }
  }

  // List reports
  async list(filter: {
    type?: ReportType;
    status?: ReportStatus;
    generatedBy?: string;
    limit?: number;
  } = {}): Promise<Report[]> {
    try {
      let query = supabase.from('reports').select('*');

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.generatedBy) {
        query = query.eq('generated_by', filter.generatedBy);
      }

      query = query.order('created_at', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToReport);
    } catch (error) {
      console.error('Failed to list reports:', error);
      return [];
    }
  }

  // Download report
  async download(reportId: string): Promise<string | null> {
    try {
      const report = await this.get(reportId);

      if (!report || !report.fileUrl) return null;

      // Increment download count
      await supabase
        .from('reports')
        .update({
          download_count: report.downloadCount + 1,
        })
        .eq('id', reportId);

      return report.fileUrl;
    } catch (error) {
      console.error('Failed to download report:', error);
      return null;
    }
  }

  // Delete report
  async delete(reportId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', reportId);

      return !error;
    } catch (error) {
      console.error('Failed to delete report:', error);
      return false;
    }
  }

  // Create template
  async createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt'>): Promise<ReportTemplate> {
    try {
      const templateData = {
        name: template.name,
        type: template.type,
        description: template.description,
        parameters: template.parameters,
        schedule: template.schedule,
        active: template.active,
        created_by: template.createdBy,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('report_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        description: data.description,
        parameters: data.parameters,
        schedule: data.schedule,
        active: data.active,
        createdBy: data.created_by,
        createdAt: data.created_at,
      };
    } catch (error: any) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  // Get templates
  async getTemplates(userId?: string): Promise<ReportTemplate[]> {
    try {
      let query = supabase.from('report_templates').select('*');

      if (userId) {
        query = query.eq('created_by', userId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((template) => ({
        id: template.id,
        name: template.name,
        type: template.type,
        description: template.description,
        parameters: template.parameters,
        schedule: template.schedule,
        active: template.active,
        createdBy: template.created_by,
        createdAt: template.created_at,
      }));
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  // Export data
  async exportData(options: {
    type: ReportType;
    format: ReportFormat;
    parameters: ReportParameters;
  }): Promise<string> {
    try {
      const report = await this.generate({
        type: options.type,
        format: options.format,
        name: `Export ${options.type} ${new Date().toISOString()}`,
        parameters: options.parameters,
        generatedBy: 'system',
      });

      // Wait for report to complete (in production, use webhooks or polling)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const url = await this.download(report.id);

      return url || '';
    } catch (error: any) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  // Cleanup expired reports
  async cleanup(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup reports:', error);
      return 0;
    }
  }

  // Helper methods
  private getDateRange(params: ReportParameters): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (params.period === ReportPeriod.CUSTOM) {
      return {
        startDate: params.startDate || now.toISOString(),
        endDate: params.endDate || now.toISOString(),
      };
    }

    switch (params.period) {
      case ReportPeriod.TODAY:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;

      case ReportPeriod.YESTERDAY:
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.THIS_WEEK:
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        break;

      case ReportPeriod.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case ReportPeriod.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case ReportPeriod.THIS_YEAR:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;

      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  private aggregateByDate(data: any[]): Array<{ label: string; value: number }> {
    const aggregated: Record<string, number> = {};

    data.forEach((item) => {
      const date = item.created_at.split('T')[0];
      aggregated[date] = (aggregated[date] || 0) + (item.amount || 0);
    });

    return Object.entries(aggregated)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private async updateStatus(reportId: string, status: ReportStatus): Promise<void> {
    await supabase.from('reports').update({ status }).eq('id', reportId);
  }

  private mapToReport(data: any): Report {
    return {
      id: data.id,
      type: data.type,
      format: data.format,
      status: data.status,
      name: data.name,
      description: data.description,
      parameters: data.parameters,
      fileUrl: data.file_url,
      fileSize: data.file_size,
      generatedBy: data.generated_by,
      generatedAt: data.generated_at,
      expiresAt: data.expires_at,
      downloadCount: data.download_count,
      createdAt: data.created_at,
      metadata: data.metadata,
    };
  }
}

// Export singleton instance
export const reporting = ReportingSystem.getInstance();

// Convenience functions
export const generateReport = (request: any) => reporting.generate(request);
export const getReport = (reportId: string) => reporting.get(reportId);
export const downloadReport = (reportId: string) => reporting.download(reportId);
export const exportData = (options: any) => reporting.exportData(options);
export const createReportTemplate = (template: any) => reporting.createTemplate(template);

