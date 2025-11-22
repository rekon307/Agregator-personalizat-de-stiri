# Local Development Setup

This guide shows how to run the entire application stack locally without external dependencies.

---

## Option 1: Supabase Local Development (Recommended)

Supabase CLI runs a complete local stack with Docker.

### Prerequisites

```bash
# Install Docker
# Install Supabase CLI
npm install -g supabase

# Or via Homebrew (Mac/Linux)
brew install supabase/tap/supabase
```

### Setup

```bash
# 1. Initialize Supabase in the project (if not already done)
supabase init

# 2. Start local Supabase stack
supabase start
```

This starts:
- ✅ PostgreSQL (local instance)
- ✅ Auth server
- ✅ Realtime server
- ✅ Edge Functions runtime
- ✅ Studio UI (http://localhost:54323)

### Configure Environment

After `supabase start`, you'll get local credentials:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... # (provided by CLI)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=local-dev-secret
```

### Run Migrations

```bash
# Apply all migrations to local database
supabase db reset

# Or push specific migrations
supabase db push
```

### Start Development

```bash
# Terminal 1: Supabase
supabase start

# Terminal 2: Next.js
npm run dev
```

### Benefits

✅ **Complete offline development**
✅ **Fast database reset** (`supabase db reset`)
✅ **Edge Functions work locally**
✅ **Same environment as production**
✅ **Free and unlimited**

---

## Option 2: Direct PostgreSQL + Mock Auth

Run PostgreSQL directly and mock the auth layer.

### Setup PostgreSQL

```bash
# Using Docker
docker run -d \
  --name news-aggregator-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=news_aggregator \
  -p 5432:5432 \
  postgres:17

# Or install PostgreSQL directly
# Mac: brew install postgresql
# Ubuntu: apt install postgresql
```

### Apply Schema

```bash
# Export schema from Supabase
supabase db dump -f schema.sql

# Apply to local Postgres
psql -U postgres -d news_aggregator -f schema.sql
```

### Update Code

You'd need to:

1. **Replace Supabase Client** with direct Postgres client:
```typescript
// lib/database/client.ts
import { Pool } from 'pg';

export const db = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'news_aggregator',
  user: 'postgres',
  password: 'postgres'
});
```

2. **Replace Auth** with NextAuth.js or similar:
```bash
npm install next-auth
```

3. **Replace Realtime** with:
   - WebSockets (socket.io)
   - Or polling
   - Or remove realtime features

### Effort Required

⚠️ **High effort** - Need to rewrite:
- All Supabase client calls
- Auth system
- Realtime subscriptions
- RLS policies (as application code)

---

## Option 3: Hybrid Approach

Use Supabase for production, local Postgres for development.

### Setup

```bash
# Install node-postgres
npm install pg

# Create database adapter layer
# lib/database/index.ts - switch between Supabase/Postgres based on env
```

### Environment Detection

```typescript
// lib/database/adapter.ts
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalDb = process.env.USE_LOCAL_DB === 'true';

export const db = useLocalDb
  ? createPostgresClient()
  : createSupabaseClient();
```

### Benefits

✅ **Flexibility** - switch backends easily
✅ **Local testing** - fast, no network
✅ **Production stability** - keep Supabase

### Drawbacks

⚠️ **Maintain two implementations**
⚠️ **Feature parity** - ensure both work the same

---

## Comparison

| Feature | Supabase Local | Direct PostgreSQL | Hybrid |
|---------|---------------|-------------------|--------|
| Setup Complexity | Low | Medium | High |
| Production Parity | High | Low | Medium |
| Offline Dev | Yes | Yes | Yes |
| Auth Built-in | Yes | No | Mixed |
| Realtime | Yes | No | No |
| Edge Functions | Yes | No | No |
| Maintenance | Low | High | High |

---

## Recommendation

**Use Supabase Local CLI** (`supabase start`)

### Why?

1. **Zero code changes** - works with existing codebase
2. **Production parity** - same stack as deployment
3. **Fast iteration** - `db reset` in seconds
4. **All features work** - auth, realtime, edge functions
5. **Free** - no cloud costs during development

### Quick Start

```bash
# Install Supabase CLI
npm install -g supabase

# Start local stack
cd /home/user/Agregator-personalizat-de-stiri
supabase start

# Copy credentials to .env.local
# (printed after supabase start)

# Run migrations
supabase db reset

# Start Next.js
npm run dev
```

---

## Testing Without Any Database

For **pure build testing** (like CI/CD), mock the database:

```bash
# .env.test
NEXT_PUBLIC_SUPABASE_URL=http://mock-supabase.local
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-key-for-testing
```

```typescript
// lib/supabase/__mocks__/client.ts
export const createClient = () => ({
  auth: {
    getUser: () => ({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
  }),
  // ... mock all methods
});
```

---

## Next Steps

**Immediate**: Set up Supabase local development
```bash
npm install -g supabase
supabase start
```

**Short-term**: Document local development workflow

**Long-term**: Consider abstracting database layer if you want to migrate away from Supabase

---

## Additional Resources

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Database Migrations](https://supabase.com/docs/guides/cli/managing-migrations)
