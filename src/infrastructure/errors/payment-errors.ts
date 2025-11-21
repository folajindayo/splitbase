/**
 * Payment-related Error Classes
 */

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'PaymentError';
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(message: string = 'Insufficient funds', public required: string, public available: string) {
    super(message, 'INSUFFICIENT_FUNDS', false);
    this.name = 'InsufficientFundsError';
    Object.setPrototypeOf(this, InsufficientFundsError.prototype);
  }
}

export class TransactionFailedError extends PaymentError {
  constructor(message: string = 'Transaction failed', public txHash?: string) {
    super(message, 'TRANSACTION_FAILED', true);
    this.name = 'TransactionFailedError';
    Object.setPrototypeOf(this, TransactionFailedError.prototype);
  }
}

export class InvalidRecipientError extends PaymentError {
  constructor(message: string = 'Invalid recipient', public recipient: string) {
    super(message, 'INVALID_RECIPIENT', false);
    this.name = 'InvalidRecipientError';
    Object.setPrototypeOf(this, InvalidRecipientError.prototype);
  }
}

export class GasEstimationError extends PaymentError {
  constructor(message: string = 'Failed to estimate gas') {
    super(message, 'GAS_ESTIMATION_FAILED', true);
    this.name = 'GasEstimationError';
    Object.setPrototypeOf(this, GasEstimationError.prototype);
  }
}

