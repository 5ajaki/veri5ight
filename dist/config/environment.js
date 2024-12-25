import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
// Load environment variables
dotenvConfig();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..", "..");
export const config = {
    // Ethereum node configuration
    ethereumNode: {
        url: process.env.ETHEREUM_NODE_URL || "http://nethermind.public.dappnode:8545",
    },
    // Server configuration
    server: {
        name: "veri5ight",
        version: "0.1.0",
    },
};
// Validate required environment variables
export function validateConfig() {
    if (!process.env.ETHEREUM_NODE_URL) {
        console.warn("ETHEREUM_NODE_URL not set, using default dappnode URL");
    }
}
