/**
 * Payment Errors
 */

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class InsufficientBalanceError extends PaymentError {
  constructor() {
    super('Insufficient balance', 'INSUFFICIENT_BALANCE', 400);
    this.name = 'InsufficientBalanceError';
  }
}

export class PaymentExecutionError extends PaymentError {
  constructor(reason: string) {
    super(`Payment execution failed: ${reason}`, 'EXECUTION_FAILED', 500);
    this.name = 'PaymentExecutionError';
  }
}

export class InvalidRecipientError extends PaymentError {
  constructor(address: string) {
    super(`Invalid recipient address: ${address}`, 'INVALID_RECIPIENT', 400);
    this.name = 'InvalidRecipientError';
  }
}

