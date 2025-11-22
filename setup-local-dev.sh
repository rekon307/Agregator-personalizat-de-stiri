#!/bin/bash
#
# Local Development Setup Script
# Sets up Supabase local stack and environment for development
#

set -e

echo "📦 News Aggregator - Local Development Setup"
echo "=============================================="
echo ""

# Check for required tools
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Supabase CLI requires Docker."
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✅ Docker $(docker --version | head -n1)"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon not running. Please start Docker Desktop."
    exit 1
fi
echo "✅ Docker daemon running"

# Check/Install Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo ""
    echo "📥 Installing Supabase CLI..."

    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo "❌ Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        npm install -g supabase
    else
        # Windows or other
        npm install -g supabase
    fi
else
    echo "✅ Supabase CLI $(supabase --version)"
fi

echo ""
echo "🚀 Starting Supabase local stack..."
echo "   This may take a few minutes on first run (downloading Docker images)..."
echo ""

# Start Supabase
if supabase start; then
    echo ""
    echo "✅ Supabase started successfully!"
    echo ""

    # Get the credentials
    echo "📋 Local development credentials:"
    echo ""
    supabase status

    echo ""
    echo "📝 Next steps:"
    echo ""
    echo "1. Copy credentials to .env.local:"
    echo "   Create a file named .env.local with:"
    echo ""
    echo "   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from above>"
    echo "   NEXT_PUBLIC_SITE_URL=http://localhost:3000"
    echo "   CRON_SECRET=local-dev-secret"
    echo ""
    echo "2. Reset database with migrations:"
    echo "   supabase db reset"
    echo ""
    echo "3. Start Next.js development server:"
    echo "   npm run dev"
    echo ""
    echo "4. Access Supabase Studio:"
    echo "   http://localhost:54323"
    echo ""
    echo "5. To stop Supabase:"
    echo "   supabase stop"
    echo ""
else
    echo ""
    echo "❌ Failed to start Supabase."
    echo "   Check that Docker is running and ports are available."
    exit 1
fi
