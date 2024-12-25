#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EthereumService } from "./services/ethereum.js";
import { config } from "./config/environment.js";
import {
  BalanceResponseSchema,
  ProposalStateResponseSchema,
  MCPRequest,
} from "./types.js";

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

// Add debug logging
const log = (message: string) => {
  console.error(`[Veri5ight Debug] ${message}`);
};

async function main() {
  log("Starting Veri5ight server...");

  const ethService = new EthereumService();
  log("Ethereum service initialized");

  const serverConfig = {
    name: config.server.name,
    version: config.server.version,
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
          },
        },
      },
    },
  };

  log(`Server config: ${JSON.stringify(serverConfig)}`);
  log(`Capabilities: ${JSON.stringify(capabilities)}`);

  const server = new Server(serverConfig, capabilities);
  log("Server created with tools configured");

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
  log("Connecting to transport...");

  await server.connect(transport);
  log("Server connected and ready!");
}

main().catch((error) => {
  log(`Server error: ${error}`);
  console.error(error);
  process.exit(1);
});
