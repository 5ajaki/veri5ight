import { z } from "zod";
// Define response schemas
export const BalanceResponseSchema = z.object({
    balance: z.string(),
});
export const ProposalStateResponseSchema = z.object({
    state: z.number(),
});
