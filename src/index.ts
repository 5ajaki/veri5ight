import { ethers } from "ethers";
import { config } from "dotenv";
config();

// Constants
const ENS_TOKEN = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
const ENS_GOVERNOR = "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3";

// Initialize provider and contracts
const provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
const ensContract = new ethers.Contract(
  ENS_TOKEN,
  ["function balanceOf(address) view returns (uint256)"],
  provider
);
const governorContract = new ethers.Contract(
  ENS_GOVERNOR,
  ["function state(uint256) view returns (uint8)"],
  provider
);

// Core functions
async function getENSBalance(address: string) {
  try {
    const balance = await ensContract.balanceOf(address);
    return ethers.formatUnits(balance, 18);
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function getProposalState(proposalId: string) {
  try {
    const state = await governorContract.state(proposalId);
    return state.toString();
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Request handler
async function handleRequest(data: string) {
  try {
    const request = JSON.parse(data);
    const { method, params, id } = request;

    // All responses must include these JSON-RPC fields
    const baseResponse = {
      jsonrpc: "2.0",
      id: id,
    };

    try {
      switch (method) {
        case "tools/list":
          return {
            ...baseResponse,
            result: {
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
            },
          };

        case "tools/call":
          const { name, arguments: args } = params;
          let result;

          if (name === "get_ens_balance") {
            result = await getENSBalance(args.address);
          } else if (name === "get_proposal_state") {
            result = await getProposalState(args.proposalId);
          } else {
            throw new Error(`Unknown tool: ${name}`);
          }

          return {
            ...baseResponse,
            result: {
              _meta: {},
              content: [{ type: "text", text: result }],
            },
          };

        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      return {
        ...baseResponse,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  } catch (parseError) {
    return {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error",
      },
    };
  }
}

// Main process
process.stdout.write(""); // Initial empty write
console.error("Veri5ight MCP Server running");

process.stdin.setEncoding("utf8");
process.stdin.on("data", async (data) => {
  const response = await handleRequest(data.toString());
  process.stdout.write(JSON.stringify(response) + "\n");
});

// Basic error handling
process.on("uncaughtException", (error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
