#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
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
    constructor() {
        console.error("Initializing Veri5ight server...");
        this.server = new Server({ name: "veri5ight", version: "1.0.0" }, { capabilities: { tools: {} } });
        this.provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
        this.ensContract = new ethers.Contract(ENS_TOKEN, ["function balanceOf(address) view returns (uint256)"], this.provider);
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
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            console.error("tools/list called");
            return {
                tools: [
                    {
                        name: "ethereum_getRecentTransactions",
                        description: "Get recent transactions for an Ethereum address",
                        inputSchema: {
                            type: "object",
                            properties: {
                                address: {
                                    type: "string",
                                    description: "Ethereum address or ENS name",
                                },
                                limit: {
                                    type: "number",
                                    description: "Number of transactions to return (default: 3)",
                                },
                            },
                            required: ["address"],
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
                    {
                        name: "ethereum_getTransactionInfo",
                        description: "Get detailed information about an Ethereum transaction",
                        inputSchema: {
                            type: "object",
                            properties: {
                                hash: {
                                    type: "string",
                                    description: "Transaction hash",
                                },
                            },
                            required: ["hash"],
                        },
                    },
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            console.error("Tool call received:", JSON.stringify(request, null, 2));
            switch (request.params.name) {
                case "ethereum_getRecentTransactions":
                    return await this.handleGetRecentTransactions(request);
                case "ethereum_getENSBalance":
                    return await this.handleGetENSBalance(request);
                case "ethereum_getContractInfo":
                    return await this.handleGetContractInfo(request);
                case "ethereum_getENSDelegation":
                    return await this.handleGetENSDelegation(request);
                case "ethereum_getTransactionInfo":
                    return await this.handleGetTransactionInfo(request);
                default:
                    throw new Error(`Unknown tool: ${request.params.name}`);
            }
        });
    }
    async handleGetRecentTransactions(request) {
        try {
            const address = request.params.arguments?.address;
            const limit = request.params.arguments?.limit || 3;
            if (!address) {
                throw new Error("Address is required");
            }
            // Get latest block number
            const latestBlock = await this.provider.getBlockNumber();
            const transactions = [];
            // Scan recent blocks for transactions
            for (let i = 0; i < 10 && transactions.length < limit; i++) {
                const block = (await this.provider.getBlock(latestBlock - i, true));
                if (!block || !block.transactions)
                    continue;
                const addressTxs = block.transactions.filter((tx) => tx.from?.toLowerCase() === address.toLowerCase() ||
                    tx.to?.toLowerCase() === address.toLowerCase());
                transactions.push(...addressTxs.slice(0, limit - transactions.length));
                if (transactions.length >= limit)
                    break;
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `Recent transactions for ${address}:\n` +
                            transactions
                                .map((tx, i) => `${i + 1}. Hash: ${tx.hash}\n` +
                                `   From: ${tx.from}\n` +
                                `   To: ${tx.to}\n` +
                                `   Value: ${ethers.formatEther(tx.value)} ETH`)
                                .join("\n\n"),
                    },
                ],
            };
        }
        catch (error) {
            console.error("Error getting recent transactions:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return {
                content: [
                    {
                        type: "text",
                        text: `Error getting recent transactions: ${errorMessage}`,
                    },
                ],
            };
        }
    }
    async handleGetENSBalance(request) {
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
        }
        catch (error) {
            console.error("Error getting ENS balance:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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
    async handleGetContractInfo(request) {
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
                const contract = new ethers.Contract(address, ENS_EXTENDED_ABI, this.provider);
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
• Total Supply: ${totalSupply
                        ? ethers.formatUnits(totalSupply, decimals || 18)
                        : "N/A"} ${symbol || ""}`;
                }
            }
            catch (error) {
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
        }
        catch (error) {
            console.error("Error getting contract info:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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
    async handleGetENSDelegation(request) {
        try {
            const address = request.params.arguments?.address;
            if (!address) {
                throw new Error("Address is required");
            }
            const ensContract = new ethers.Contract(ENS_TOKEN, ENS_EXTENDED_ABI, this.provider);
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
        }
        catch (error) {
            console.error("Error getting ENS delegation:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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
    async handleGetTransactionInfo(request) {
        try {
            const hash = request.params.arguments?.hash;
            if (!hash) {
                throw new Error("Transaction hash is required");
            }
            // Log the network we're connected to
            const network = await this.provider.getNetwork();
            console.error(`Looking up transaction on network: ${network.name} (chainId: ${network.chainId})`);
            // Get transaction and receipt in parallel
            const [tx, receipt] = await Promise.all([
                this.provider.getTransaction(hash).catch((error) => {
                    console.error(`Error fetching transaction: ${error.message}`);
                    return null;
                }),
                this.provider.getTransactionReceipt(hash).catch((error) => {
                    console.error(`Error fetching receipt: ${error.message}`);
                    return null;
                }),
            ]);
            if (!tx) {
                throw new Error(`Transaction not found. Please verify:
1. The transaction hash is correct
2. The transaction exists on network ${network.name}
3. Your node is fully synced`);
            }
            // Format values
            const value = tx.value ? ethers.formatEther(tx.value) : "0";
            const gasPrice = tx.gasPrice
                ? ethers.formatUnits(tx.gasPrice, "gwei")
                : "unknown";
            const status = receipt
                ? receipt.status === 1
                    ? "Success"
                    : "Failed"
                : "Pending";
            const gasUsed = receipt ? receipt.gasUsed.toString() : "unknown";
            // Get any contract interaction data
            let methodInfo = "";
            if (tx.data && tx.data !== "0x") {
                try {
                    methodInfo = `\n• Input Data: ${tx.data}`;
                }
                catch (error) {
                    console.error("Error decoding transaction data:", error);
                }
            }
            // Format event logs
            let eventLogs = "";
            if (receipt && receipt.logs.length > 0) {
                eventLogs = "\n\nEvent Logs:";
                for (const log of receipt.logs) {
                    try {
                        eventLogs += `\n• From Contract: ${log.address}`;
                        eventLogs += `\n  Topics: ${log.topics.join(", ")}`;
                        if (log.data && log.data !== "0x") {
                            eventLogs += `\n  Data: ${log.data}`;
                        }
                    }
                    catch (error) {
                        console.error("Error processing log:", error);
                    }
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `Transaction Information for ${hash}:
• Status: ${status}
• From: ${tx.from}
• To: ${tx.to || "Contract Creation"}
• Value: ${value} ETH
• Gas Price: ${gasPrice} Gwei
• Gas Used: ${gasUsed}
• Block Number: ${tx.blockNumber || "Pending"}${methodInfo}${eventLogs}`,
                    },
                ],
            };
        }
        catch (error) {
            console.error("Error getting transaction info:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return {
                content: [
                    {
                        type: "text",
                        text: `Error getting transaction info: ${errorMessage}`,
                    },
                ],
            };
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Server connected and running");
    }
}
// Create and start server
const server = new Veri5ightServer();
server.run().catch(console.error);
