import { JsonRpcProvider, Provider } from "ethers";
import { ENV } from "../config/environment.js";

export class EthereumService {
  private provider: Provider;

  constructor() {
    this.provider = new JsonRpcProvider(ENV.ETH_RPC_URL);
  }

  async getBlockNumber(): Promise<bigint> {
    return await this.provider.getBlockNumber();
  }

  async getBalance(address: string): Promise<bigint> {
    return await this.provider.getBalance(address);
  }

  async getENSName(address: string): Promise<string | null> {
    return await this.provider.lookupAddress(address);
  }

  async getENSAddress(name: string): Promise<string | null> {
    return await this.provider.resolveName(name);
  }

  getProvider(): Provider {
    return this.provider;
  }
}

// Export singleton instance
export const ethereumService = new EthereumService();
