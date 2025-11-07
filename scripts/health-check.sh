#!/bin/bash

# SplitBase Health Check Script
# Quick health verification for production deployment

set -e

echo "======================================"
echo "SplitBase Health Check"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0
WARNINGS=0

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_code=${3:-200}
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response, expected $expected_code)"
        ((FAILED++))
    fi
}

# Function to check if service is running
check_service() {
    local port=$1
    local name=$2
    
    echo -n "Checking $name on port $port... "
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✓ Running${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Not running${NC}"
        ((FAILED++))
    fi
}

# Get base URL from environment or use localhost
BASE_URL=${NEXT_PUBLIC_APP_URL:-"http://localhost:3000"}

echo "Base URL: $BASE_URL"
echo ""

# 1. Check if Next.js app is running
echo "1. Application Status"
echo "----------------------"
check_service 3000 "Next.js Application"
echo ""

# 2. Check critical API endpoints
echo "2. API Endpoints"
echo "----------------------"
check_endpoint "$BASE_URL/api/system/status" "System Status API" 
check_endpoint "$BASE_URL/api/escrow/health" "Health Check API"
check_endpoint "$BASE_URL/robots.txt" "Robots.txt"
check_endpoint "$BASE_URL/sitemap.xml" "Sitemap"
echo ""

# 3. Check environment variables
echo "3. Environment Variables"
echo "----------------------"

check_env_var() {
    local var_name=$1
    local required=${2:-true}
    
    echo -n "Checking $var_name... "
    
    if [ -z "${!var_name}" ]; then
        if [ "$required" = true ]; then
            echo -e "${RED}✗ Missing${NC}"
            ((FAILED++))
        else
            echo -e "${YELLOW}⚠ Optional (not set)${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${GREEN}✓ Set${NC}"
        ((PASSED++))
    fi
}

check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env_var "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"
check_env_var "ESCROW_ENCRYPTION_KEY"
check_env_var "RESEND_API_KEY" false
check_env_var "NEXT_PUBLIC_FROM_EMAIL" false
echo ""

# 4. Check critical files
echo "4. Critical Files"
echo "----------------------"

check_file() {
    local file=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ Exists${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Missing${NC}"
        ((FAILED++))
    fi
}

check_file "app/.env.local" ".env.local"
check_file "app/package.json" "package.json"
check_file "Dockerfile" "Dockerfile"
check_file "docker-compose.yml" "docker-compose.yml"
echo ""

# 5. Database migrations check
echo "5. Database Migrations"
echo "----------------------"

check_file "supabase-migration.sql" "Base Migration"
check_file "supabase-escrow-migration.sql" "Escrow Migration"
check_file "supabase-escrow-custody-migration.sql" "Custody Migration"
check_file "supabase-custody-audit-migration.sql" "Audit Migration"
check_file "supabase-rate-limit-migration.sql" "Rate Limit Migration"
check_file "supabase-notifications-migration.sql" "Notifications Migration"
check_file "supabase-retry-migration.sql" "Retry Migration"
check_file "supabase-performance-migration.sql" "Performance Migration"
check_file "supabase-error-logs-migration.sql" "Error Logs Migration"
echo ""

# 6. Node modules check
echo "6. Dependencies"
echo "----------------------"

echo -n "Checking node_modules... "
if [ -d "app/node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Not installed (run: cd app && npm install)${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo "======================================"
echo "Health Check Summary"
echo "======================================"
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the errors above.${NC}"
    echo ""
    exit 1
fi

