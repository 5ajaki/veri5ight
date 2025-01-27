# 🔍 Veri5ight
[![smithery badge](https://smithery.ai/badge/5ajaki-veri5ight)](https://smithery.ai/server/5ajaki-veri5ight)

> Your friendly neighborhood Ethereum node whisperer! A Model Context Protocol (MCP) server that helps Claude chat with Ethereum nodes.

## 🌟 What's This All About?

Veri5ight is a direct interface between Claude and Ethereum nodes, providing:

- 💰 Real-time token balance and delegation info for any ERC20
- 🔎 Smart contract information
- 🚀 Direct node access without rate limits
- 🔒 Private, secure interactions

<a href="https://glama.ai/mcp/servers/en31vxf492"><img width="380" height="200" src="https://glama.ai/mcp/servers/en31vxf492/badge" alt="Veri5ight Server MCP server" /></a>

## 🚀 Quick Start
### Installing via Smithery

To install Veri5ight for Claude Desktop automatically via [Smithery](https://smithery.ai/server/5ajaki-veri5ight):

```bash
npx -y @smithery/cli install 5ajaki-veri5ight --client claude
```

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/5ajaki/veri5ight.git

# Install dependencies
npm install

# Build the project
npm run build
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Add your Ethereum node URL (example shown below - update with your actual node URL and port):

```env
ETH_NODE_URL="http://localhost:8545"  # Example - replace with your node's URL and port
```

3. Configure Claude Desktop:

```json
{
  "mcpServers": {
    "veri5ight": {
      "command": "node",
      "args": ["/absolute/path/to/veri5ight/dist/index.js"] // Local path to the compiled index.js file
    }
  }
}
```

Note: The path in step 3 must point to the compiled index.js in your local dist directory. This is created when you run `npm run build`.

### Launch Options

By default, Veri5ight launches automatically with the Claude Desktop App. If you prefer to run it on-demand:

1. Remove the postbuild script from package.json that auto-launches with Claude
2. Run manually when needed:

```bash
node dist/index.js
```

## 🎮 Available Tools

### ethereum_getTokenBalance

Get the token balance for any ERC20 token using address or ENS name.

Example:

```
Claude, what's vitalik.eth's UNI balance?
```

### ethereum_getTokenDelegation

Check delegation info for any governance token.

Example:

```
Claude, who has nick.eth delegated their tokens to?
```

### ethereum_getContractInfo

Get detailed information about any smart contract.

Example:

```
Claude, what can you tell me about this contract: nick.eth
```

### ethereum_getRecentTransactions

View recent transactions for any address. Note: This function scans the most recent 10 blocks for transactions involving the specified address.

Example:

```
Claude, show me any recent transactions for vitalik.eth
```

The function will return up to the requested number of transactions (default 3) found within those blocks. If no transactions are found in the recent blocks, it will return an empty result.

## 🔍 Debugging

Check Claude's logs for any issues:

```bash
tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
```

## 💡 Why Direct Node Access?

- **Low Latency**: Direct node queries without API overhead
- **No Rate Limits**: Unlimited queries to your own node
- **Privacy**: Queries stay between you and your node
- **Full Access**: Complete JSON-RPC API availability
- **Real-time Data**: Direct access to latest blockchain state

## 🛠️ Development

```bash
# Watch mode for the cool kids
npm run dev

# Build for production
npm run build
```

## 🤝 Contributing

Got ideas? Found a bug? PRs are welcome! Just:

1. Fork it
2. Branch it
3. Code it
4. PR it

## 📜 License

MIT - Go wild! See [LICENSE](LICENSE) for the boring legal stuff.

## 🙏 Props

- Built with ❤️ by the Veri5ight team
- Powered by Claude's big brain
- Standing on the shoulders of Ethereum giants

## 🆘 Need Help?

- 🐛 Found a bug? Open an issue!
- 🤔 Questions? Start a discussion!
- 🎉 Cool feature idea? Let's hear it!

Remember: Veri5ight is like a Swiss Army knife for Ethereum data - just don't try to open bottles with it! 🍾
