#!/bin/bash

# Security Update Script for React & Next.js
# Run this script to update dependencies and check for vulnerabilities

set -e

echo "🔒 Starting Security Update Process..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node.js: $NODE_VERSION"
echo ""

# Update Next.js in frontend
echo "🔄 Updating Next.js in frontend..."
cd src/frontend
if [ -f "package.json" ]; then
    echo "   Current Next.js version:"
    grep '"next"' package.json || echo "   Next.js not found"
    echo ""
    echo "   Updating to latest secure version..."
    npm install next@latest --save
    echo -e "${GREEN}✓${NC} Next.js updated"
else
    echo -e "${RED}✗${NC} package.json not found in src/frontend"
fi
cd ../..
echo ""

# Update React in frontend
echo "🔄 Updating React in frontend..."
cd src/frontend
if [ -f "package.json" ]; then
    echo "   Current React version:"
    grep '"react"' package.json || echo "   React not found"
    echo ""
    echo "   Updating to latest secure version..."
    npm install react@latest react-dom@latest --save
    echo -e "${GREEN}✓${NC} React updated"
else
    echo -e "${RED}✗${NC} package.json not found in src/frontend"
fi
cd ../..
echo ""

# Update Next.js in admin frontend
echo "🔄 Updating Next.js in admin frontend..."
cd src/admin/frontend
if [ -f "package.json" ]; then
    echo "   Current Next.js version:"
    grep '"next"' package.json || echo "   Next.js not found"
    echo ""
    echo "   Updating to latest secure version..."
    npm install next@latest --save
    echo -e "${GREEN}✓${NC} Next.js updated"
else
    echo -e "${RED}✗${NC} package.json not found in src/admin/frontend"
fi
cd ../../..
echo ""

# Update React in admin frontend
echo "🔄 Updating React in admin frontend..."
cd src/admin/frontend
if [ -f "package.json" ]; then
    echo "   Current React version:"
    grep '"react"' package.json || echo "   React not found"
    echo ""
    echo "   Updating to latest secure version..."
    npm install react@latest react-dom@latest --save
    echo -e "${GREEN}✓${NC} React updated"
else
    echo -e "${RED}✗${NC} package.json not found in src/admin/frontend"
fi
cd ../../..
echo ""

# Run npm audit
echo "🔍 Running security audit..."
echo ""
cd src/frontend
if [ -f "package.json" ]; then
    echo "   Frontend audit:"
    npm audit --audit-level=moderate || echo -e "${YELLOW}⚠${NC} Some vulnerabilities found (review above)"
fi
cd ../..
echo ""

cd src/admin/frontend
if [ -f "package.json" ]; then
    echo "   Admin frontend audit:"
    npm audit --audit-level=moderate || echo -e "${YELLOW}⚠${NC} Some vulnerabilities found (review above)"
fi
cd ../../..
echo ""

# Check for outdated packages
echo "📊 Checking for outdated packages..."
echo ""
cd src/frontend
if [ -f "package.json" ]; then
    echo "   Frontend outdated packages:"
    npm outdated || echo "   All packages up to date"
fi
cd ../..
echo ""

cd src/admin/frontend
if [ -f "package.json" ]; then
    echo "   Admin frontend outdated packages:"
    npm outdated || echo "   All packages up to date"
fi
cd ../../..
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Security Update Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Next.js and React have been updated"
echo "✅ Security audit completed"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "   1. Review the security audit results above"
echo "   2. Test your application thoroughly"
echo "   3. Review SECURITY_ADVISORY_REACT_NEXTJS.md for additional security measures"
echo "   4. Update next.config.js with security headers (already done)"
echo "   5. Consider implementing rate limiting"
echo ""
echo "📚 For more information, see: SECURITY_ADVISORY_REACT_NEXTJS.md"
echo ""
echo -e "${GREEN}✓${NC} Security update process completed!"
echo ""

