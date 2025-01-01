import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

type JsonRpcRequest = {
  jsonrpc: string;
  method: string;
  params?: any;
  id: number | string;
};

type JsonRpcResponse = {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
};

function handleRequest(request: JsonRpcRequest): JsonRpcResponse {
  switch (request.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          serverInfo: {
            name: 'veri5ight',
            version: '1.0.0'
          },
          capabilities: {}
        }
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: []
        }
      };

    default:
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
  }
}

process.stdout.write('\n');

rl.on('line', (line) => {
  try {
    const request = JSON.parse(line) as JsonRpcRequest;
    const response = handleRequest(request);
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: 'error',
      error: {
        code: -32700,
        message: 'Parse error'
      }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }
});

process.stderr.write('Veri5ight MCP Server running on stdio\n');
