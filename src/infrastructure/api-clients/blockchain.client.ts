/**
 * Blockchain API Client
 */

import { ethers } from 'ethers';

export class BlockchainClient {
  private provider: ethers.Provider;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async sendTransaction(
    from: string,
    to: string,
    amount: string,
    privateKey: string
  ): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });

    await tx.wait();
    return tx.hash;
  }

  async estimateGas(
    from: string,
    to: string,
    amount: string
  ): Promise<string> {
    const gasEstimate = await this.provider.estimateGas({
      from,
      to,
      value: ethers.parseEther(amount),
    });

    return gasEstimate.toString();
  }

  async getTransactionReceipt(txHash: string): Promise<any> {
    return await this.provider.getTransactionReceipt(txHash);
  }

  async getCurrentBlock(): Promise<number> {
    return await this.provider.getBlockNumber();
  }
}

