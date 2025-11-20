/**
 * Ethereum Utilities
 */

import { ethers } from 'ethers';

export function parseEther(value: string): bigint {
  return ethers.parseEther(value);
}

export function formatEther(value: bigint): string {
  return ethers.formatEther(value);
}

export function toWei(value: string, unit: string = 'ether'): bigint {
  return ethers.parseUnits(value, unit);
}

export function fromWei(value: bigint, unit: string = 'ether'): string {
  return ethers.formatUnits(value, unit);
}

