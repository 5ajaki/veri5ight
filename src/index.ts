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
    // Initialize server
    this.server = new Server(
      { name: "veri5ight", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    // Initialize provider
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
    // Register available tools with debug logging
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("tools/list called");
      const tools = {
        tools: [
          {
            name: "ping",
            description: "Basic test tool",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "ethereum/getENSBalance",
            description: "Get ENS token balance for an address",
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
      console.error("Registered tools:", JSON.stringify(tools, null, 2));
      return tools;
    });

    // Handle tool calls with debug logging
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error("Received tool call:", JSON.stringify(request, null, 2));
      const { name, arguments: toolArgs } = request.params;

      if (name === "ping") {
        return {
          content: [
            {
              type: "text",
              text: "pong",
            },
          ],
        };
      }

      if (name === "ethereum/getENSBalance") {
        console.error("Validating ENS balance arguments:", toolArgs);

        if (!isENSBalanceArgs(toolArgs)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Invalid arguments for getENSBalance"
          );
        }

        try {
          // Resolve ENS name if needed
          console.error("Resolving address:", toolArgs.address);
          const resolvedAddress = toolArgs.address.endsWith(".eth")
            ? await this.provider.resolveName(toolArgs.address)
            : toolArgs.address;

          console.error("Resolved to:", resolvedAddress);

          if (!resolvedAddress) {
            throw new Error(`Could not resolve address: ${toolArgs.address}`);
          }

          // Get ENS balance
          console.error("Getting balance for:", resolvedAddress);
          const balance = await this.ensContract.balanceOf(resolvedAddress);
          const formattedBalance = ethers.formatUnits(balance, 18);
          console.error("Balance:", formattedBalance);

          return {
            content: [
              {
                type: "text",
                text: `${formattedBalance} ENS`,
              },
            ],
          };
        } catch (error) {
          console.error("Error:", error);
          if (error instanceof Error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to get ENS balance: ${error.message}`
            );
          }
          throw error;
        }
      }

      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
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
