import { EthereumService } from "./services/ethereum.js";

async function testConnection() {
  try {
    const ethService = new EthereumService();

    // Test basic connection by getting latest block number
    const blockNumber = await ethService.provider.getBlockNumber();
    console.log("Successfully connected to Ethereum node!");
    console.log("Current block number:", blockNumber);

    // Test ENS balance check (using vitalik.eth's address as an example)
    const vitalikAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    const ensBalance = await ethService.getENSBalance(vitalikAddress);
    console.log("Vitalik ENS balance:", ensBalance);
  } catch (error) {
    console.error("Failed to connect to Ethereum node:", error);
  }
}

testConnection();
