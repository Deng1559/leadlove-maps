#!/bin/bash

# Google Maps Scraper Webhook Test Script
# Usage: ./test-webhook.sh

BASE_URL="http://localhost:3000"
WEBHOOK_ENDPOINT="/api/webhook/google-maps-scraper"
STATUS_ENDPOINT="/api/webhook/google-maps-status"

echo "🧪 Testing Google Maps Scraper Webhook API"
echo "=========================================="

# Test 1: Start scraping
echo ""
echo "📡 Step 1: Starting Google Maps scraping..."
echo "Request Data:"
cat << 'EOF'
{
  "businessType": "restaurants",
  "location": "New York, NY",
  "serviceOffering": "digital marketing",
  "maxResults": 5,
  "userId": "test-curl-user",
  "userName": "Test cURL User"
}
EOF

echo ""
echo "Response:"
RESPONSE=$(curl -s -X POST "${BASE_URL}${WEBHOOK_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "restaurants",
    "location": "New York, NY", 
    "serviceOffering": "digital marketing",
    "maxResults": 5,
    "userId": "test-curl-user",
    "userName": "Test cURL User"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract workflow ID if available
WORKFLOW_ID=$(echo "$RESPONSE" | jq -r '.workflowId' 2>/dev/null)

if [ "$WORKFLOW_ID" != "null" ] && [ "$WORKFLOW_ID" != "" ]; then
    echo ""
    echo "✅ Scraper request successful. Workflow ID: $WORKFLOW_ID"
    
    # Test 2: Check status
    echo ""
    echo "⏳ Step 2: Checking status..."
    echo "Status Request:"
    echo "{\"workflowId\": \"$WORKFLOW_ID\"}"
    
    echo ""
    echo "Status Response:"
    curl -s -X POST "${BASE_URL}${STATUS_ENDPOINT}" \
      -H "Content-Type: application/json" \
      -d "{\"workflowId\": \"$WORKFLOW_ID\"}" | jq '.' 2>/dev/null || curl -s -X POST "${BASE_URL}${STATUS_ENDPOINT}" \
      -H "Content-Type: application/json" \
      -d "{\"workflowId\": \"$WORKFLOW_ID\"}"
else
    echo ""
    echo "ℹ️  No workflow ID returned - operation may have completed immediately"
fi

# Test 3: GET endpoint info
echo ""
echo "📋 Step 3: Testing info endpoint..."
echo "Info Response:"
curl -s -X GET "${BASE_URL}${WEBHOOK_ENDPOINT}" | jq '.' 2>/dev/null || curl -s -X GET "${BASE_URL}${WEBHOOK_ENDPOINT}"

# Test 4: Backwards compatibility
echo ""
echo "🔄 Step 4: Testing backwards compatibility..."
echo "Testing existing API with freeMode=true..."
echo ""
echo "Response:"
curl -s -X POST "${BASE_URL}/api/leadlove/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "restaurants",
    "location": "New York, NY",
    "freeMode": true,
    "maxResults": 5
  }' | jq '.' 2>/dev/null || curl -s -X POST "${BASE_URL}/api/leadlove/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "restaurants",
    "location": "New York, NY", 
    "freeMode": true,
    "maxResults": 5
  }'

echo ""
echo "=========================================="
echo "🏁 Tests completed"
echo ""
echo "📝 Note: Make sure the development server is running with 'npm run dev'"
echo "🌐 Visit http://localhost:3000/test-webhook for a web interface"