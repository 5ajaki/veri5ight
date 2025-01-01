#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";
import { config } from "dotenv";

// Load environment variables
config();

// Constants
const ENS_TOKEN = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
const ENS_EXTENDED_ABI = [
  // Standard ERC20
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  // Delegation specific
  "function delegates(address) view returns (address)",
  "function getVotes(address) view returns (uint256)",
];

class Veri5ightServer {
  private server: Server;
  private provider: ethers.JsonRpcProvider;
  private ensContract: ethers.Contract;

  constructor() {
    console.error("Initializing Veri5ight server...");
    this.server = new Server(
      { name: "veri5ight", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    this.provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
    this.ensContract = new ethers.Contract(
      ENS_TOKEN,
      ["function balanceOf(address) view returns (uint256)"],
      this.provider
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("tools/list called");
      return {
        tools: [
          {
            name: "ethereum_getENSBalance",
            description: "Get ENS token balance for an address",
            inputSchema: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description: "Ethereum address or ENS name",
                },
              },
              required: ["address"],
            },
          },
          {
            name: "ethereum_getContractInfo",
            description: "Get information about any contract",
            inputSchema: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description: "Contract address or ENS name",
                },
              },
              required: ["address"],
            },
          },
          {
            name: "ethereum_getENSDelegation",
            description: "Get ENS delegation info for an address",
            inputSchema: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description: "Ethereum address or ENS name",
                },
              },
              required: ["address"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error("Tool call received:", JSON.stringify(request, null, 2));

      switch (request.params.name) {
        case "ethereum_getENSBalance":
          return await this.handleGetENSBalance(request);
        case "ethereum_getContractInfo":
          return await this.handleGetContractInfo(request);
        case "ethereum_getENSDelegation":
          return await this.handleGetENSDelegation(request);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async handleGetENSBalance(request: any) {
    try {
      const address = request.params.arguments?.address;
      if (!address) {
        throw new Error("Address is required");
      }

      const balance = await this.ensContract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(balance, 18); // ENS uses 18 decimals
      console.error("ENS balance retrieved:", formattedBalance);

      return {
        content: [
          {
            type: "text",
            text: `ENS Balance for ${address}: ${formattedBalance} ENS tokens`,
          },
        ],
      };
    } catch (error: unknown) {
      console.error("Error getting ENS balance:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error getting ENS balance: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async handleGetContractInfo(request: any) {
    try {
      const address = request.params.arguments?.address;
      if (!address) {
        throw new Error("Address is required");
      }

      // Get basic contract info
      const code = await this.provider.getCode(address);
      if (code === "0x") {
        throw new Error("No contract found at this address");
      }

      // Try to get ERC20 info if available
      let tokenInfo = "";
      try {
        const contract = new ethers.Contract(
          address,
          ENS_EXTENDED_ABI,
          this.provider
        );
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          contract.name().catch(() => null),
          contract.symbol().catch(() => null),
          contract.decimals().catch(() => null),
          contract.totalSupply().catch(() => null),
        ]);

        if (name || symbol || decimals || totalSupply) {
          tokenInfo = `\n\nERC20 Token Information:
• Name: ${name || "N/A"}
• Symbol: ${symbol || "N/A"}
• Decimals: ${decimals || "N/A"}
• Total Supply: ${
            totalSupply
              ? ethers.formatUnits(totalSupply, decimals || 18)
              : "N/A"
          } ${symbol || ""}`;
        }
      } catch (error) {
        console.error("Not an ERC20 token or error getting token info:", error);
      }

      return {
        content: [
          {
            type: "text",
            text: `Contract Information for ${address}:
• Bytecode Size: ${(code.length - 2) / 2} bytes
• Contract Address: ${address}${tokenInfo}`,
          },
        ],
      };
    } catch (error: unknown) {
      console.error("Error getting contract info:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error getting contract info: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async handleGetENSDelegation(request: any) {
    try {
      const address = request.params.arguments?.address;
      if (!address) {
        throw new Error("Address is required");
      }

      const ensContract = new ethers.Contract(
        ENS_TOKEN,
        ENS_EXTENDED_ABI,
        this.provider
      );

      const [delegate, votingPower] = await Promise.all([
        ensContract.delegates(address),
        ensContract.getVotes(address),
      ]);

      const formattedVotingPower = ethers.formatUnits(votingPower, 18);

      return {
        content: [
          {
            type: "text",
            text: `ENS Delegation Info for ${address}:
• Delegated To: ${delegate === ethers.ZeroAddress ? "No delegation" : delegate}
• Voting Power: ${formattedVotingPower} ENS`,
          },
        ],
      };
    } catch (error: unknown) {
      console.error("Error getting ENS delegation:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error getting ENS delegation: ${errorMessage}`,
          },
        ],
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Server connected and running");
  }
}

// Create and start server
const server = new Veri5ightServer();
server.run().catch(console.error);
