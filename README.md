# 🔍 Veri5ight

> Your friendly neighborhood Ethereum node whisperer! A Model Context Protocol (MCP) server that helps Claude chat with Ethereum nodes.

## 🌟 What's This All About?

Veri5ight is a direct interface between Claude and Ethereum nodes, providing:

- 💰 Real-time token balance checks
- 🔎 Smart contract information
- 🚀 Direct node access without rate limits
- 🔒 Private, secure interactions

## 🚀 Quick Start

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

2. Add your Ethereum node URL:

```env
ETH_NODE_URL="http://your.ethereum.node:8545"
```

3. Configure Claude Desktop:

```json
{
  "mcpServers": {
    "veri5ight": {
      "command": "node",
      "args": ["/absolute/path/to/veri5ight/dist/index.js"]
    }
  }
}
```

## 🎮 Available Tools

### ethereum_getENSBalance

Get the ENS token balance for any address or ENS name.

Example:

```
Claude, what's vitalik.eth's ENS balance?
```

### ethereum_getContractInfo

Get detailed information about any ERC20 contract.

Example:

```
Claude, can you show me the contract details for the ENS token at 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72?
```

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
