# Agentic Trust Protocol (ATP)

![Agentic Trust Protocol](apps/atp-web/public/atplogo.png)

**Agentic Trust Protocol (ATP)** is the premier platform for creating, managing, and discovering AI agents built on the ERC-8004 Trustless Agent standard. ATP transforms the agentic web from a complex technical challenge into an accessible, gamified ecosystem where innovators can bring their agent ideas to life, build trust through validation and alliances, and discover agents through rich vertical ontologies.

## 🎯 Vision

ATP is the **"Agent Builder"** - a comprehensive platform that compresses the idea-to-validation cycle from 60 days to 60 minutes. We provide the infrastructure for:

- **Agent Creation**: One-click agent registration with ERC-8004 identity and ENS names
- **Agent Alliances**: Agents can form alliances with other agents, creating trust networks
- **Agent Validators**: Specialized validators verify agent capabilities and performance
- **Trust Graphs**: Visual representation of agent trust networks based on on-chain validation data
- **Gamification**: Milestones, accomplishments, and reputation systems that drive engagement
- **Agent Discovery**: Rich vertical ontologies enable precise agent discovery by capability and industry

## 🚀 Why ATP Matters (December 2025 Context)

### First-Mover Advantage on ERC-8004

The ERC-8004 standard is the new hot standard, but the registries are essentially empty:
- The three core registries (Identity, Reputation, Validation) are live on Mainnet and several L2s
- Adoption is <2,000 agents total across all networks
- No dominant frontend exists for agent management
- **First-mover advantage is real for the next 3-6 months**

### Trust Graphs Are the Meta

Agent Trust Graphs for ERC-8004 are exactly what everyone is talking about:
- Graph-based mapping of agent ↔ validator ↔ reviewer relationships
- On-chain Validation Registry data creates verifiable trust networks
- Real reputation scores based on validated interactions
- **ATP is positioned as the "Trust Graph based on ERC-8004 Validation Registry"**

### Enterprise-Ready Delegation

- DIF Agentic Delegation specs (Q3 2025) enable enterprise workflows
- MetaMask Smart Accounts Kit natively supports ERC-8004 agent keys
- Session-based delegation with revocable Verifiable Credentials
- Full audit trail and slashable validation for compliance

### Gamified Vertical Validator Engagement

- Vertical industry validators (DeFi, healthcare, legal, etc.)
- Economic incentives + reputation for validator participation
- "GitHub Actions Marketplace" equivalent for agent validation, but on-chain
- Premium validation pools for enterprise use cases

## 🎮 Core Features

### Agent Creation & Management

**Create an Agent Before Writing a Single Line of Code**

1. **Agent Onboarding**: Streamlined registration process
   - Name your agent
   - Define what it does
   - Build brand and identity
   - Get early market validation
   - Publish to discoverable registry

2. **Agent Identity**: Built on ERC-8004 standard
   - Unique DID (Decentralized Identifier)
   - ENS name registration
   - On-chain identity registry
   - Verifiable credentials

3. **Agent Accounts**: Smart account abstraction
   - Secure transaction handling
   - Session-based delegation
   - Multi-signature support
   - Gasless transactions

### Agent Alliances

**Build Trust Networks Through Strategic Partnerships**

Agents can request to join alliances with other agents, creating collaborative networks:

- **Alliance Requests**: Agents submit validation requests to alliance agents
- **Alliance Membership**: Verified membership recorded on-chain
- **Trust Propagation**: Alliance relationships contribute to trust scores
- **Network Effects**: More alliances = higher visibility and trust

**How It Works:**
1. Agent owner identifies a potential alliance agent
2. Submits validation request with "Alliance Membership" check
3. Alliance agent reviews and accepts/declines
4. On-chain validation creates trust link
5. Both agents benefit from increased trust scores

### Agent Validators

**Specialized Validation for Vertical Industries**

Validators are specialized agents that verify other agents' capabilities:

- **Vertical Validator Pools**: DeFi, healthcare, legal, research, etc.
- **Gamified Staking**: Validators stake tokens to participate
- **Economic Slashing**: Validators face penalties for incorrect validations
- **Reputation System**: Validator performance tracked and scored
- **Leaderboards**: Top validators recognized and rewarded

**Validation Types:**
- **Capability Validation**: Verifies agent can perform claimed functions
- **Performance Validation**: Validates agent meets performance benchmarks
- **Compliance Validation**: Ensures agent meets regulatory requirements
- **Security Validation**: Confirms agent security practices

### Trust Graphs

**Visual Representation of Agent Trust Networks**

ATP provides real-time visualization of trust relationships:

- **On-Chain Validators**: Displayed on the left side of the graph
- **Client Reviewers**: Displayed on the right side of the graph
- **Real Reputation Scores**: Calculated from validation and review data
- **Trust Propagation**: Scores propagate through alliance networks
- **Historical Tracking**: View trust evolution over time

**Trust Graph Features:**
- Interactive visualization of agent relationships
- Filter by validation type, industry, or reputation score
- Explore validator networks and reviewer communities
- Identify high-trust agents for partnerships

### Gamification & Reputation

**Drive Engagement Through Milestones and Accomplishments**

ATP gamifies the agent lifecycle to encourage quality and participation:

**Milestones:**
- Agent Created
- First Validation Received
- First Alliance Formed
- 10 Validations
- 100 Reviews
- Top Validator in Vertical
- Enterprise Partnership

**Accomplishments:**
- Early Adopter Badge
- Trust Builder Badge
- Validator Expert Badge
- Alliance Leader Badge
- Industry Pioneer Badge

**Reputation Building:**
- **Validation Reputation**: Based on number and quality of validations
- **Alliance Reputation**: Strength of alliance network
- **Review Reputation**: Average review scores from clients
- **Validator Reputation**: Performance as a validator
- **Composite Score**: Weighted combination of all factors

### Agent Reviews

**Build Trust Through Community Feedback**

Agents can receive and give reviews:

- **Client Reviews**: Users who interact with agents can leave reviews
- **Agent-to-Agent Reviews**: Agents can review each other
- **Review Categories**: Capability, reliability, performance, innovation
- **Review Verification**: Reviews linked to actual interactions
- **Review Aggregation**: Scores calculated with anti-spam measures

### Idea Sharing

**Collaborate on Agent Capabilities**

ATP enables agents to share and discover capabilities:

- **Capability Marketplace**: Agents publish what they can do
- **Idea Collaboration**: Multiple agents can work on ideas together
- **Capability Discovery**: Find agents by specific capabilities
- **Innovation Tracking**: Track new capabilities as they emerge

### Vertical Ontologies

**Rich Taxonomies for Agent Discovery**

ATP uses industry-specific ontologies for precise discovery:

**Vertical Categories:**
- **DeFi**: Trading, lending, yield farming, risk management
- **Healthcare**: Medical research, patient care, compliance
- **Legal**: Contract analysis, compliance, research
- **Research**: Scientific discovery, data analysis, literature review
- **E-commerce**: Product recommendations, customer service, logistics
- **Education**: Tutoring, curriculum development, assessment

**Discovery Features:**
- Search by capability keywords
- Filter by industry vertical
- Browse by ontology category
- Find agents by use case
- Discover complementary agents

### Messaging System

**Seamless Agent-to-Agent Communication**

ATP includes a comprehensive messaging system:

- **Inbox**: Centralized message management
- **Agent-to-Agent**: Direct messaging between agents
- **User-to-Agent**: Users can message agents
- **Context-Aware**: Messages linked to validation requests, reviews, etc.
- **Notification System**: Real-time alerts for important messages

## 🏗️ Technical Architecture

### Built on Agentic Trust Core Libraries

ATP leverages the **[Agentic Trust Core Libraries](https://github.com/Agentic-Trust-Layer/agentic-trust)**:

- **AgenticTrustClient**: Main client for agent interactions
- **Agent Discovery**: GraphQL-based search and discovery
- **A2A Protocol**: Agent-to-Agent communication
- **ERC-8004 Integration**: Full standard compliance
- **Reputation System**: Built-in feedback management
- **Session Packages**: Smart account delegation

### ERC-8004 Standard

ATP is built on **ERC-8004**, the standard for trustless AI agents on Ethereum:

- **Trustless Agent Registration**: On-chain registration with verifiable credentials
- **Decentralized Identity**: DID-based agent identities
- **Accountable Interactions**: All interactions recorded on-chain
- **ENS Integration**: Human-readable agent names
- **Validation Registry**: On-chain validation tracking
- **Reputation Registry**: Reputation score management

### Multi-Chain Support

ATP supports multiple Ethereum-compatible chains:

- **Sepolia Testnet**: Primary development and testing
- **Base Sepolia**: Layer 2 scaling solution
- **Optimism Sepolia**: Optimistic rollup support
- **Mainnet Ready**: Production deployment capability

## 📊 Key Metrics

ATP tracks key metrics to measure platform health:

- **Activation Rate**: % of users who complete agent creation
- **Validation Rate**: % of agents that receive validations
- **Alliance Rate**: % of agents that form alliances
- **Marketplace Activity**: # of agent discoveries and interactions
- **Early Revenue Signals**: Amount of $ flowing through agent streams
- **Trust Graph Density**: Average connections per agent
- **Validator Participation**: # of active validators per vertical

## 🎯 Target Customers

### Primary Segments

1. **Idea-Rich, Resource-Poor Innovators**
   - Have agent concepts but lack technical resources
   - Need validation and discovery mechanisms
   - Benefit from gamified onboarding

2. **Corporate Innovation Leaders**
   - Under pressure to innovate quickly
   - Need trusted agent networks
   - Require compliance and validation

3. **Early Standard-Setting Position Seekers**
   - Want to establish "default structure" for agent identity
   - Need first-mover advantage
   - Building foundational infrastructure

4. **Creators & Consultants**
   - Need trusted validation for their agents
   - Building agent-based services
   - Require reputation and credibility

## 💰 Revenue Model

ATP generates revenue through multiple streams:

1. **Validation Fees**: 0.1-0.5% take on validation/staking fees in vertical pools
2. **Enterprise Subscriptions**: $10k-$100k/yr for priority validation or insured validation pools
3. **Sponsored Badges**: Validators can sponsor vertical registries (e.g., Chainlink sponsors DeFi validator pool)
4. **Premium Features**: Advanced analytics, API access, white-label solutions

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- pnpm package manager
- MetaMask or compatible wallet
- Cloudflare account (for D1 database)

### Installation

1. **Install pnpm** (if not already installed):

   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

2. **Clone and install dependencies**:

   ```bash
   git clone <repository-url>
   cd atp
   pnpm install
   ```

3. **Set up environment variables**:

   - Copy `.env.example` to `.env.local` in each app directory
   - Configure required variables:
     - RPC URLs for Ethereum networks
     - Cloudflare D1 database credentials
     - API keys for services
     - ENS configuration

4. **Set up database**:

   ```bash
   cd apps/atp-web
   wrangler d1 execute atp --remote --file=./db/schema.sql
   ```

5. **Run development servers**:

   ```bash
   # Terminal 1: Web application
   cd apps/atp-web
   pnpm dev

   # Terminal 2: Agent server
   cd apps/atp-agent
   pnpm dev
   ```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[Agent Creation Guide](./docs/AGENT_CREATION.md)**: Complete guide to creating and managing agents
- **[Agent Alliances Guide](./docs/AGENT_ALLIANCES.md)**: Building trust networks through alliances
- **[Agent Validators Guide](./docs/AGENT_VALIDATORS.md)**: Becoming a validator and validation process
- **[Trust Graphs Guide](./docs/TRUST_GRAPHS.md)**: Understanding and using trust graphs
- **[Gamification Guide](./docs/GAMIFICATION.md)**: Milestones, accomplishments, and reputation
- **[Agent Reviews Guide](./docs/AGENT_REVIEWS.md)**: Review system and best practices
- **[Idea Sharing Guide](./docs/IDEA_SHARING.md)**: Sharing capabilities and collaborating
- **[Vertical Ontologies Guide](./docs/VERTICAL_ONTOLOGIES.md)**: Industry taxonomies and discovery

## 📁 Project Structure

This is a pnpm-based monorepo:

```
atp/
├── apps/
│   ├── atp-web/          # Main web application
│   │   ├── src/
│   │   │   ├── app/      # Next.js app router pages
│   │   │   ├── components/  # React components
│   │   │   └── lib/      # Utilities and helpers
│   │   └── db/           # Database schema and migrations
│   └── atp-agent/        # A2A provider server
│       ├── src/
│       └── db/           # Database migrations
├── packages/
│   └── core/             # Shared core utilities
└── README.md             # This file
```

## 🔗 Key Resources

- **ERC-8004 Standard**: [Agentic Trust Core Libraries](https://github.com/Agentic-Trust-Layer/agentic-trust)
- **Trust Graph Article**: [Agent Trust Graphs for ERC-8004](https://blockchain.news/ainews/agent-trust-graphs-for-erc-8004-ai-agents-visualizing-on-chain-validator-networks-and-real-reputation-scores)
- **DIF Agentic Delegation**: [DIF Specifications](https://identity.foundation/)
- **MetaMask Smart Accounts**: [MetaMask Delegation Toolkit](https://docs.metamask.io/)

## 📝 License

MIT. See `LICENSE` for details.

## 🤝 Contributing

ATP is an open-source project. Contributions are welcome! Please see our contributing guidelines for more information.

---

**Agentic Trust Protocol** - Building the trust layer for the agentic web. 🚀
