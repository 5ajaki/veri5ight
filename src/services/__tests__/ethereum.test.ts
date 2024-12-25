import { describe, it, expect, beforeEach, vi } from "vitest";
import { JsonRpcProvider } from "ethers";
import { EthereumService } from "../ethereum.js";

// Mock ethers
vi.mock("ethers", () => ({
  JsonRpcProvider: vi.fn().mockImplementation(() => ({
    getBlockNumber: vi.fn().mockResolvedValue(123456n),
    getBalance: vi.fn().mockResolvedValue(1000000000000000000n),
    lookupAddress: vi.fn().mockResolvedValue("vitalik.eth"),
    resolveName: vi.fn().mockResolvedValue("0x123..."),
  })),
}));

describe("EthereumService", () => {
  let service: EthereumService;

  beforeEach(() => {
    service = new EthereumService();
  });

  it("should initialize with provider", () => {
    expect(service.getProvider()).toBeInstanceOf(JsonRpcProvider);
  });

  it("should get block number", async () => {
    const blockNumber = await service.getBlockNumber();
    expect(blockNumber).toBe(123456n);
  });

  it("should get balance", async () => {
    const balance = await service.getBalance("0x123...");
    expect(balance).toBe(1000000000000000000n);
  });

  it("should get ENS name", async () => {
    const name = await service.getENSName("0x123...");
    expect(name).toBe("vitalik.eth");
  });

  it("should get ENS address", async () => {
    const address = await service.getENSAddress("vitalik.eth");
    expect(address).toBe("0x123...");
  });
});
