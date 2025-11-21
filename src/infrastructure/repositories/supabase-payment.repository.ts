/**
 * Supabase Split Payment Repository
 */

import {
  ISplitPaymentRepository,
  PaymentFilters,
} from '../../domain/repositories/split-payment.repository';
import { SplitPaymentEntity, PaymentStatus } from '../../domain/entities/split-payment.entity';

export class SupabasePaymentRepository implements ISplitPaymentRepository {
  constructor(private readonly supabase: any) {}

  async findById(id: string): Promise<SplitPaymentEntity | null> {
    const { data, error } = await this.supabase
      .from('split_payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data);
  }

  async findByCreator(address: string): Promise<SplitPaymentEntity[]> {
    const { data, error } = await this.supabase
      .from('split_payments')
      .select('*')
      .eq('creator', address.toLowerCase());

    if (error || !data) return [];
    return data.map((item: any) => this.toDomain(item));
  }

  async findByRecipient(address: string): Promise<SplitPaymentEntity[]> {
    const { data, error } = await this.supabase
      .from('split_payments')
      .select('*')
      .contains('recipients', [{ address: address.toLowerCase() }]);

    if (error || !data) return [];
    return data.map((item: any) => this.toDomain(item));
  }

  async findAll(filters: PaymentFilters): Promise<SplitPaymentEntity[]> {
    let query = this.supabase.from('split_payments').select('*');

    if (filters.creator) {
      query = query.eq('creator', filters.creator.toLowerCase());
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.chainId) {
      query = query.eq('chain_id', filters.chainId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((item: any) => this.toDomain(item));
  }

  async create(payment: SplitPaymentEntity): Promise<SplitPaymentEntity> {
    const data = this.toData(payment);
    const { error } = await this.supabase.from('split_payments').insert(data);

    if (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }

    return payment;
  }

  async update(id: string, payment: SplitPaymentEntity): Promise<SplitPaymentEntity> {
    const data = this.toData(payment);
    const { error } = await this.supabase
      .from('split_payments')
      .update(data)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    return payment;
  }

  async delete(id: string): Promise<void> {
    await this.supabase.from('split_payments').delete().eq('id', id);
  }

  async countByStatus(status: PaymentStatus): Promise<number> {
    const { count } = await this.supabase
      .from('split_payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    return count || 0;
  }

  private toDomain(data: any): SplitPaymentEntity {
    return SplitPaymentEntity.create({
      id: data.id,
      creator: data.creator,
      totalAmount: BigInt(data.total_amount),
      token: data.token,
      recipients: data.recipients.map((r: any) => ({
        ...r,
        amount: BigInt(r.amount),
      })),
      status: data.status as PaymentStatus,
      createdAt: new Date(data.created_at),
      executedAt: data.executed_at ? new Date(data.executed_at) : undefined,
      transactionHash: data.transaction_hash,
      chainId: data.chain_id,
      metadata: data.metadata,
    });
  }

  private toData(entity: SplitPaymentEntity): any {
    return {
      id: entity.id,
      creator: entity.creator.toLowerCase(),
      total_amount: entity.totalAmount.toString(),
      token: entity.token,
      recipients: entity.recipients.map((r) => ({
        ...r,
        amount: r.amount.toString(),
      })),
      status: entity.status,
      created_at: entity.createdAt,
      executed_at: entity.executedAt,
      transaction_hash: entity.transactionHash,
      chain_id: entity.chainId,
      metadata: entity.metadata,
    };
  }
}

