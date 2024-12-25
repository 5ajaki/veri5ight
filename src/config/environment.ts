import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..", "..");

class Environment {
  readonly NODE_ENV: string;
  readonly ETH_RPC_URL: string;
  readonly PORT: number;
  readonly HOST: string;
  readonly ROOT_DIR: string;

  constructor() {
    this.NODE_ENV = process.env.NODE_ENV || "development";
    this.ETH_RPC_URL = process.env.ETH_RPC_URL || "";
    this.PORT = parseInt(process.env.PORT || "3000", 10);
    this.HOST = process.env.HOST || "localhost";
    this.ROOT_DIR = ROOT_DIR;
  }

  validate(): void {
    if (!this.ETH_RPC_URL) {
      throw new Error("ETH_RPC_URL environment variable is required");
    }
  }
}

export const ENV = new Environment();
