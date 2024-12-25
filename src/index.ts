#!/usr/bin/env node
import { MCPServer } from "@modelcontextprotocol/sdk";
import { ENV } from "./config/environment.js";
import { ethereumService } from "./services/ethereum.js";

// Validate environment variables
ENV.validate();

const server = new MCPServer({
  name: "veri5ight",
  version: "0.1.0",
  description: "Ethereum RPC verification bridge for MCP",
});

// Register handlers
server.onQuery("eth_blockNumber", async () => {
  const blockNumber = await ethereumService.getBlockNumber();
  return { blockNumber };
});

server.onQuery("eth_getBalance", async (params) => {
  const [address] = params as [string];
  const balance = await ethereumService.getBalance(address);
  return { balance: balance.toString() };
});

server.onQuery("ens_getName", async (params) => {
  const [address] = params as [string];
  const name = await ethereumService.getENSName(address);
  return { name };
});

// Start server
server.start({
  port: ENV.PORT,
  host: ENV.HOST,
});

console.log(`Veri5ight MCP server running on ${ENV.HOST}:${ENV.PORT}`);
