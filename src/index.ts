#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";
import { config } from "dotenv";

// Load environment variables
config();

// Constants
const ENS_TOKEN = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";

interface ENSBalanceArgs {
  address: string;
}

// Type guard for ENSBalanceArgs
function isENSBalanceArgs(args: unknown): args is ENSBalanceArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "address" in args &&
    typeof (args as ENSBalanceArgs).address === "string"
  );
}

class Veri5ightServer {
  private server: Server;
  private provider: ethers.JsonRpcProvider;
  private ensContract: ethers.Contract;

  constructor() {
    console.error("Initializing Veri5ight server...");
    // Initialize server
    this.server = new Server(
      { name: "veri5ight", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    console.error("Server instance created");

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
    console.error("Provider initialized with URL:", process.env.ETH_NODE_URL);

    this.ensContract = new ethers.Contract(
      ENS_TOKEN,
      ["function balanceOf(address) view returns (uint256)"],
      this.provider
    );
    console.error("ENS contract initialized");

    this.setupHandlers();
    this.setupErrorHandling();
    console.error("Server setup complete");
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
    // Register available tools with debug logging
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("tools/list called");
      const tools = {
        tools: [
          {
            name: "ping",
            description: "Basic test tool",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
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
            parameters: {
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
      console.error("Sending tools response:", JSON.stringify(tools, null, 2));
      return tools;
    });

    // Handle tool calls with debug logging
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error("Tool call received:", JSON.stringify(request, null, 2));

      if (request.params.name === "ping") {
        return {
          content: [
            {
              type: "text",
              text: "pong",
            },
          ],
        };
      }

      if (request.params.name === "ethereum_getENSBalance") {
        try {
          const address = request.params.arguments?.address;
          if (!address) {
            throw new Error("Address is required");
          }

          const balance = await this.ensContract.balanceOf(address);
          console.error("ENS balance retrieved:", balance.toString());

          return {
            content: [
              {
                type: "text",
                text: `ENS Balance for ${address}: ${balance.toString()} tokens`,
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

      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  async run(): Promise<void> {
    console.error("Starting server...");
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Server connected and running");
  }
}

// Create and start server
const server = new Veri5ightServer();
server.run().catch(console.error);
