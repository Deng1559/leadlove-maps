# Google Maps Scraper Webhook API

This document describes the webhook-based Google Maps scraper API endpoints that provide free access without the credit system.

## Endpoints

### 1. Google Maps Scraper Webhook

**URL:** `POST /api/webhook/google-maps-scraper`

**Description:** Scrapes Google Maps for business leads based on the provided criteria.

**Request Body:**
```json
{
  "businessType": "restaurants",
  "location": "New York, NY",
  "serviceOffering": "digital marketing", // optional
  "countryCode": "us", // optional
  "maxResults": 20, // optional, max 50
  "userId": "user-123", // optional
  "userName": "John Doe" // optional
}
```

**Response:**
```json
{
  "success": true,
  "workflowId": "webhook-req-1234567890-abc123",
  "results": [...],
  "metadata": {
    "processingTime": 15000,
    "source": "webhook",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "webhook-req-1234567890-abc123",
    "businessType": "restaurants",
    "location": "New York, NY",
    "serviceOffering": "digital marketing",
    "maxResults": 20,
    "resultsCount": 15
  },
  "estimatedTime": "2-3 minutes",
  "message": "Google Maps scraping completed successfully"
}
```

### 2. Status Check Webhook

**URL:** `POST /api/webhook/google-maps-status`

**Description:** Check the status of a scraping workflow.

**Request Body:**
```json
{
  "workflowId": "webhook-req-1234567890-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "workflowId": "webhook-req-1234567890-abc123",
  "status": "completed",
  "completed": true,
  "progress": 100,
  "currentStep": "Lead generation completed",
  "estimatedTimeRemaining": null,
  "results": [...],
  "metadata": {
    "source": "webhook",
    "timestamp": "2024-01-15T10:32:00.000Z"
  }
}
```

### 3. GET Endpoints (Info/Testing)

**URLs:** 
- `GET /api/webhook/google-maps-scraper`
- `GET /api/webhook/google-maps-status`

**Description:** Returns service information and available endpoints.

## Integration Examples

### cURL Example
```bash
# Start scraping
curl -X POST http://localhost:3000/api/webhook/google-maps-scraper \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "restaurants",
    "location": "New York, NY",
    "maxResults": 10
  }'

# Check status
curl -X POST http://localhost:3000/api/webhook/google-maps-status \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "webhook-req-1234567890-abc123"
  }'
```

### JavaScript/Node.js Example
```javascript
// Start scraping
const response = await fetch('/api/webhook/google-maps-scraper', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    businessType: 'restaurants',
    location: 'New York, NY',
    maxResults: 10
  })
});

const result = await response.json();
console.log('Workflow ID:', result.workflowId);

// Check status
const statusResponse = await fetch('/api/webhook/google-maps-status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    workflowId: result.workflowId
  })
});

const status = await statusResponse.json();
console.log('Status:', status.status);
```

### Python Example
```python
import requests
import json

# Start scraping
payload = {
    "businessType": "restaurants",
    "location": "New York, NY",
    "maxResults": 10
}

response = requests.post(
    'http://localhost:3000/api/webhook/google-maps-scraper',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(payload)
)

result = response.json()
workflow_id = result['workflowId']

# Check status
status_payload = {"workflowId": workflow_id}
status_response = requests.post(
    'http://localhost:3000/api/webhook/google-maps-status',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(status_payload)
)

status = status_response.json()
print(f"Status: {status['status']}")
```

## Updated Existing API (Backwards Compatibility)

The existing `/api/leadlove/generate` and `/api/leadlove/status` endpoints have been updated to support free mode:

**Add `freeMode: true` to the request body to bypass the credit system:**

```json
{
  "businessType": "restaurants",
  "location": "New York, NY",
  "freeMode": true,
  "maxResults": 10
}
```

## Key Features

1. **No Authentication Required**: Webhook endpoints work without user authentication
2. **No Credit System**: All requests are processed for free
3. **Rate Limited**: Maximum 50 results per request
4. **Asynchronous Processing**: Long-running scraping operations with status checking
5. **Backwards Compatible**: Existing API endpoints support free mode
6. **N8N Compatible**: Designed to work seamlessly with N8N workflows

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "User-friendly error description",
  "metadata": {
    "source": "webhook",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing required fields)
- `500`: Internal Server Error
- `503`: Service Unavailable

## Testing

Visit `/test-webhook` in your browser for a web interface to test the webhook endpoints.