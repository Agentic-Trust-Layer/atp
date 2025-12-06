# Cloudflare D1 Database Setup

This directory contains the database schema and setup instructions for the ATP application's Cloudflare D1 database.

## Database Schema

The database stores:
- **Accounts**: User profiles with email, name, social account info, EOA, and AA addresses
- **Agents**: Smart agent information with ENS names, agent names, email domains, smart agent accounts, and smart agent identities
- **Account-Agent Associations**: Links users to smart agents with role and primary agent designation
- **Messages**: Inbox messages between users (by client address) and agents (by DID:8004)
- **Agent Feedback Requests**: Feedback requests from clients to agents

## Setup Instructions

### 1. Create the D1 Database

```bash
# Install Wrangler CLI if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create the database (if not already created)
wrangler d1 create atp
```

The database ID is already configured in `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "atp"
database_id = "f2c52166-1b8e-439e-8dec-ea3959124b0e"
```

### 2. Initialize the Database Schema

```bash
# Apply the schema to remote database
wrangler d1 execute atp --file=./db/schema.sql
```

Or for local development:

```bash
wrangler d1 execute atp --local --file=./db/schema.sql
```

### 2.1. Apply Migrations (if database already exists)

If your database was created before certain schema updates, you may need to run migrations:

**Important**: If you have an existing database with the old `individuals` and `individual_agents` tables, you must run the migration to rename them to `accounts` and `account_agents`:

```bash
# Apply table rename migration to remote database
wrangler d1 execute atp --file=./db/migrations/0002_rename_individuals_to_accounts.sql
```

Or for local development:

```bash
wrangler d1 execute atp --local --file=./db/migrations/0002_rename_individuals_to_accounts.sql
```

**Other migrations**:

```bash
# Apply session package migration (if needed)
wrangler d1 execute atp --file=./db/migration_add_session_package.sql
```

**Note**: The messages and agent_feedback_requests tables are now included in the main schema.sql file. If you have an existing database, you may need to create these tables separately or recreate the database with the updated schema.

### 3. Configure Remote D1 Access (for Next.js Development)

To use the remote D1 database from Next.js development, you have two options:

#### Option A: Use Wrangler CLI (Recommended for Remote Access)

1. **Install and Login to Wrangler**:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Set Environment Variable**:
   - Create `.env.local` file in `apps/atp-web/` directory
   - Add:
     ```
     USE_REMOTE_D1=true
     CLOUDFLARE_D1_DATABASE_NAME=atp
     ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

   The application will use Wrangler CLI to execute queries against the remote D1 database.

#### Option B: Use Wrangler Pages Dev (Alternative)

For a more native Cloudflare experience:

```bash
# Build Next.js first
npm run build

# Use Wrangler Pages dev which provides DB binding
wrangler pages dev .next
```

### 4. Running the Application

**For Development (using remote D1 via Wrangler)**:
```bash
# Make sure .env.local has USE_REMOTE_D1=true
npm run dev
```

**For Production (Cloudflare Pages/Workers)**:
- The database binding will be automatically available via `globalThis.DB`
- No additional configuration needed when deployed to Cloudflare

### 5. Local Development with Local D1

If you prefer to use a local D1 database for development:

```bash
# Start local D1 database
wrangler d1 execute atp --local --file=./db/schema.sql

# Don't set USE_REMOTE_D1, or set it to false
# The app will try to use local bindings first
```

## API Routes

The following API routes are available:

- `GET /api/users/profile?email=...` - Get user profile by email
- `GET /api/users/profile?eoa=...` - Get user profile by EOA address
- `POST /api/users/profile` - Create or update user profile
- `GET /api/users/agents?email=...` - Get all smart agents for a user
- `POST /api/users/agents` - Associate user with a smart agent

## Database Tables

### accounts
- Stores user profile information
- Unique constraint on email
- Indexed on email, EOA, and AA addresses

### agents
- Stores smart agent information including smart agent accounts, identities, and applications
- Unique constraint on ENS name
- Indexed on ENS name and email domain

### account_agents
- Junction table linking users to smart agents
- Supports primary smart agent designation
- Unique constraint on (account_id, agent_id)

### messages
- Stores inbox messages between users and agents
- Supports messages from/to client addresses and agent DIDs
- Includes subject, body, context type/ID for message threading
- Tracks read status with `read_at` timestamp
- Indexed on to/from addresses and DIDs for efficient querying

### agent_feedback_requests
- Stores feedback requests from clients to agents
- Tracks request status (pending, processed, rejected)
- Stores signed feedback auth payload when approved
- Stores transaction hash when feedback is submitted on-chain

