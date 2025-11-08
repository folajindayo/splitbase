import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum InvoiceType {
  STANDARD = 'standard',
  PROFORMA = 'proforma',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
  RECURRING = 'recurring',
}

export enum PaymentTerms {
  DUE_ON_RECEIPT = 'due_on_receipt',
  NET_7 = 'net_7',
  NET_15 = 'net_15',
  NET_30 = 'net_30',
  NET_60 = 'net_60',
  NET_90 = 'net_90',
  CUSTOM = 'custom',
}

export interface Invoice {
  id: string;
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  issuer: {
    name: string;
    email: string;
    address?: Address;
    taxId?: string;
    logo?: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    address?: Address;
    taxId?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: {
    rate: number;
    amount: number;
  };
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  };
  total: number;
  currency: string;
  paymentTerms: PaymentTerms;
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  notes?: string;
  terms?: string;
  metadata?: Record<string, any>;
  payments: InvoicePayment[];
  reminders: InvoiceReminder[];
  viewedAt?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
  metadata?: Record<string, any>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt: string;
  notes?: string;
}

export interface InvoiceReminder {
  id: string;
  sentAt: string;
  type: 'initial' | 'reminder' | 'final';
  recipientEmail: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  items: Omit<InvoiceItem, 'id'>[];
  paymentTerms: PaymentTerms;
  notes?: string;
  terms?: string;
  active: boolean;
  createdAt: string;
}

export interface InvoiceStatistics {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  averagePaymentTime: number;
  byStatus: Record<InvoiceStatus, number>;
  timeline: Array<{
    month: string;
    issued: number;
    paid: number;
    amount: number;
  }>;
}

export interface RecurringInvoiceConfig {
  templateId?: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextIssueDate: string;
  active: boolean;
}

class InvoicingSystem {
  private static instance: InvoicingSystem;
  private readonly TAX_RATE = 0.1; // 10% default
  private readonly OVERDUE_CHECK_DAYS = 1;

  private constructor() {}

  static getInstance(): InvoicingSystem {
    if (!InvoicingSystem.instance) {
      InvoicingSystem.instance = new InvoicingSystem();
    }
    return InvoicingSystem.instance;
  }

  // Create invoice
  async create(data: {
    type?: InvoiceType;
    issuer: Invoice['issuer'];
    customer: Invoice['customer'];
    items: Omit<InvoiceItem, 'id' | 'amount'>[];
    paymentTerms?: PaymentTerms;
    discount?: Invoice['discount'];
    taxRate?: number;
    currency?: string;
    notes?: string;
    terms?: string;
    metadata?: Record<string, any>;
  }): Promise<Invoice> {
    try {
      // Generate invoice number
      const number = await this.generateInvoiceNumber();

      // Calculate amounts
      const items: InvoiceItem[] = data.items.map((item, index) => ({
        id: `item-${index + 1}`,
        ...item,
        amount: item.quantity * item.unitPrice,
      }));

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

      let discountAmount = 0;
      if (data.discount) {
        discountAmount =
          data.discount.type === 'percentage'
            ? (subtotal * data.discount.value) / 100
            : data.discount.value;
      }

      const taxableAmount = subtotal - discountAmount;
      const taxRate = data.taxRate || this.TAX_RATE;
      const taxAmount = taxableAmount * taxRate;
      const total = taxableAmount + taxAmount;

      // Calculate due date
      const dueDate = this.calculateDueDate(data.paymentTerms || PaymentTerms.NET_30);

      const invoiceData = {
        number,
        type: data.type || InvoiceType.STANDARD,
        status: InvoiceStatus.DRAFT,
        issuer: data.issuer,
        customer: data.customer,
        items,
        subtotal,
        tax: {
          rate: taxRate,
          amount: taxAmount,
        },
        discount: data.discount
          ? {
              ...data.discount,
              amount: discountAmount,
            }
          : undefined,
        total,
        currency: data.currency || 'USD',
        payment_terms: data.paymentTerms || PaymentTerms.NET_30,
        due_date: dueDate.toISOString(),
        issue_date: new Date().toISOString(),
        notes: data.notes,
        terms: data.terms,
        metadata: data.metadata,
        payments: [],
        reminders: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToInvoice(invoice);
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  // Get invoice
  async get(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error || !data) return null;

      return this.mapToInvoice(data);
    } catch (error) {
      console.error('Failed to get invoice:', error);
      return null;
    }
  }

  // Get by number
  async getByNumber(number: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('number', number)
        .single();

      if (error || !data) return null;

      return this.mapToInvoice(data);
    } catch (error) {
      console.error('Failed to get invoice by number:', error);
      return null;
    }
  }

  // List invoices
  async list(filter: {
    customerId?: string;
    status?: InvoiceStatus;
    type?: InvoiceType;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<Invoice[]> {
    try {
      let query = supabase.from('invoices').select('*');

      if (filter.customerId) {
        query = query.eq('customer->>id', filter.customerId);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      if (filter.startDate) {
        query = query.gte('issue_date', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('issue_date', filter.endDate);
      }

      query = query.order('issue_date', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToInvoice);
    } catch (error) {
      console.error('Failed to list invoices:', error);
      return [];
    }
  }

  // Update invoice
  async update(invoiceId: string, updates: Partial<Invoice>): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.status) updateData.status = updates.status;
      if (updates.items) updateData.items = updates.items;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.terms !== undefined) updateData.terms = updates.terms;
      if (updates.metadata) updateData.metadata = updates.metadata;

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      return !error;
    } catch (error) {
      console.error('Failed to update invoice:', error);
      return false;
    }
  }

  // Send invoice
  async send(invoiceId: string, recipientEmail?: string): Promise<boolean> {
    try {
      const invoice = await this.get(invoiceId);

      if (!invoice) return false;

      // Generate PDF
      const pdfUrl = await this.generatePDF(invoice);

      // Send email
      const email = recipientEmail || invoice.customer.email;
      await this.sendInvoiceEmail(invoice, email, pdfUrl);

      // Update status and add reminder
      const reminder: InvoiceReminder = {
        id: `reminder-${Date.now()}`,
        sentAt: new Date().toISOString(),
        type: 'initial',
        recipientEmail: email,
      };

      await supabase
        .from('invoices')
        .update({
          status: InvoiceStatus.SENT,
          pdf_url: pdfUrl,
          reminders: [...invoice.reminders, reminder],
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      return true;
    } catch (error) {
      console.error('Failed to send invoice:', error);
      return false;
    }
  }

  // Record payment
  async recordPayment(
    invoiceId: string,
    payment: Omit<InvoicePayment, 'id' | 'paidAt'>
  ): Promise<boolean> {
    try {
      const invoice = await this.get(invoiceId);

      if (!invoice) return false;

      const paymentRecord: InvoicePayment = {
        id: `payment-${Date.now()}`,
        ...payment,
        paidAt: new Date().toISOString(),
      };

      const totalPaid =
        invoice.payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;

      let status: InvoiceStatus;
      if (totalPaid >= invoice.total) {
        status = InvoiceStatus.PAID;
      } else if (totalPaid > 0) {
        status = InvoiceStatus.PARTIAL;
      } else {
        status = invoice.status;
      }

      const updateData: any = {
        payments: [...invoice.payments, paymentRecord],
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === InvoiceStatus.PAID) {
        updateData.paid_date = new Date().toISOString();
      }

      await supabase.from('invoices').update(updateData).eq('id', invoiceId);

      return true;
    } catch (error) {
      console.error('Failed to record payment:', error);
      return false;
    }
  }

  // Mark as viewed
  async markViewed(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.get(invoiceId);

      if (!invoice || invoice.viewedAt) return false;

      await supabase
        .from('invoices')
        .update({
          status: InvoiceStatus.VIEWED,
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      return true;
    } catch (error) {
      console.error('Failed to mark viewed:', error);
      return false;
    }
  }

  // Cancel invoice
  async cancel(invoiceId: string, reason?: string): Promise<boolean> {
    try {
      await supabase
        .from('invoices')
        .update({
          status: InvoiceStatus.CANCELLED,
          metadata: { cancellationReason: reason },
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      return true;
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      return false;
    }
  }

  // Check for overdue invoices
  async checkOverdue(): Promise<number> {
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: InvoiceStatus.OVERDUE,
          updated_at: now.toISOString(),
        })
        .in('status', [InvoiceStatus.SENT, InvoiceStatus.VIEWED])
        .lt('due_date', now.toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to check overdue:', error);
      return 0;
    }
  }

  // Send reminder
  async sendReminder(invoiceId: string, type: 'reminder' | 'final' = 'reminder'): Promise<boolean> {
    try {
      const invoice = await this.get(invoiceId);

      if (!invoice) return false;

      await this.sendReminderEmail(invoice, type);

      const reminder: InvoiceReminder = {
        id: `reminder-${Date.now()}`,
        sentAt: new Date().toISOString(),
        type,
        recipientEmail: invoice.customer.email,
      };

      await supabase
        .from('invoices')
        .update({
          reminders: [...invoice.reminders, reminder],
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      return true;
    } catch (error) {
      console.error('Failed to send reminder:', error);
      return false;
    }
  }

  // Get statistics
  async getStatistics(filter: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<InvoiceStatistics> {
    try {
      const invoices = await this.list(filter);

      const stats: InvoiceStatistics = {
        total: invoices.length,
        paid: 0,
        pending: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        averagePaymentTime: 0,
        byStatus: {} as Record<InvoiceStatus, number>,
        timeline: [],
      };

      let totalPaymentTime = 0;
      let paidCount = 0;

      invoices.forEach((invoice) => {
        stats.totalAmount += invoice.total;

        if (invoice.status === InvoiceStatus.PAID) {
          stats.paid++;
          const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
          stats.paidAmount += paidAmount;

          if (invoice.paidDate) {
            const paymentTime =
              new Date(invoice.paidDate).getTime() - new Date(invoice.issueDate).getTime();
            totalPaymentTime += paymentTime;
            paidCount++;
          }
        } else if (invoice.status === InvoiceStatus.OVERDUE) {
          stats.overdue++;
          stats.outstandingAmount += invoice.total;
        } else {
          stats.pending++;
          stats.outstandingAmount += invoice.total;
        }

        stats.byStatus[invoice.status] = (stats.byStatus[invoice.status] || 0) + 1;
      });

      stats.averagePaymentTime =
        paidCount > 0 ? totalPaymentTime / paidCount / (1000 * 60 * 60 * 24) : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        averagePaymentTime: 0,
        byStatus: {} as any,
        timeline: [],
      };
    }
  }

  // Helper methods
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .like('number', `INV-${year}-%`);

    const sequence = (count || 0) + 1;
    return `INV-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  private calculateDueDate(terms: PaymentTerms, issueDate?: Date): Date {
    const date = issueDate || new Date();

    switch (terms) {
      case PaymentTerms.DUE_ON_RECEIPT:
        return date;
      case PaymentTerms.NET_7:
        return new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
      case PaymentTerms.NET_15:
        return new Date(date.getTime() + 15 * 24 * 60 * 60 * 1000);
      case PaymentTerms.NET_30:
        return new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
      case PaymentTerms.NET_60:
        return new Date(date.getTime() + 60 * 24 * 60 * 60 * 1000);
      case PaymentTerms.NET_90:
        return new Date(date.getTime() + 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  private async generatePDF(invoice: Invoice): Promise<string> {
    // Mock implementation - integrate with PDF generation library
    return `https://storage.example.com/invoices/${invoice.number}.pdf`;
  }

  private async sendInvoiceEmail(
    invoice: Invoice,
    email: string,
    pdfUrl: string
  ): Promise<void> {
    // Mock implementation - integrate with email service
    console.log(`Sending invoice ${invoice.number} to ${email}`);
  }

  private async sendReminderEmail(
    invoice: Invoice,
    type: 'reminder' | 'final'
  ): Promise<void> {
    // Mock implementation
    console.log(`Sending ${type} for invoice ${invoice.number}`);
  }

  private mapToInvoice(data: any): Invoice {
    return {
      id: data.id,
      number: data.number,
      type: data.type,
      status: data.status,
      issuer: data.issuer,
      customer: data.customer,
      items: data.items,
      subtotal: data.subtotal,
      tax: data.tax,
      discount: data.discount,
      total: data.total,
      currency: data.currency,
      paymentTerms: data.payment_terms,
      dueDate: data.due_date,
      issueDate: data.issue_date,
      paidDate: data.paid_date,
      notes: data.notes,
      terms: data.terms,
      metadata: data.metadata,
      payments: data.payments || [],
      reminders: data.reminders || [],
      viewedAt: data.viewed_at,
      pdfUrl: data.pdf_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const invoicing = InvoicingSystem.getInstance();

// Convenience functions
export const createInvoice = (data: any) => invoicing.create(data);
export const getInvoice = (invoiceId: string) => invoicing.get(invoiceId);
export const sendInvoice = (invoiceId: string, email?: string) =>
  invoicing.send(invoiceId, email);
export const recordPayment = (invoiceId: string, payment: any) =>
  invoicing.recordPayment(invoiceId, payment);
export const getInvoiceStatistics = (filter?: any) => invoicing.getStatistics(filter);

