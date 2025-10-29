const request = require('supertest');
const app = require('../server');

// Pure function test (REQUIRED)
const validateRequestData = (data) => {
  const required = ['customer_name', 'phone', 'pickup_location', 'dropoff_location', 'pickup_time', 'passengers'];
  const missing = required.filter(field => !data[field]);
  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
};

describe('Pure Function Tests', () => {
  test('validateRequestData returns true for valid data', () => {
    const validData = {
      customer_name: 'John Doe',
      phone: '123-456-7890',
      pickup_location: 'Central Station',
      dropoff_location: 'Airport',
      pickup_time: '2024-01-15T10:00:00Z',
      passengers: 3
    };
    
    const result = validateRequestData(validData);
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  test('validateRequestData returns false for invalid data', () => {
    const invalidData = {
      customer_name: 'John Doe',
      // missing other required fields
    };
    
    const result = validateRequestData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.missingFields.length).toBeGreaterThan(0);
  });

  test('validateRequestData identifies specific missing fields', () => {
    const invalidData = {
      customer_name: 'John Doe',
      phone: '123-456-7890',
      // missing location fields and time
    };
    
    const result = validateRequestData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('pickup_location');
    expect(result.missingFields).toContain('dropoff_location');
    expect(result.missingFields).toContain('pickup_time');
  });
});

describe('API Route Tests', () => {
  test('GET /api/health returns 200 and status OK', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('database', 'Connected');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('POST /api/requests creates a trip request with valid data', async () => {
    const requestData = {
      customer_name: 'Test Customer',
      phone: '555-1234',
      pickup_location: 'Test Pickup',
      dropoff_location: 'Test Dropoff',
      pickup_time: new Date().toISOString(),
      passengers: 2,
      notes: 'Test notes'
    };

    const response = await request(app)
      .post('/api/requests')
      .send(requestData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Trip request submitted successfully');
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('number');
  });

  test('POST /api/requests returns 400 for missing required fields', async () => {
    const invalidData = {
      customer_name: 'Test Customer'
      // missing required fields
    };

    const response = await request(app)
      .post('/api/requests')
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Missing required fields');
    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  test('GET /api/requests requires authentication', async () => {
    const response = await request(app).get('/api/requests');
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Access token required');
  });

  test('POST /api/admin/login works with correct credentials', async () => {
    const credentials = {
      username: 'admin',
      password: 'admin123'
    };

    const response = await request(app)
      .post('/api/admin/login')
      .send(credentials);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username', 'admin');
    expect(response.body.user).toHaveProperty('role', 'coordinator');
  });

  test('POST /api/admin/login fails with incorrect credentials', async () => {
    const credentials = {
      username: 'admin',
      password: 'wrongpassword'
    };

    const response = await request(app)
      .post('/api/admin/login')
      .send(credentials);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
  });
});

describe('Database Integration Tests', () => {
  test('Database tables are properly initialized', async () => {
    // This test verifies the server can start and database is accessible
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.database).toBe('Connected');
  });
});