#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";
import { config } from "dotenv";
// Load environment variables
config();
class Veri5ightServer {
    constructor() {
        // Initialize server
        this.server = new Server({ name: "veri5ight", version: "1.0.0" }, { capabilities: { tools: {} } });
        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
        this.setupHandlers();
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error("[MCP Error]", error);
        };
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupHandlers() {
        // Register available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
            ],
        }));
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
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
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}
// Create and start server
const server = new Veri5ightServer();
server.run().catch(console.error);
