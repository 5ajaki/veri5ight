#!/usr/bin/env node
import { ethers } from "ethers";
import { config } from "dotenv";
// Debug logging helper
function log(message) {
    console.error(`[Veri5ight Debug] ${message}`);
}
// Start logging immediately
log("Starting server initialization...");
// Load environment variables
config();
log("Environment loaded");
if (!process.env.ETH_NODE_URL) {
    log("ERROR: ETH_NODE_URL not found in environment");
    process.exit(1);
}
// Initialize provider
log("Initializing provider...");
const provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
log("Provider initialized");
// Constants
const ENS_TOKEN = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
const ensContract = new ethers.Contract(ENS_TOKEN, ["function balanceOf(address) view returns (uint256)"], provider);
log("Contracts initialized");
// Function to get ENS balance
async function getENSBalance(address) {
    log(`Getting balance for ${address}`);
    try {
        const balance = await ensContract.balanceOf(address);
        const formatted = ethers.formatUnits(balance, 18);
        log(`Balance retrieved: ${formatted}`);
        return formatted;
    }
    catch (err) {
        const error = err;
        log(`Error getting balance: ${error.message}`);
        throw new Error(`Failed to get balance: ${error.message}`);
    }
}
// Request handler
async function handleRequest(data) {
    log(`Received request: ${data}`);
    try {
        const request = JSON.parse(data);
        const baseResponse = {
            jsonrpc: "2.0",
            id: request.id || "1",
            method: request.method,
        };
        if (request.method === "tools/list") {
            log("Processing tools/list request");
            return {
                ...baseResponse,
                result: {
                    tools: [
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
                },
            };
        }
        if (request.method === "tools/call") {
            log(`Processing tools/call request for ${request.params?.name}`);
            if (request.params.name === "get_ens_balance") {
                try {
                    const balance = await getENSBalance(request.params.arguments.address);
                    return {
                        ...baseResponse,
                        result: {
                            _meta: {},
                            content: [
                                {
                                    type: "text",
                                    text: balance,
                                },
                            ],
                        },
                    };
                }
                catch (err) {
                    const error = err;
                    log(`Error getting balance: ${error.message}`);
                    throw new Error(`Failed to get balance: ${error.message}`);
                }
            }
        }
        log(`Unknown method: ${request.method}`);
        return {
            ...baseResponse,
            error: {
                code: -32601,
                message: "Method not found",
            },
        };
    }
    catch (err) {
        const error = err;
        log(`Error processing request: ${error.message}`);
        return {
            jsonrpc: "2.0",
            id: null,
            result: {
                status: "error",
                message: error.message || "Unknown error",
            },
        };
    }
}
// Server setup
log("Setting up server...");
// Critical: first write must be empty
process.stdout.write("");
log("Initial empty write completed");
process.stdin.setEncoding("utf8");
log("stdin encoding set to utf8");
process.stdin.on("data", async (chunk) => {
    log("Received data chunk");
    const response = await handleRequest(chunk.toString());
    log(`Sending response: ${JSON.stringify(response)}`);
    process.stdout.write(JSON.stringify(response) + "\n");
});
log("Data handler registered");
// Error handling
try {
    process.on("uncaughtException", (err) => {
        const error = err;
        log(`FATAL ERROR: ${error.message}`);
        console.error("Fatal:", error);
        process.exit(1);
    });
    log("Error handler registered");
}
catch (err) {
    const error = err;
    log(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
}
log("Server initialization complete - ready for requests");
