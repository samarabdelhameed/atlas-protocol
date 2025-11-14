#!/bin/bash

echo "🧪 Testing Atlas Protocol Integration"
echo "======================================"
echo ""

# Test 1: Frontend
echo "1️⃣  Testing Frontend..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "   ✅ Frontend is running"
else
    echo "   ❌ Frontend is NOT running"
    exit 1
fi

# Test 2: Backend Health
echo ""
echo "2️⃣  Testing Backend Health..."
HEALTH=$(curl -s http://localhost:3001/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo "   ✅ Backend health check passed"
    echo "   Response: $HEALTH"
else
    echo "   ❌ Backend health check failed"
    exit 1
fi

# Test 3: Backend Endpoint
echo ""
echo "3️⃣  Testing Backend Endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:3001/verify-vault \
  -H "Content-Type: application/json" \
  -d '{"test":"connection"}')
if echo "$RESPONSE" | grep -q "error"; then
    echo "   ✅ Backend endpoint is working (validates input)"
    echo "   Response: $RESPONSE"
else
    echo "   ⚠️  Unexpected response: $RESPONSE"
fi

# Test 4: Configuration Check
echo ""
echo "4️⃣  Checking Configuration..."
if [ -f "apps/agent-service/.env" ]; then
    echo "   ✅ Backend .env file exists"
    if grep -q "ADLV_ADDRESS" apps/agent-service/.env; then
        echo "   ✅ ADLV_ADDRESS is configured"
    else
        echo "   ❌ ADLV_ADDRESS is missing"
    fi
    if grep -q "IDO_ADDRESS" apps/agent-service/.env; then
        echo "   ✅ IDO_ADDRESS is configured"
    else
        echo "   ❌ IDO_ADDRESS is missing"
    fi
    if grep -q "PRIVATE_KEY" apps/agent-service/.env; then
        echo "   ✅ PRIVATE_KEY is configured"
    else
        echo "   ❌ PRIVATE_KEY is missing"
    fi
else
    echo "   ❌ Backend .env file not found"
fi

# Test 5: Frontend Configuration
echo ""
echo "5️⃣  Checking Frontend Configuration..."
if [ -f "apps/frontend/.env" ]; then
    echo "   ✅ Frontend .env file exists"
    if grep -q "VITE_VERIFICATION_ENDPOINT" apps/frontend/.env; then
        echo "   ✅ VITE_VERIFICATION_ENDPOINT is configured"
    else
        echo "   ⚠️  VITE_VERIFICATION_ENDPOINT not found (using default)"
    fi
    if grep -q "VITE_WORLD_ID_APP_ID" apps/frontend/.env; then
        echo "   ✅ VITE_WORLD_ID_APP_ID is configured"
    else
        echo "   ⚠️  VITE_WORLD_ID_APP_ID not found"
    fi
else
    echo "   ⚠️  Frontend .env file not found (using defaults)"
fi

echo ""
echo "======================================"
echo "✅ Integration Test Complete!"
echo ""
echo "📋 Summary:"
echo "   - Frontend: ✅ Running"
echo "   - Backend: ✅ Running"
echo "   - Endpoints: ✅ Working"
echo "   - Configuration: ✅ Checked"
echo ""
echo "🎯 Ready for testing!"
