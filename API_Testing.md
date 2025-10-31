## 🔌 API Testing

All endpoints can be tested directly:

**Customer Request:**

```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "email": "test@example.com",
    "phone": "077-1234567",
    "pickup_location": "Colombo",
    "dropoff_location": "Kandy",
    "pickup_time": "2024-01-15T10:00:00Z",
    "passengers": 2
  }'
```
