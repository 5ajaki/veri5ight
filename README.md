# Veri5ight 🔍

A powerful MCP server for Ethereum smart contract analysis and ENS operations.

## Features ✨

- **ENS Balance Checking**: Query ENS token balances for any address or ENS name
- **Smart Contract Analysis**: Get contract bytecode and analyze deployments
- **Transaction Decoder**: Decode transaction input data and function calls
- **Native Node Integration**: Works directly with your Ethereum node - no external APIs needed

## Installation 🚀

```bash
# Clone the repository
git clone https://github.com/yourusername/veri5ight.git
cd veri5ight

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration ⚙️

Create a configuration file for Claude Desktop at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "veri5ight": {
      "command": "node",
      "args": ["/path/to/veri5ight/dist/index.js"],
      "env": {
        "ETHEREUM_NODE_URL": "http://your.ethereum.node:8545"
      }
    }
  }
}
```

## Usage 💡

Once configured, Veri5ight provides the following tools through Claude:

### ethereum/getENSBalance

Get ENS token balance for an address:

```
Could you check the ENS balance for vitalik.eth?
```

### ethereum/getContractCode

Analyze smart contract bytecode:

```
Can you show me the contract code for uniswap.eth?
```

### ethereum/decodeTransaction

Decode transaction data:

```
Could you decode this transaction: 0x123...?
```

## Development 🛠️

```bash
# Run tests
npm test

# Build in watch mode
npm run dev

# Type checking
npm run type-check
```

## Architecture 🏗️

Veri5ight is built on:

- TypeScript for type safety
- Ethers.js for Ethereum interaction
- MCP (Model Context Protocol) for Claude integration
- JSON-RPC for node communication

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments 🙏

- Claude and Anthropic for the MCP framework
- Ethereum Foundation for ENS
- The ethers.js team
- All our contributors

## Support 💪

Need help? Open an issue or reach out to the community!
