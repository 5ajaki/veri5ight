// Define MCP result types
export interface Content {
  type: string;
  text: string;
}

export interface Result {
  isError?: boolean;
  content: Content[];
}
