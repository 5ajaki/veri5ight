#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";
import { config } from "dotenv";
// Load environment variables
config();
// Standard interfaces
const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
];
const GOVERNANCE_ABI = [
    "function delegates(address) view returns (address)",
    "function getVotes(address) view returns (uint256)",
];
class Veri5ightServer {
    constructor() {
        console.error("Initializing Veri5ight server...");
        this.server = new Server({ name: "veri5ight", version: "1.0.0" }, { capabilities: { tools: {} } });
        this.provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
        this.setupHandlers();
        this.setupErrorHandling();
    }
    async resolveAddress(addressOrENS) {
        try {
            // Check if it's an ENS name (ends in .eth)
            if (addressOrENS.toLowerCase().endsWith(".eth")) {
                const resolvedAddress = await this.provider.resolveName(addressOrENS);
                if (!resolvedAddress) {
                    throw new Error(`Could not resolve ENS name: ${addressOrENS}`);
                }
                console.error(`Resolved ${addressOrENS} to ${resolvedAddress}`);
                return resolvedAddress;
            }
            // If it's not an ENS name, return as is
            return addressOrENS;
        }
        catch (error) {
            console.error(`Error resolving address: ${error}`);
            throw error;
        }
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
                        name: "ethereum_getTokenBalance",
                        description: "Get ERC20 token balance for an address",
                        inputSchema: {
                            type: "object",
                            properties: {
                                address: {
                                    type: "string",
                                    description: "Ethereum address or ENS name",
                                },
                                token: {
                                    type: "string",
                                    description: "Token contract address or ENS name",
                                },
                            },
                            required: ["address", "token"],
                        },
                    },
                    {
                        name: "ethereum_getTokenDelegation",
                        description: "Get delegation info for an ERC20 governance token",
                        inputSchema: {
                            type: "object",
                            properties: {
                                address: {
                                    type: "string",
                                    description: "Ethereum address or ENS name",
                                },
                                token: {
                                    type: "string",
                                    description: "Token contract address or ENS name",
                                },
                            },
                            required: ["address", "token"],
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
                case "ethereum_getTokenBalance":
                    return await this.handleGetTokenBalance(request);
                case "ethereum_getTokenDelegation":
                    return await this.handleGetTokenDelegation(request);
                case "ethereum_getContractInfo":
                    return await this.handleGetContractInfo(request);
                case "ethereum_getTransactionInfo":
                    return await this.handleGetTransactionInfo(request);
                default:
                    throw new Error(`Unknown tool: ${request.params.name}`);
            }
        });
    }
    async handleGetTokenBalance(request) {
        try {
            const addressOrENS = request.params.arguments?.address;
            const tokenAddressOrENS = request.params.arguments?.token;
            if (!addressOrENS || !tokenAddressOrENS) {
                throw new Error("Address and token address are required");
            }
            // Resolve both addresses if they are ENS names
            const [address, tokenAddress] = await Promise.all([
                this.resolveAddress(addressOrENS),
                this.resolveAddress(tokenAddressOrENS),
            ]);
            // Create contract instance
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
            // Get decimals and balance
            const [decimals, balance, symbol] = await Promise.all([
                tokenContract.decimals(),
                tokenContract.balanceOf(address),
                tokenContract.symbol(),
            ]);
            const formattedBalance = ethers.formatUnits(balance, decimals);
            return {
                content: [
                    {
                        type: "text",
                        text: `Token Balance for ${addressOrENS}: ${formattedBalance} ${symbol}`,
                    },
                ],
            };
        }
        catch (error) {
            console.error("Error getting token balance:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return {
                content: [
                    {
                        type: "text",
                        text: `Error getting token balance: ${errorMessage}`,
                    },
                ],
            };
        }
    }
    async handleGetTokenDelegation(request) {
        try {
            const addressOrENS = request.params.arguments?.address;
            const tokenAddressOrENS = request.params.arguments?.token;
            if (!addressOrENS || !tokenAddressOrENS) {
                throw new Error("Address and token address are required");
            }
            // Resolve both addresses if they are ENS names
            const [address, tokenAddress] = await Promise.all([
                this.resolveAddress(addressOrENS),
                this.resolveAddress(tokenAddressOrENS),
            ]);
            // Create contract instance with both ERC20 and governance functions
            const tokenContract = new ethers.Contract(tokenAddress, [...ERC20_ABI, ...GOVERNANCE_ABI], this.provider);
            // Check if contract supports delegation
            try {
                const [delegate, votingPower, decimals, symbol] = await Promise.all([
                    tokenContract.delegates(address),
                    tokenContract.getVotes(address),
                    tokenContract.decimals(),
                    tokenContract.symbol(),
                ]);
                const formattedVotingPower = ethers.formatUnits(votingPower, decimals);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Token Delegation Info for ${addressOrENS}:
• Delegated To: ${delegate === ethers.ZeroAddress ? "No delegation" : delegate}
• Voting Power: ${formattedVotingPower} ${symbol}`,
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Token at ${tokenAddressOrENS} does not support delegation.`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            console.error("Error getting token delegation:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return {
                content: [
                    {
                        type: "text",
                        text: `Error getting token delegation: ${errorMessage}`,
                    },
                ],
            };
        }
    }
    async handleGetRecentTransactions(request) {
        try {
            const addressOrENS = request.params.arguments?.address;
            const limit = request.params.arguments?.limit || 3;
            if (!addressOrENS) {
                throw new Error("Address is required");
            }
            // Resolve ENS name if needed
            const address = await this.resolveAddress(addressOrENS);
            // Get current block
            const currentBlock = await this.provider.getBlockNumber();
            const transactions = [];
            // Look through last 10 blocks
            for (let i = 0; i < 10 && transactions.length < limit; i++) {
                const block = await this.provider.getBlock(currentBlock - i, true);
                if (!block || !block.transactions)
                    continue;
                // Filter transactions involving our address
                const relevantTxs = block.transactions.filter((tx) => tx.from.toLowerCase() === address.toLowerCase() ||
                    (tx.to && tx.to.toLowerCase() === address.toLowerCase()));
                transactions.push(...relevantTxs.slice(0, limit - transactions.length));
            }
            if (transactions.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No recent transactions found for ${addressOrENS} in the last 10 blocks.`,
                        },
                    ],
                };
            }
            const txDetails = await Promise.all(transactions.map(async (tx) => {
                const receipt = await this.provider.getTransactionReceipt(tx.hash);
                const status = receipt ? (receipt.status === 1 ? "✅" : "❌") : "⏳";
                return `${status} ${tx.hash}
• From: ${tx.from}
• To: ${tx.to || "Contract Creation"}
• Value: ${ethers.formatEther(tx.value)} ETH
• Gas Used: ${receipt ? receipt.gasUsed.toString() : "pending"}`;
            }));
            return {
                content: [
                    {
                        type: "text",
                        text: `Recent transactions for ${addressOrENS}:\n\n${txDetails.join("\n\n")}`,
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
    async handleGetContractInfo(request) {
        try {
            const addressOrENS = request.params.arguments?.address;
            if (!addressOrENS) {
                throw new Error("Address is required");
            }
            // Resolve ENS name if needed
            const address = await this.resolveAddress(addressOrENS);
            // Rest of the function remains the same
            const code = await this.provider.getCode(address);
            const isContract = code !== "0x";
            if (!isContract) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `${addressOrENS} is not a contract address.`,
                        },
                    ],
                };
            }
            // Get contract info
            const [balance, transactionCount] = await Promise.all([
                this.provider.getBalance(address),
                this.provider.getTransactionCount(address),
            ]);
            return {
                content: [
                    {
                        type: "text",
                        text: `Contract Info for ${addressOrENS}:
• Address: ${address}
• Balance: ${ethers.formatEther(balance)} ETH
• Transaction Count: ${transactionCount}
• Code Size: ${(code.length - 2) / 2} bytes`,
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
            // Resolve ENS names in parallel
            const [fromENS, toENS] = await Promise.all([
                tx.from ? this.provider.lookupAddress(tx.from).catch(() => null) : null,
                tx.to ? this.provider.lookupAddress(tx.to).catch(() => null) : null,
            ]);
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
            // Format event logs with ENS resolution
            let eventLogs = "";
            if (receipt && receipt.logs.length > 0) {
                eventLogs = "\n\nEvent Logs:";
                for (const log of receipt.logs) {
                    try {
                        const contractENS = await this.provider
                            .lookupAddress(log.address)
                            .catch(() => null);
                        eventLogs += `\n• From Contract: ${contractENS || log.address}`;
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
• From: ${fromENS || tx.from}
• To: ${toENS || tx.to || "Contract Creation"}
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
