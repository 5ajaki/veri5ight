// src/index.ts
// ... [previous imports stay the same]
class Veri5ightServer {
    // ... [previous code stays the same] ...
    setupHandlers() {
        // Register available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            console.error("tools/list called"); // Debug log
            const tools = {
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
            };
            console.error("Returning tools:", JSON.stringify(tools, null, 2)); // Debug log
            return tools;
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            console.error("tools/call received:", JSON.stringify(request, null, 2)); // Debug log
            const { name, arguments: toolArgs } = request.params;
            if (name === "ethereum/getENSBalance") {
                const args = toolArgs;
                console.error("Processing ENS balance request for:", args.address); // Debug log
                if (!args?.address) {
                    throw new McpError(ErrorCode.InvalidParams, "Address is required");
                }
                try {
                    // Log provider URL (without sensitive info)
                    console.error("Using provider:", process.env.ETH_NODE_URL?.split("@")[1] || "configured provider");
                    // Resolve ENS name if needed
                    const resolvedAddress = args.address.endsWith(".eth")
                        ? await this.provider.resolveName(args.address)
                        : args.address;
                    console.error("Resolved address:", resolvedAddress); // Debug log
                    if (!resolvedAddress) {
                        throw new Error(`Could not resolve address: ${args.address}`);
                    }
                    // Get ENS balance
                    const balance = await this.ensContract.balanceOf(resolvedAddress);
                    const formattedBalance = ethers.formatUnits(balance, 18);
                    console.error("Got balance:", formattedBalance); // Debug log
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${formattedBalance} ENS`,
                            },
                        ],
                    };
                }
                catch (error) {
                    console.error("Error processing request:", error); // Debug log
                    if (error instanceof Error) {
                        throw new McpError(ErrorCode.InternalError, `Failed to get ENS balance: ${error.message}`);
                    }
                    throw error;
                }
            }
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        });
    }
}
export {};
