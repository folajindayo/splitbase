/**
 * Split Payment Mapper
 */

import { SplitPayment } from '../../domain/entities/split-payment.entity';
import { SplitPaymentDTO } from '../dtos/split-payment.dto';

export class SplitPaymentMapper {
  static toDTO(entity: SplitPayment): SplitPaymentDTO {
    return {
      id: entity.id,
      initiator: entity.initiator,
      totalAmount: entity.totalAmount,
      recipients: entity.recipients,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }

  static toDTOList(entities: SplitPayment[]): SplitPaymentDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  static toEntity(dto: SplitPaymentDTO): SplitPayment {
    return new SplitPayment(
      dto.id,
      dto.initiator,
      dto.totalAmount,
      dto.recipients,
      dto.status,
      dto.createdAt
    );
  }
}
