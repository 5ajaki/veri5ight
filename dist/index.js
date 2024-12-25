#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EthereumService } from "./services/ethereum.js";
// Define schemas
const ListToolsRequestSchema = z.object({
    method: z.literal("tools/list"),
});
const CallToolRequestSchema = z.object({
    method: z.literal("tools/call"),
    params: z.object({
        name: z.string(),
        arguments: z.record(z.any()),
    }),
});
const log = (message) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [Veri5ight Debug] ${message}`);
};
async function main() {
    try {
        process.stdout.write("");
        console.error("Veri5ight MCP Server running on stdio");
        const ethService = new EthereumService();
        log("Ethereum service initialized");
        const server = new Server({
            name: "veri5ight",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        // Tool list handler
        server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "get_ens_balance",
                        description: "Get ENS token balance for an Ethereum address",
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
                        name: "get_proposal_state",
                        description: "Get the current state of an ENS DAO proposal",
                        inputSchema: {
                            type: "object",
                            properties: {
                                proposalId: {
                                    type: "string",
                                    description: "ENS DAO proposal ID",
                                },
                            },
                            required: ["proposalId"],
                        },
                    },
                ],
            };
        });
        // Tool call handler
        server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
            const { name, arguments: args } = request.params;
            if (name === "get_ens_balance") {
                const result = await ethService.getENSBalance(args.address);
                return {
                    _meta: {},
                    content: [
                        {
                            type: "text",
                            text: result.content[0].text,
                        },
                    ],
                };
            }
            else if (name === "get_proposal_state") {
                const result = await ethService.getProposalState(args.proposalId);
                return {
                    _meta: {},
                    content: [
                        {
                            type: "text",
                            text: result.content[0].text,
                        },
                    ],
                };
            }
            throw new Error(`Unknown tool: ${name}`);
        });
        log("Request handlers configured");
        const transport = new StdioServerTransport();
        await server.connect(transport);
        log("Server connected and ready!");
    }
    catch (error) {
        log(`Fatal error: ${error}`);
        console.error(error);
        process.exit(1);
    }
}
process.on("uncaughtException", (error) => {
    log(`Uncaught exception: ${error}`);
    console.error(error);
    process.exit(1);
});
process.on("unhandledRejection", (error) => {
    log(`Unhandled rejection: ${error}`);
    console.error(error);
    process.exit(1);
});
main();
