const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const { sendStatusUpdateEmail, sendWelcomeEmail } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

app.use(cors());
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, req.body);
  
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
    email TEXT NOT NULL,
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
    if (row && row.count === 0) {
      db.run(`INSERT INTO drivers (name, phone) VALUES 
        ('Amal Perera', '077-1234567'),
        ('Nimal Fernando', '076-2345678'),
        ('Kumara Silva', '075-3456789'),
        ('Sampath Bandara', '078-4567890'),
        ('Priyantha Rathnayake', '071-5678901')`);
      console.log('✅ Sri Lankan drivers added to database');
    }
  });

  db.get("SELECT COUNT(*) as count FROM vehicles", (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO vehicles (plate, capacity) VALUES 
        ('CAB-1234', 4),
        ('CA-5678', 6),
        ('CAB-9012', 8),
        ('CA-3456', 12),
        ('CAB-7890', 16)`);
      console.log('✅ Sri Lankan vehicles added to database');
    }
  });
});

// Reset database endpoint for development
app.post('/api/dev/reset-database', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Resetting database with Sri Lankan data...');
    
    db.serialize(() => {
      // Drop tables in correct order
      db.run('DROP TABLE IF EXISTS assignments');
      db.run('DROP TABLE IF EXISTS service_requests');
      db.run('DROP TABLE IF EXISTS drivers');
      db.run('DROP TABLE IF EXISTS vehicles');

      // Recreate tables
      db.run(`CREATE TABLE service_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        pickup_location TEXT NOT NULL,
        dropoff_location TEXT NOT NULL,
        pickup_time DATETIME NOT NULL,
        passengers INTEGER NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending'
      )`);

      db.run(`CREATE TABLE drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL
      )`);

      db.run(`CREATE TABLE vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT NOT NULL UNIQUE,
        capacity INTEGER NOT NULL
      )`);

      db.run(`CREATE TABLE assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER,
        driver_id INTEGER,
        vehicle_id INTEGER,
        scheduled_time DATETIME,
        FOREIGN KEY(request_id) REFERENCES service_requests(id),
        FOREIGN KEY(driver_id) REFERENCES drivers(id),
        FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
      )`);

      // Insert Sri Lankan data
      db.run(`INSERT INTO drivers (name, phone) VALUES 
        ('Amal Perera', '077-1234567'),
        ('Nimal Fernando', '076-2345678'),
        ('Kumara Silva', '075-3456789'),
        ('Sampath Bandara', '078-4567890'),
        ('Priyantha Rathnayake', '071-5678901')`);

      db.run(`INSERT INTO vehicles (plate, capacity) VALUES 
        ('CAB-1234', 4),
        ('CA-5678', 6),
        ('CAB-9012', 8),
        ('CA-3456', 12),
        ('CAB-7890', 16)`);

      console.log('✅ Database reset with Sri Lankan data complete!');
    });

    res.json({ message: 'Database reset with Sri Lankan data' });
  } else {
    res.status(403).json({ message: 'Not allowed in production' });
  }
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
  const { customer_name, email, phone, pickup_location, dropoff_location, pickup_time, passengers, notes } = req.body;

  // Enhanced validation
  const requiredFields = { customer_name, email, phone, pickup_location, dropoff_location, pickup_time, passengers };
  const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      errors: missingFields.map(field => `${field} is required`)
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format',
      errors: ['Please provide a valid email address']
    });
  }

  const sql = `INSERT INTO service_requests 
    (customer_name, email, phone, pickup_location, dropoff_location, pickup_time, passengers, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [customer_name, email, phone, pickup_location, dropoff_location, pickup_time, passengers, notes || ''], 
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error', errors: [err.message] });
      }
      
      // Send welcome email
      sendWelcomeEmail(email, customer_name, this.lastID);
      
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
    whereClause = 'WHERE (customer_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
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

    // If scheduling, create or update assignment
    if (status === 'scheduled' && driver_id && vehicle_id && scheduled_time) {
      // Check if assignment already exists
      db.get('SELECT * FROM assignments WHERE request_id = ?', [id], (err, assignment) => {
        if (assignment) {
          // Update existing assignment
          db.run(`UPDATE assignments SET driver_id = ?, vehicle_id = ?, scheduled_time = ? WHERE request_id = ?`,
            [driver_id, vehicle_id, scheduled_time, id]);
        } else {
          // Create new assignment
          db.run(`INSERT INTO assignments (request_id, driver_id, vehicle_id, scheduled_time) VALUES (?, ?, ?, ?)`,
            [id, driver_id, vehicle_id, scheduled_time]);
        }
      });
    }

    // Send email notification for status changes
    if (['approved', 'rejected', 'scheduled'].includes(status)) {
      db.get('SELECT customer_name, email FROM service_requests WHERE id = ?', [id], (err, row) => {
        if (!err && row && row.email) {
          sendStatusUpdateEmail(row.email, row.customer_name, status, id);
        }
      });
    }

    res.json({ message: 'Request updated successfully' });
  });
});

// 5. DELETE request endpoint
app.delete('/api/requests/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM service_requests WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Also delete any assignments
    db.run('DELETE FROM assignments WHERE request_id = ?', [id]);
    
    res.json({ message: 'Request deleted successfully' });
  });
});

// 6. Get drivers and vehicles
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

// 7. Analytics endpoint - last 7 days
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

// 8. Get single request with assignment details
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

// 9. Get request by phone number (for customers to check status)
app.get('/api/requests/phone/:phone', (req, res) => {
  const { phone } = req.params;
  
  const sql = `
    SELECT sr.*, a.scheduled_time, d.name as driver_name, v.plate as vehicle_plate
    FROM service_requests sr
    LEFT JOIN assignments a ON sr.id = a.request_id
    LEFT JOIN drivers d ON a.driver_id = d.id
    LEFT JOIN vehicles v ON a.vehicle_id = v.id
    WHERE sr.phone = ?
    ORDER BY sr.created_at DESC
  `;
  
  db.all(sql, [phone], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// 10. Get request by email (alternative lookup)
app.get('/api/requests/email/:email', (req, res) => {
  const { email } = req.params;
  
  const sql = `
    SELECT sr.*, a.scheduled_time, d.name as driver_name, v.plate as vehicle_plate
    FROM service_requests sr
    LEFT JOIN assignments a ON sr.id = a.request_id
    LEFT JOIN drivers d ON a.driver_id = d.id
    LEFT JOIN vehicles v ON a.vehicle_id = v.id
    WHERE sr.email = ?
    ORDER BY sr.created_at DESC
  `;
  
  db.all(sql, [email], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// 11. Get all assignments/schedules (CORRECTED VERSION)
app.get('/api/assignments', authenticateToken, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT a.*, 
           sr.customer_name, sr.phone, sr.email, sr.pickup_location, sr.dropoff_location,
           d.name as driver_name, d.phone as driver_phone,
           v.plate as vehicle_plate, v.capacity as vehicle_capacity
    FROM assignments a
    JOIN service_requests sr ON a.request_id = sr.id
    JOIN drivers d ON a.driver_id = d.id
    JOIN vehicles v ON a.vehicle_id = v.id
    ORDER BY a.scheduled_time DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `SELECT COUNT(*) as total FROM assignments`;

  db.get(countSql, [], (err, countResult) => {
    if (err) {
      console.error('Error counting assignments:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    db.all(sql, [parseInt(limit), parseInt(offset)], (err, rows) => {
      if (err) {
        console.error('Error fetching assignments:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }

      res.json({
        assignments: rows,
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

// 12. Update assignment (CORRECTED VERSION)
app.patch('/api/assignments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { driver_id, vehicle_id, scheduled_time } = req.body;

  const updates = [];
  const params = [];

  if (driver_id !== undefined) {
    updates.push('driver_id = ?');
    params.push(driver_id);
  }
  if (vehicle_id !== undefined) {
    updates.push('vehicle_id = ?');
    params.push(vehicle_id);
  }
  if (scheduled_time !== undefined) {
    updates.push('scheduled_time = ?');
    params.push(scheduled_time);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  params.push(id);

  const query = `UPDATE assignments SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, params, function(err) {
    if (err) {
      console.error('Error updating assignment:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json({ message: 'Assignment updated successfully' });
  });
});

// 13. Delete assignment
app.delete('/api/assignments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM assignments WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json({ message: 'Assignment deleted successfully' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Check database connection
  db.get('SELECT 1 as test', (err) => {
    const dbStatus = err ? 'Disconnected' : 'Connected';
    res.json({ 
      status: 'OK', 
      database: dbStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
});

// Only start server if this file is run directly (not in tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Admin login: http://localhost:${PORT}/api/admin/login`);
    console.log(`🔄 Reset database: http://localhost:${PORT}/api/dev/reset-database (DEV ONLY)`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Ready' : 'Not configured'}`);
  });
  
  module.exports = server;
} else {
  // Export just the app for testing
  module.exports = app;
}