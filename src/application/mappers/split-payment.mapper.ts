/**
 * Split Payment Mapper
 */

import { SplitPaymentEntity } from '../../domain/entities/split-payment.entity';
import { SplitPaymentDTO } from '../dtos/split-payment.dto';

export class SplitPaymentMapper {
  static toDTO(entity: SplitPaymentEntity): SplitPaymentDTO {
    return {
      id: entity.id,
      creator: entity.creator,
      totalAmount: entity.totalAmount.toString(),
      token: entity.token,
      recipients: entity.recipients.map((r) => ({
        ...r,
        amount: r.amount.toString(),
      })),
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      executedAt: entity.executedAt?.toISOString(),
      transactionHash: entity.transactionHash,
      chainId: entity.chainId,
      metadata: entity.metadata,
    };
  }

  static toDTOList(entities: SplitPaymentEntity[]): SplitPaymentDTO[] {
    return entities.map((entity) => this.toDTO(entity));
  }
}

