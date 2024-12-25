#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EthereumService } from "./services/ethereum.js";
// Define our request schemas
const GetENSBalanceSchema = z.object({
    method: z.literal("ethereum/getENSBalance"),
    params: z.object({
        address: z.string(),
    }),
});
const GetProposalStateSchema = z.object({
    method: z.literal("ethereum/getProposalState"),
    params: z.object({
        proposalId: z.string(),
    }),
});
// Add debug logging with timestamp
const log = (message) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [Veri5ight Debug] ${message}`);
};
async function main() {
    try {
        // Clear stdout first
        process.stdout.write("");
        // All logging to stderr
        console.error("Veri5ight MCP Server running on stdio");
        const ethService = new EthereumService();
        log("Ethereum service initialized");
        const serverConfig = {
            name: "veri5ight",
            version: "1.0.0",
        };
        const capabilities = {
            capabilities: {
                tools: {
                    "ethereum/getENSBalance": {
                        name: "ethereum/getENSBalance",
                        description: "Get ENS token balance for an Ethereum address",
                        parameters: {
                            type: "object",
                            properties: {
                                address: {
                                    type: "string",
                                    description: "Ethereum address or ENS name",
                                    examples: [
                                        "vitalik.eth",
                                        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
                                    ],
                                },
                            },
                            required: ["address"],
                            additionalProperties: false,
                        },
                    },
                    "ethereum/getProposalState": {
                        name: "ethereum/getProposalState",
                        description: "Get the current state of an ENS DAO proposal",
                        parameters: {
                            type: "object",
                            properties: {
                                proposalId: {
                                    type: "string",
                                    description: "ENS DAO proposal ID",
                                    examples: ["1", "2"],
                                },
                            },
                            required: ["proposalId"],
                            additionalProperties: false,
                        },
                    },
                },
            },
        };
        const server = new Server(serverConfig, capabilities);
        log("Server created");
        // Set up request handlers
        server.setRequestHandler(GetENSBalanceSchema, async (request) => {
            log(`Handling ENS balance request for address: ${request.params.address}`);
            const result = await ethService.getENSBalance(request.params.address);
            return { balance: result.content[0].text };
        });
        server.setRequestHandler(GetProposalStateSchema, async (request) => {
            log(`Handling proposal state request for ID: ${request.params.proposalId}`);
            const result = await ethService.getProposalState(request.params.proposalId);
            return { state: parseInt(result.content[0].text) };
        });
        log("Request handlers configured");
        // Connect using stdio transport
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
// Add global error handlers
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
