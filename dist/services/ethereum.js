import { ethers } from "ethers";
import { config } from "../config/environment.js";
// ENS DAO Contract addresses
const ENS_TOKEN_ADDRESS = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
const ENS_GOVERNANCE_ADDRESS = "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3";
export class EthereumService {
    provider;
    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.ethereumNode.url);
    }
    async getENSBalance(address) {
        const ensContract = new ethers.Contract(ENS_TOKEN_ADDRESS, ["function balanceOf(address) view returns (uint256)"], this.provider);
        const balance = await ensContract.balanceOf(address);
        return ethers.formatUnits(balance, 18); // ENS has 18 decimals
    }
    async getProposalState(proposalId) {
        const governanceContract = new ethers.Contract(ENS_GOVERNANCE_ADDRESS, ["function state(uint256) view returns (uint8)"], this.provider);
        return await governanceContract.state(proposalId);
    }
}
// Export singleton instance
export const ethereumService = new EthereumService();
