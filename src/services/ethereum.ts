import { ethers } from "ethers";
import fetch from "node-fetch";
import { config } from "../config/environment.js";
import type { EthereumConfig } from "../types.js";

interface EtherscanResponse {
  status: string;
  result: string;
}

interface ContractNameResponse {
  result: Array<{
    ContractName?: string;
  }>;
}

export class EthereumService {
  private provider: ethers.JsonRpcProvider;
  private ensContract: ethers.Contract;
  private etherscanApiKey: string;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.ethereum.nodeUrl);
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

    this.ensContract = new ethers.Contract(
      config.ethereum.ensContractAddress,
      ["function balanceOf(address) view returns (uint256)"],
      this.provider
    );
  }

  async getENSBalance(
    address: string
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      // Resolve ENS name if it's an ENS address
      const resolvedAddress = address.endsWith(".eth")
        ? await this.provider.resolveName(address)
        : address;

      if (!resolvedAddress) {
        throw new Error(`Could not resolve address: ${address}`);
      }

      // Get the balance
      const balance = await this.ensContract.balanceOf(resolvedAddress);
      const decimals = await this.ensContract.decimals();

      // Format the balance with proper decimals
      const formattedBalance = ethers.formatUnits(balance, decimals);

      return {
        content: [
          {
            type: "text",
            text: `${formattedBalance} ENS`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get ENS balance: ${error.message}`);
      }
      throw error;
    }
  }

  async getProposalState(
    proposalId: string
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Implementation for proposal state...
    return {
      content: [
        {
          type: "text",
          text: "1", // Placeholder implementation
        },
      ],
    };
  }

  async getContractABI(
    address: string
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const resolvedAddress = address.endsWith(".eth")
        ? await this.provider.resolveName(address)
        : address;

      if (!resolvedAddress) {
        throw new Error(`Could not resolve address: ${address}`);
      }

      const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${resolvedAddress}&apikey=${this.etherscanApiKey}`;
      const response = await fetch(url);
      const data = (await response.json()) as EtherscanResponse;

      if (data.status === "0") {
        throw new Error(`Etherscan error: ${data.result}`);
      }

      const abi = JSON.parse(data.result);
      const formattedABI = JSON.stringify(abi, null, 2);

      const nameUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${resolvedAddress}&apikey=${this.etherscanApiKey}`;
      const nameResponse = await fetch(nameUrl);
      const nameData = (await nameResponse.json()) as ContractNameResponse;
      const contractName =
        nameData.result[0]?.ContractName || "Unknown Contract";

      return {
        content: [
          {
            type: "text",
            text: `Contract Name: ${contractName}\n\nABI:\n${formattedABI}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get contract ABI: ${error.message}`);
      }
      throw error;
    }
  }

  async decodeTransaction(
    txHash: string
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      // Get transaction
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error(`Transaction not found: ${txHash}`);
      }

      // Get the first 4 bytes of the input data (function selector)
      const functionSelector = tx.data.slice(0, 10);

      // Get contract code and try to identify the function
      const code = await this.getContractCode(tx.to!);

      return {
        content: [
          {
            type: "text",
            text: `
Transaction Details:
To: ${tx.to}
Value: ${ethers.formatEther(tx.value)} ETH
Function Selector: ${functionSelector}
Input Data: ${tx.data}
Gas Limit: ${tx.gasLimit}
Gas Price: ${ethers.formatUnits(tx.gasPrice || 0, "gwei")} Gwei
`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decode transaction: ${error.message}`);
      }
      throw error;
    }
  }

  async getContractCode(
    address: string
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      // First try to resolve if it's an ENS name
      const resolvedAddress = address.endsWith(".eth")
        ? await this.provider.resolveName(address)
        : address;

      if (!resolvedAddress) {
        throw new Error(`Could not resolve address: ${address}`);
      }

      // Get contract code using debug_getContractCode
      const code = await this.provider.send("debug_getContractCode", [
        resolvedAddress,
      ]);

      // Get runtime code using eth_getCode
      const runtimeCode = await this.provider.getCode(resolvedAddress);

      return {
        content: [
          {
            type: "text",
            text: `Contract Code at ${resolvedAddress}:\n\nDeployed Code:\n${code}\n\nRuntime Code:\n${runtimeCode}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get contract code: ${error.message}`);
      }
      throw error;
    }
  }
}
