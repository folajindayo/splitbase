/**
 * Recipient Service
 * Manage split payment recipients
 */

export interface Recipient {
  id: string;
  address: string;
  name?: string;
  ensName?: string;
  email?: string;
  avatar?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipientValidation {
  isValid: boolean;
  errors: string[];
  resolvedAddress?: string;
}

export interface RecipientStats {
  totalReceived: number;
  totalClaimed: number;
  pendingAmount: number;
  splitCount: number;
  averageShare: number;
  lastActivityAt?: Date;
}

// In-memory store
const recipients: Map<string, Recipient> = new Map();
const recipientsByAddress: Map<string, string> = new Map(); // address -> id mapping

class RecipientService {
  /**
   * Generate ID
   */
  private generateId(): string {
    return `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Resolve ENS name
   */
  async resolveENS(ensName: string): Promise<string | null> {
    // In production, use actual ENS resolution
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!ensName.endsWith('.eth') && !ensName.endsWith('.xyz')) {
      return null;
    }
    
    // Mock resolution
    return `0x${Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
  }

  /**
   * Validate recipient
   */
  async validateRecipient(
    addressOrENS: string,
    existingRecipients: string[] = []
  ): Promise<RecipientValidation> {
    const errors: string[] = [];
    let resolvedAddress: string | undefined;

    // Check if empty
    if (!addressOrENS) {
      return { isValid: false, errors: ['Address is required'] };
    }

    // Check if valid address
    if (this.isValidAddress(addressOrENS)) {
      resolvedAddress = addressOrENS;
    } else if (addressOrENS.includes('.')) {
      // Try ENS resolution
      const resolved = await this.resolveENS(addressOrENS);
      if (resolved) {
        resolvedAddress = resolved;
      } else {
        errors.push('Could not resolve ENS name');
      }
    } else {
      errors.push('Invalid address format');
    }

    // Check for duplicates
    if (resolvedAddress && existingRecipients.includes(resolvedAddress.toLowerCase())) {
      errors.push('Duplicate recipient address');
    }

    return {
      isValid: errors.length === 0,
      errors,
      resolvedAddress,
    };
  }

  /**
   * Create or get recipient
   */
  async createOrGetRecipient(
    address: string,
    name?: string,
    email?: string
  ): Promise<Recipient> {
    const normalizedAddress = address.toLowerCase();
    
    // Check if exists
    const existingId = recipientsByAddress.get(normalizedAddress);
    if (existingId) {
      const existing = recipients.get(existingId);
      if (existing) {
        // Update if new info provided
        if (name && !existing.name) existing.name = name;
        if (email && !existing.email) existing.email = email;
        existing.updatedAt = new Date();
        return existing;
      }
    }

    // Create new
    const recipient: Recipient = {
      id: this.generateId(),
      address: normalizedAddress,
      name,
      email,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    recipients.set(recipient.id, recipient);
    recipientsByAddress.set(normalizedAddress, recipient.id);

    return recipient;
  }

  /**
   * Get recipient by ID
   */
  getRecipient(id: string): Recipient | null {
    return recipients.get(id) || null;
  }

  /**
   * Get recipient by address
   */
  getRecipientByAddress(address: string): Recipient | null {
    const id = recipientsByAddress.get(address.toLowerCase());
    if (!id) return null;
    return recipients.get(id) || null;
  }

  /**
   * Update recipient
   */
  updateRecipient(id: string, updates: Partial<Recipient>): Recipient | null {
    const recipient = recipients.get(id);
    if (!recipient) return null;

    Object.assign(recipient, updates, { updatedAt: new Date() });
    return recipient;
  }

  /**
   * Verify recipient
   */
  verifyRecipient(id: string): Recipient | null {
    return this.updateRecipient(id, { verified: true });
  }

  /**
   * Set ENS name
   */
  async setENSName(id: string, ensName: string): Promise<Recipient | null> {
    const recipient = recipients.get(id);
    if (!recipient) return null;

    // Verify ENS resolves to this address
    const resolved = await this.resolveENS(ensName);
    if (resolved?.toLowerCase() !== recipient.address.toLowerCase()) {
      return null;
    }

    recipient.ensName = ensName;
    recipient.updatedAt = new Date();
    return recipient;
  }

  /**
   * Get recipient stats
   */
  getRecipientStats(id: string): RecipientStats {
    // In production, calculate from actual data
    return {
      totalReceived: Math.random() * 100,
      totalClaimed: Math.random() * 80,
      pendingAmount: Math.random() * 20,
      splitCount: Math.floor(Math.random() * 10),
      averageShare: 25 + Math.random() * 50,
      lastActivityAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Search recipients
   */
  searchRecipients(query: string): Recipient[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(recipients.values()).filter(
      r =>
        r.address.includes(lowerQuery) ||
        r.name?.toLowerCase().includes(lowerQuery) ||
        r.ensName?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get recent recipients
   */
  getRecentRecipients(limit: number = 10): Recipient[] {
    return Array.from(recipients.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Format recipient display name
   */
  formatDisplayName(recipient: Recipient): string {
    if (recipient.name) return recipient.name;
    if (recipient.ensName) return recipient.ensName;
    return `${recipient.address.slice(0, 6)}...${recipient.address.slice(-4)}`;
  }
}

// Export singleton
export const recipientService = new RecipientService();
export { RecipientService };
export default recipientService;

