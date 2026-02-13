#!/bin/bash

# Cyber Battleships - Local Network Setup Script
# This script helps configure the application for local network deployment

set -e

echo "=========================================="
echo "  Cyber Battleships - Local Setup"
echo "=========================================="
echo ""

# Function to get local IP address
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1"
    else
        echo "127.0.0.1"
    fi
}

# Detect server IP
SERVER_IP=$(get_local_ip)

echo "🔍 Detected Server IP: $SERVER_IP"
echo ""

# Ask user to confirm or provide custom IP
read -p "Is this correct? (y/n) or enter custom IP: " input

if [[ "$input" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    SERVER_IP=$input
    echo "✅ Using custom IP: $SERVER_IP"
elif [[ "$input" != "y" && "$input" != "Y" ]]; then
    echo "❌ Please run 'ipconfig' (macOS/Windows) or 'hostname -I' (Linux) to find your IP"
    echo "   Then edit the .env files manually."
    exit 1
fi

echo ""
echo "📝 Creating environment files..."
echo ""

# Create backend/.env
cat > backend/.env << EOF
# Backend Environment Configuration
PORT=3000
NODE_ENV=production
HOST=$SERVER_IP
CORS_ORIGIN=*
EOF

echo "✅ Created backend/.env"

# Create frontend/.env
cat > frontend/.env << EOF
# Frontend Environment Configuration
VITE_API_URL=http://$SERVER_IP:3000
EOF

echo "✅ Created frontend/.env"

echo ""
echo "=========================================="
echo "  ✅ Configuration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Build the application:"
echo "   cd backend && npm run build"
echo "   cd ../frontend && npm run build"
echo ""
echo "3. Start the servers:"
echo "   cd backend && npm start"
echo "   cd ../frontend && npm run dev -- --host"
echo ""
echo "4. Students connect to:"
echo "   👉 http://$SERVER_IP:5173"
echo ""
echo "5. Admin panel:"
echo "   👉 http://$SERVER_IP:5173/admin"
echo ""
echo "6. Make sure firewall allows ports 3000 and 5173"
echo ""
echo "=========================================="
echo "📖 See LOCAL_DEPLOYMENT.md for full guide"
echo "=========================================="
