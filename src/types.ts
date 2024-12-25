import { z } from "zod";

// Define response schemas
export const BalanceResponseSchema = z.object({
  balance: z.string(),
});

export const ProposalStateResponseSchema = z.object({
  state: z.number(),
});

export type BalanceResponse = z.infer<typeof BalanceResponseSchema>;
export type ProposalStateResponse = z.infer<typeof ProposalStateResponseSchema>;

// Define the Result type
export interface Content {
  type: string;
  text: string;
}

export interface Result {
  isError?: boolean;
  content: Content[];
}

// Define request types
export interface MCPRequest<T> {
  method: string;
  params: T;
}
