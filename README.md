# Agentic Trust Protocol (ATP)

![Agentic Trust Protocol](apps/atp-web/public/AgenticReliefNewtork.png)

**Agentic Trust Protocol (ATP)** is a comprehensive platform for managing smart agents built on the ERC-8004 Trustless Agent standard. This is the place to manage your smart agents, including their associated smart agent accounts, smart agent identities, and smart agent applications.

## Built on Agentic Trust Core Libraries

This project is built on top of the **[Agentic Trust Core Libraries](https://github.com/Agentic-Trust-Layer/agentic-trust)**, a comprehensive SDK and framework for trustless AI agent systems on Ethereum. The Agentic Trust Core Libraries provide:

- **AgenticTrustClient**: Main client for interacting with agents and the trust network
- **Agent Discovery**: GraphQL-based agent discovery and search capabilities
- **A2A Protocol**: Agent-to-Agent communication protocol support
- **ERC-8004 Integration**: Full support for the ERC-8004 Trustless Agent standard
- **Reputation System**: Built-in feedback and reputation management
- **Session Packages**: Smart account delegation via session packages
- **Veramo Integration**: DID management and authentication

ATP leverages these core libraries to provide a complete management platform for smart agents, enabling you to manage smart agent accounts, identities, and applications while maintaining full compatibility with the broader Agentic Trust ecosystem.

## About

The Agentic Trust Protocol is your central hub for managing smart agents. This platform enables you to:

- **Manage Smart Agent Accounts**: Each smart agent has an associated smart agent account for secure transactions and interactions
- **Manage Smart Agent Identity**: Each agent has a unique decentralized identity (DID) based on the ERC-8004 standard
- **Manage Smart Agent Applications**: Deploy and manage applications that your smart agents can use

Built on blockchain technology, ATP provides a secure, trustless framework for smart agents to operate autonomously while maintaining accountability and verifiability. All agent interactions are recorded on-chain with feedback and validation mechanisms, ensuring transparency and trust.

## EthGlobal 2025

This project was developed as an entry for **EthGlobal 2025**. While we encountered technical challenges during the hackathon period, we persevered and completed the implementation several days later. The project represents our commitment to leveraging blockchain technology for humanitarian applications and demonstrates the potential of trustless agent systems.

## ERC-8004 Trustless Agent Standard

The Agentic Trust Protocol is built on **ERC-8004**, a groundbreaking standard for trustless AI agents on Ethereum, implemented through the [Agentic Trust Core Libraries](https://github.com/Agentic-Trust-Layer/agentic-trust). ERC-8004 enables:

- **Trustless Agent Registration**: Agents can register on-chain with verifiable credentials
- **Decentralized Identity**: Each agent has a unique DID (Decentralized Identifier) based on the ERC-8004 format
- **Accountable Interactions**: All agent interactions are recorded on-chain with feedback and validation mechanisms
- **ENS Integration**: Human-readable names for agents through Ethereum Name Service (ENS)

## DevConnect 2025 - Argentina

**DevConnect 2025 in Argentina** will mark the first major launch of the ERC-8004 Trustless Agent standard. This event represents a significant milestone in the evolution of trustless AI systems on Ethereum, showcasing the practical applications of decentralized agent networks in real-world scenarios.

## Project Structure

This is a pnpm-based monorepo with separate `apps` and `packages` workspaces.

### Structure

- **Root**: pnpm workspace and shared configuration
- **`apps/`**: application projects
  - `atp-web`: Main web application for managing smart agents, their accounts, identities, and applications
  - `atp-agent`: A2A (Agent-to-Agent) provider server for smart agent communication endpoints
- **`packages/`**: shared libraries and utilities
  - `core`: Core utilities and A2A server helpers

### Getting Started

1. Install pnpm if you don't have it:

   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

2. From the repo root:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env.local` in each app directory
   - Configure required environment variables (RPC URLs, API keys, etc.)

4. Run the development servers:

   ```bash
   # Run the main atp-web app
   cd apps/atp-web
   pnpm dev

   # Run the agent server (in a separate terminal)
   cd apps/atp-agent
   pnpm dev
   ```

## Features

- **Smart Agent Management**: Complete lifecycle management for your smart agents
- **Smart Agent Accounts**: Manage associated smart agent accounts for secure transactions
- **Smart Agent Identity**: Manage decentralized identities (DIDs) for each smart agent
- **Smart Agent Applications**: Deploy and manage applications for your smart agents
- **Agent Discovery**: Search and filter smart agents across multiple chains
- **Agent Registration**: Register new smart agents with ENS names and metadata
- **Feedback System**: Submit and view feedback for smart agents
- **Validation System**: Request and track ENS validations for smart agents
- **A2A Protocol**: Agent-to-Agent communication endpoints for smart agent interactions
- **Multi-chain Support**: Support for Sepolia, Base Sepolia, and Optimism Sepolia

## License

MIT. See `LICENSE` for details.
