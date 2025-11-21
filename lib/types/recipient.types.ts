/**
 * Recipient Types
 */

export interface Recipient {
  id: string;
  address: string;
  name?: string;
  share: number;
  ensName?: string;
}

export interface RecipientFormData {
  address: string;
  share: number;
}

export interface ValidatedRecipient extends Recipient {
  isValid: boolean;
  error?: string;
}

