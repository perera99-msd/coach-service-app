const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`Completed ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Database setup
const db = new sqlite3.Database('./trip.db');

// Initialize database tables
db.serialize(() => {
  // Service requests table
  db.run(`CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    pickup_time DATETIME NOT NULL,
    passengers INTEGER NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending'
  )`);

  // Drivers table
  db.run(`CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL
  )`);

  // Vehicles table
  db.run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate TEXT NOT NULL UNIQUE,
    capacity INTEGER NOT NULL
  )`);

  // Assignments table
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    driver_id INTEGER,
    vehicle_id INTEGER,
    scheduled_time DATETIME,
    FOREIGN KEY(request_id) REFERENCES service_requests(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id),
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`);

  // Seed data - only insert if tables are empty
  db.get("SELECT COUNT(*) as count FROM drivers", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO drivers (name, phone) VALUES 
        ('John Driver', '555-0001'),
        ('Jane Smith', '555-0002'),
        ('Mike Johnson', '555-0003')`);
    }
  });

  db.get("SELECT COUNT(*) as count FROM vehicles", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO vehicles (plate, capacity) VALUES 
        ('ABC123', 4),
        ('XYZ789', 6),
        ('DEF456', 8)`);
    }
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// API ROUTES

// 1. Customer submits trip request
app.post('/api/requests', (req, res) => {
  const { customer_name, phone, pickup_location, dropoff_location, pickup_time, passengers, notes } = req.body;

  // Simple validation
  if (!customer_name || !phone || !pickup_location || !dropoff_location || !pickup_time || !passengers) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      errors: ['All fields except notes are required']
    });
  }

  const sql = `INSERT INTO service_requests 
    (customer_name, phone, pickup_location, dropoff_location, pickup_time, passengers, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [customer_name, phone, pickup_location, dropoff_location, pickup_time, passengers, notes || ''], 
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error', errors: [err.message] });
      }
      res.status(201).json({ 
        message: 'Trip request submitted successfully',
        id: this.lastID 
      });
    });
});

// 2. Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple hardcoded admin - meets requirements
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username, role: 'coordinator' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      token, 
      user: { username, role: 'coordinator' } 
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// 3. Get requests with pagination and search
app.get('/api/requests', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  let params = [];
  
  if (search) {
    whereClause = 'WHERE (customer_name LIKE ? OR phone LIKE ?)';
    params = [`%${search}%`, `%${search}%`];
  }
  
  if (status && status !== 'all') {
    whereClause = whereClause ? `${whereClause} AND status = ?` : 'WHERE status = ?';
    params.push(status);
  }

  const countSql = `SELECT COUNT(*) as total FROM service_requests ${whereClause}`;
  const dataSql = `SELECT * FROM service_requests ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  db.get(countSql, params, (err, countResult) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    db.all(dataSql, [...params, parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      
      res.json({
        requests: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// 4. Update request status
app.patch('/api/requests/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, driver_id, vehicle_id, scheduled_time } = req.body;

  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected', 'scheduled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  db.run('UPDATE service_requests SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) return res.status(500).json({ message: 'Database error' });

    // If scheduling, create assignment
    if (status === 'scheduled' && driver_id && vehicle_id && scheduled_time) {
      db.run(`INSERT INTO assignments (request_id, driver_id, vehicle_id, scheduled_time) 
              VALUES (?, ?, ?, ?)`,
        [id, driver_id, vehicle_id, scheduled_time],
        function(err) {
          if (err) {
            console.error('Assignment error:', err);
          }
        });
    }

    res.json({ message: 'Request updated successfully' });
  });
});

// 5. Get drivers and vehicles
app.get('/api/drivers', authenticateToken, (req, res) => {
  db.all('SELECT * FROM drivers ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

app.get('/api/vehicles', authenticateToken, (req, res) => {
  db.all('SELECT * FROM vehicles ORDER BY plate', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// 6. Analytics endpoint - last 7 days
app.get('/api/analytics/daily', authenticateToken, (req, res) => {
  const sql = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM service_requests 
    WHERE created_at >= date('now', '-6 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `;
  
  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    // Ensure we have all 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = rows.find(r => r.date === dateStr);
      last7Days.push({
        date: dateStr,
        count: existing ? existing.count : 0
      });
    }
    
    res.json(last7Days);
  });
});

// 7. Get single request with assignment details
app.get('/api/requests/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT sr.*, a.scheduled_time, d.name as driver_name, v.plate as vehicle_plate
    FROM service_requests sr
    LEFT JOIN assignments a ON sr.id = a.request_id
    LEFT JOIN drivers d ON a.driver_id = d.id
    LEFT JOIN vehicles v ON a.vehicle_id = v.id
    WHERE sr.id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!row) return res.status(404).json({ message: 'Request not found' });
    
    res.json(row);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// Only start server if this file is run directly (not in tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Admin login: http://localhost:${PORT}/api/admin/login`);
  });
  
  module.exports = server;
} else {
  // Export just the app for testing
  module.exports = app;
}