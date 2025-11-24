/**
 * Split Payment Repository Implementation (Supabase)
 */

import { ISplitPaymentRepository } from '../../../domain/repositories/split-payment.repository';
import { SplitPayment } from '../../../domain/entities/split-payment.entity';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSplitPaymentRepository implements ISplitPaymentRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async findByInitiator(initiator: string): Promise<SplitPayment[]> {
    const { data, error } = await this.supabase
      .from('split_payments')
      .select('*')
      .eq('initiator', initiator)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(p => new SplitPayment(
      p.id,
      p.initiator,
      p.total_amount,
      p.recipients,
      p.status,
      p.created_at
    ));
  }

  async findById(id: string): Promise<SplitPayment | null> {
    const { data, error } = await this.supabase
      .from('split_payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    return new SplitPayment(
      data.id,
      data.initiator,
      data.total_amount,
      data.recipients,
      data.status,
      data.created_at
    );
  }

  async save(payment: SplitPayment): Promise<void> {
    const { error } = await this.supabase
      .from('split_payments')
      .upsert({
        id: payment.id,
        initiator: payment.initiator,
        total_amount: payment.totalAmount,
        recipients: payment.recipients,
        status: payment.status,
        created_at: payment.createdAt,
      });

    if (error) throw error;
  }
}


