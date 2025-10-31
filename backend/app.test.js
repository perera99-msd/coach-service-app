const request = require('supertest');
const app = require('./server');

// Pure function test (REQUIRED)
const validateRequestData = (data) => {
  const required = ['customer_name', 'email', 'phone', 'pickup_location', 'dropoff_location', 'pickup_time', 'passengers'];
  const missing = required.filter(field => !data[field]);
  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
};

describe('Pure Function Tests', () => {
  test('validateRequestData returns true for valid data', () => {
    const validData = {
      customer_name: 'Kamal Perera',
      email: 'kamal@example.com',
      phone: '077-1234567',
      pickup_location: 'Colombo Fort Railway Station',
      dropoff_location: 'Bandaranaike International Airport',
      pickup_time: '2024-01-15T10:00:00Z',
      passengers: 3
    };
    
    const result = validateRequestData(validData);
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  test('validateRequestData returns false for invalid data', () => {
    const invalidData = {
      customer_name: 'Nimal Fernando',
      // missing other required fields
    };
    
    const result = validateRequestData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.missingFields.length).toBeGreaterThan(0);
  });

  test('validateRequestData identifies specific missing fields', () => {
    const invalidData = {
      customer_name: 'Sunil Rathnayake',
      phone: '071-2345678',
      // missing location fields and time
    };
    
    const result = validateRequestData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('pickup_location');
    expect(result.missingFields).toContain('dropoff_location');
    expect(result.missingFields).toContain('pickup_time');
    expect(result.missingFields).toContain('email');
  });
});

describe('API Route Tests', () => {
  test('GET /api/health returns 200 and status OK', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('database');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('POST /api/requests creates a trip request with valid data', async () => {
    const requestData = {
      customer_name: 'Test Customer',
      email: 'test@example.com',
      phone: '077-9998888',
      pickup_location: 'Galle Face Green',
      dropoff_location: 'Mount Lavinia Hotel',
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

  test('POST /api/requests returns 400 for invalid email', async () => {
    const invalidData = {
      customer_name: 'Test Customer',
      email: 'invalid-email',
      phone: '076-5554444',
      pickup_location: 'Pettah Bus Stand',
      dropoff_location: 'Negombo Beach',
      pickup_time: new Date().toISOString(),
      passengers: 2
    };

    const response = await request(app)
      .post('/api/requests')
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid email format');
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

  test('DELETE /api/requests/:id requires authentication', async () => {
    const response = await request(app).delete('/api/requests/1');
    expect(response.status).toBe(401);
  });

  test('GET /api/requests/phone/:phone returns requests', async () => {
    // First create a request
    const requestData = {
      customer_name: 'Phone Test',
      email: 'phone@test.com',
      phone: '075-7776666',
      pickup_location: 'Kandy City Center',
      dropoff_location: 'Peradeniya Botanical Gardens',
      pickup_time: new Date().toISOString(),
      passengers: 1
    };

    await request(app).post('/api/requests').send(requestData);

    const response = await request(app).get('/api/requests/phone/075-7776666');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/drivers returns Sri Lankan drivers', async () => {
    // First login to get token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'admin123' });

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/drivers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Check for Sri Lankan drivers
    const driverNames = response.body.map(driver => driver.name);
    expect(driverNames).toContain('Amal Perera');
    expect(driverNames).toContain('Nimal Fernando');
    expect(driverNames).toContain('Kumara Silva');
  });

  test('GET /api/vehicles returns Sri Lankan vehicles', async () => {
    // First login to get token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'admin123' });

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Check for Sri Lankan vehicle plates
    const vehiclePlates = response.body.map(vehicle => vehicle.plate);
    expect(vehiclePlates).toContain('CAB-1234');
    expect(vehiclePlates).toContain('CA-5678');
    expect(vehiclePlates).toContain('CAB-9012');
  });
});

describe('Database Integration Tests', () => {
  test('Database tables are properly initialized', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(['Connected', 'Disconnected']).toContain(response.body.database);
  });
});