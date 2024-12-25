import { describe, it, expect, beforeEach, afterEach } from "vitest";
describe("Environment Configuration", () => {
    const originalEnv = process.env;
    beforeEach(() => {
        // Clear module cache to ensure fresh ENV object
        jest.resetModules();
        // Create clean process.env
        process.env = { ...originalEnv };
    });
    afterEach(() => {
        // Restore original env
        process.env = originalEnv;
    });
    it("should load default values when no env variables set", async () => {
        const { ENV } = await import("../environment.js");
        expect(ENV.NODE_ENV).toBe("development");
        expect(ENV.PORT).toBe(3000);
        expect(ENV.HOST).toBe("localhost");
    });
    it("should throw error when ETH_RPC_URL is missing", async () => {
        const { ENV } = await import("../environment.js");
        expect(() => ENV.validate()).toThrow("ETH_RPC_URL environment variable is required");
    });
    it("should load custom values from environment variables", async () => {
        process.env.NODE_ENV = "production";
        process.env.ETH_RPC_URL = "https://eth-mainnet.example.com";
        process.env.PORT = "4000";
        process.env.HOST = "0.0.0.0";
        const { ENV } = await import("../environment.js");
        expect(ENV.NODE_ENV).toBe("production");
        expect(ENV.ETH_RPC_URL).toBe("https://eth-mainnet.example.com");
        expect(ENV.PORT).toBe(4000);
        expect(ENV.HOST).toBe("0.0.0.0");
    });
});
