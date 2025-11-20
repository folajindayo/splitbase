/**
 * ENS Resolver
 */

import { ethers } from 'ethers';

export async function resolveENS(name: string): Promise<string | null> {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const address = await provider.resolveName(name);
    return address;
  } catch (error) {
    return null;
  }
}

export async function lookupAddress(address: string): Promise<string | null> {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const name = await provider.lookupAddress(address);
    return name;
  } catch (error) {
    return null;
  }
}

export function isENSName(input: string): boolean {
  return input.endsWith('.eth');
}

