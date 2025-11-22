#!/bin/bash

# Redis Setup Script
# This script helps you set up and verify Redis configuration

set -e

echo "🔧 Redis Setup for News Aggregator"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo ""
fi

echo "📋 To set up Redis, you need to:"
echo ""
echo "1. Go to https://console.upstash.com/"
echo "2. Sign up (free tier: 10,000 commands/day)"
echo "3. Create a new Redis database"
echo "4. Copy your credentials"
echo ""
echo "Press Enter when you have your Redis credentials ready..."
read -r

echo ""
echo "Please enter your Upstash Redis credentials:"
echo ""

# Prompt for Redis URL
echo -n "UPSTASH_REDIS_REST_URL: "
read -r REDIS_URL

# Prompt for Redis token
echo -n "UPSTASH_REDIS_REST_TOKEN: "
read -r REDIS_TOKEN

# Validate inputs
if [ -z "$REDIS_URL" ] || [ -z "$REDIS_TOKEN" ]; then
    echo "❌ Error: Both URL and Token are required!"
    exit 1
fi

# Update .env.local
echo ""
echo "📝 Updating .env.local..."

# Check if Redis vars already exist in .env.local
if grep -q "UPSTASH_REDIS_REST_URL=" .env.local; then
    # Update existing values
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$REDIS_URL|" .env.local
        sed -i '' "s|UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=$REDIS_TOKEN|" .env.local
    else
        # Linux
        sed -i "s|UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$REDIS_URL|" .env.local
        sed -i "s|UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=$REDIS_TOKEN|" .env.local
    fi
else
    # Append new values
    echo "" >> .env.local
    echo "# Upstash Redis" >> .env.local
    echo "UPSTASH_REDIS_REST_URL=$REDIS_URL" >> .env.local
    echo "UPSTASH_REDIS_REST_TOKEN=$REDIS_TOKEN" >> .env.local
fi

echo "✅ Redis credentials saved to .env.local"
echo ""

# Test Redis connection
echo "🧪 Testing Redis connection..."
echo ""

# Create a temporary test script
cat > /tmp/test-redis.js << 'EOF'
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testRedis() {
  try {
    // Test set
    await redis.set('test:connection', 'Hello from News Aggregator!');

    // Test get
    const value = await redis.get('test:connection');

    if (value === 'Hello from News Aggregator!') {
      console.log('✅ Redis connection successful!');
      console.log('✅ Read/Write operations working!');

      // Clean up
      await redis.del('test:connection');

      process.exit(0);
    } else {
      console.log('❌ Redis connection failed: Unexpected value');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
    process.exit(1);
  }
}

testRedis();
EOF

# Run the test with the new environment variables
export UPSTASH_REDIS_REST_URL="$REDIS_URL"
export UPSTASH_REDIS_REST_TOKEN="$REDIS_TOKEN"

if node /tmp/test-redis.js; then
    echo ""
    echo "🎉 Redis setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm run dev' to start the development server"
    echo "2. Redis caching will automatically be enabled"
    echo "3. Check your Upstash dashboard to see cache hits"
    echo ""
else
    echo ""
    echo "⚠️  Redis connection test failed!"
    echo ""
    echo "Please check:"
    echo "- Your Redis URL and Token are correct"
    echo "- Your Upstash database is active"
    echo "- You have internet connectivity"
    echo ""
    echo "You can manually test by running:"
    echo "  npm run dev"
    echo ""
fi

# Clean up
rm -f /tmp/test-redis.js

echo "Configuration saved in .env.local"
echo "Your Redis credentials are secure and not committed to git."
