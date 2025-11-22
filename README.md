# Personalized News Aggregator

A modern, personalized news aggregator built with Next.js 14 and Supabase that delivers curated news based on your interests.

## Features

- 🎯 **Personalized Feed** - News tailored to your topic preferences
- 📱 **Modern UI** - Built with Next.js 14, React 18, and Tailwind CSS
- 🔐 **Secure Authentication** - Powered by Supabase Auth
- 💾 **Save & Organize** - Bookmark articles with folders and tags
- 💬 **Real-time Comments** - Discuss articles with live updates
- 🎨 **Customizable** - Dark mode, custom colors, font sizes
- 🔄 **Auto-sync** - Automated RSS feed ingestion every 2 hours

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS, Shadcn/UI, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Validation**: Zod
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker (for local Supabase)
- Git

### Option 1: Local Development (Recommended)

Run the complete stack locally without external dependencies:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Agregator-personalizat-de-stiri

# 2. Install dependencies
npm install

# 3. Run setup script (installs Supabase CLI and starts local stack)
./setup-local-dev.sh

# 4. Copy credentials to .env.local
# (printed by setup script)

# 5. Start Next.js development server
npm run dev

# 6. Open http://localhost:3000
```

The setup script will:
- ✅ Install Supabase CLI
- ✅ Start local PostgreSQL (port 54322)
- ✅ Start local Auth server
- ✅ Start Supabase Studio (http://localhost:54323)
- ✅ Apply all database migrations

### Option 2: Use Cloud Supabase

```bash
# 1. Create a Supabase project at https://supabase.com

# 2. Copy .env.example to .env.local
cp .env.example .env.local

# 3. Add your Supabase credentials to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 4. Install dependencies
npm install

# 5. Push database migrations
npx supabase db push

# 6. Start development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Site URL for redirects

# Cron Job Authentication (for automated news ingestion)
CRON_SECRET=                      # Secret token for API authentication
```

See `.env.example` for a complete template.

## Database

The application uses PostgreSQL via Supabase with:

- **13+ tables** for articles, users, comments, saved items, etc.
- **Row Level Security (RLS)** for data protection
- **Database functions** for complex queries
- **40+ migrations** tracking schema evolution

### Local Database Management

```bash
# Start Supabase
supabase start

# View status
supabase status

# Reset database (apply all migrations)
supabase db reset

# Stop Supabase
supabase stop

# Access Supabase Studio
open http://localhost:54323
```

## Development

### Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   ├── (admin)/           # Admin dashboard
│   ├── api/               # API routes
│   └── actions.ts         # Server actions
├── components/
│   ├── ui/                # Shadcn/UI components
│   └── custom/            # Custom components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── validation/        # Zod schemas
├── supabase/
│   ├── config.toml        # Local development config
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge functions
└── styles/
    └── globals.css        # Global styles
```

## Testing

### Build Testing

```bash
# Run production build
npm run build
```

Build should complete without errors. See `TESTING_REPORT.md` for comprehensive test results.

### Runtime Testing

With local Supabase running:

```bash
# 1. Start Supabase
supabase start

# 2. Start Next.js
npm run dev

# 3. Test critical paths:
# - Visit http://localhost:3000
# - Sign up / Log in
# - View news feed
# - Like/save articles
# - Check browser console for errors
```

## Features in Detail

### News Ingestion

Automated RSS feed ingestion runs every 2 hours via GitHub Actions:

- Fetches articles from configured RSS feeds
- Deduplicates content (by URL and content hash)
- Categorizes articles automatically
- Handles rate limiting and retries

See `docs/automated-ingestion-setup.md` for configuration.

### Personalization

- Select topic preferences during onboarding
- Feed shows only articles from preferred categories
- Mute specific sources
- Save articles to folders with tags

### User Features

- Dark mode support
- Customizable avatar and banner colors
- Adjustable font sizes
- 50-article save limit (configurable)
- Real-time comment updates

## Documentation

- `Architecture/PRD.md` - Product requirements
- `Architecture/TechnicalDesignDocument.md` - Technical architecture
- `docs/local-development-setup.md` - Local development guide
- `docs/automated-ingestion-setup.md` - RSS ingestion setup
- `TESTING_REPORT.md` - Comprehensive test results
- `memory/docs/error-documentation.md` - Known issues and fixes

## Troubleshooting

### Build Errors

**Problem**: `Can't resolve '@/lib/...'`
**Solution**: All modules are committed. Run `npm install` and rebuild.

**Problem**: Font loading fails
**Solution**: Google Fonts removed - uses system fonts now.

### Runtime Errors

**Problem**: "Supabase URL and API key required"
**Solution**: Check `.env.local` has correct credentials.

**Problem**: Database connection fails
**Solution**:
- Local: Run `supabase start`
- Cloud: Verify credentials in Supabase dashboard

### Port Conflicts

If Supabase ports are in use:

```bash
# Stop Supabase
supabase stop

# Edit supabase/config.toml to change ports
# Then restart
supabase start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run build`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions:
- Check `TESTING_REPORT.md` for known issues
- Review `memory/docs/error-documentation.md` for solved problems
- Open an issue in the repository

---

**Version**: 0.1.0
**Last Updated**: 2025-11-21
