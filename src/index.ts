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
import fetch from 'node-fetch';

// Load environment variables
config();

const SAFE_API_URL = process.env.SAFE_API_URL || 'https://safe-transaction-mainnet.safe.global/api/v1';

class Veri5ightServer {
  private server: Server;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Initialize server
    this.server = new Server(
      { name: "veri5ight", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);

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

  private async getSafeTransactions(address: string, limit: number = 100, offset: number = 0) {
    const response = await fetch(
      `${SAFE_API_URL}/safes/${address}/all-transactions/?limit=${limit}&offset=${offset}`
    );
    
    if (!response.ok) {
      throw new McpError(ErrorCode.ExecutionError, `Failed to fetch Safe transactions: ${response.statusText}`);
    }
    
    return await response.json();
  }

  private async getMultisigTransaction(safeTxHash: string) {
    const response = await fetch(
      `${SAFE_API_URL}/multisig-transactions/${safeTxHash}/`
    );
    
    if (!response.ok) {
      throw new McpError(ErrorCode.ExecutionError, `Failed to fetch multisig transaction: ${response.statusText}`);
    }
    
    return await response.json();
  }

  private async decodeTransactionData(data: string, to?: string) {
    const response = await fetch(`${SAFE_API_URL}/data-decoder/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, to }),
    });
    
    if (!response.ok) {
      throw new McpError(ErrorCode.ExecutionError, `Failed to decode transaction data: ${response.statusText}`);
    }
    
    return await response.json();
  }

  private setupHandlers(): void {
    // Register available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "getSafeTransactions",
          description: "Get all transactions for a Safe address",
          parameters: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "Safe address",
              },
              limit: {
                type: "number",
                description: "Number of transactions to return (default: 100)",
              },
              offset: {
                type: "number",
                description: "Pagination offset (default: 0)",
              },
            },
            required: ["address"],
          },
        },
        {
          name: "getMultisigTransaction",
          description: "Get details of a specific multisig transaction",
          parameters: {
            type: "object",
            properties: {
              safeTxHash: {
                type: "string",
                description: "Safe transaction hash",
              },
            },
            required: ["safeTxHash"],
          },
        },
        {
          name: "decodeTransactionData",
          description: "Decode transaction data using Safe API",
          parameters: {
            type: "object",
            properties: {
              data: {
                type: "string",
                description: "Transaction data (hex)",
              },
              to: {
                type: "string",
                description: "Optional contract address",
              },
            },
            required: ["data"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "getSafeTransactions": {
            const { address, limit, offset } = args;
            const result = await this.getSafeTransactions(address, limit, offset);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "getMultisigTransaction": {
            const { safeTxHash } = args;
            const result = await this.getMultisigTransaction(safeTxHash);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "decodeTransactionData": {
            const { data, to } = args;
            const result = await this.decodeTransactionData(data, to);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.ExecutionError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Create and start server
const server = new Veri5ightServer();
server.run().catch(console.error);
