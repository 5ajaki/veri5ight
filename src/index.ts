#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EthereumService } from "./services/ethereum.js";
import { config } from "./config/environment.js";

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

async function main() {
  // Initialize our Ethereum service
  const ethService = new EthereumService();

  // Create the MCP server
  const server = new Server(
    {
      name: config.server.name,
      version: config.server.version,
    },
    {
      capabilities: {
        tools: {}, // We'll expose our Ethereum interactions as tools
      },
    }
  );

  // Set up request handlers
  server.setRequestHandler(GetENSBalanceSchema, async (request) => {
    const balance = await ethService.getENSBalance(request.params.address);
    return { balance };
  });

  server.setRequestHandler(GetProposalStateSchema, async (request) => {
    const state = await ethService.getProposalState(request.params.proposalId);
    return { state };
  });

  // Connect using stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
