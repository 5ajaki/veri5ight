# 🔍 Veri5ight

> Your friendly neighborhood Ethereum node whisperer! A Model Context Protocol (MCP) server that helps Claude chat with Ethereum nodes.

## 🌟 What's This All About?

Veri5ight is like a universal translator between Claude and Ethereum nodes. It helps Claude:

- 💰 Check ENS token balances
- 🔎 Peek at smart contract code
- 🕵️‍♂️ Decode mysterious transactions

## 🚀 Quick Start

```bash
# Clone this bad boy
git clone https://github.com/5ajaki/veri5ight.git

# Install the goodies
npm install

# Build it!
npm run build
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Add your Ethereum node URL:

```env
ETH_NODE_URL="http://your.awesome.node:8545"
```

3. Configure Claude Desktop:

```json
{
  "mcpServers": {
    "veri5ight": {
      "command": "node",
      "args": ["/path/to/veri5ight/dist/index.js"]
    }
  }
}
```

## 🎮 Available Tools

### 🏦 ethereum/getENSBalance

```
Claude, what's vitalik.eth's ENS balance?
```

### 📝 ethereum/getContractCode

```
Claude, show me the contract code for uniswap.eth
```

### 🔍 ethereum/decodeTransaction

```
Claude, what's happening in tx 0x1234...?
```

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
