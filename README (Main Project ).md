## Coach Service Request App 🚌

A full-stack web application for a coach company to manage trip requests with customer frontend and admin dashboard.

🚀 Features
Customer Features
Submit trip requests with all required details (name, phone, pickup/dropoff locations, time, passengers, notes)

Client-side form validation with user-friendly error messages

Success/error feedback with clear messaging

Responsive design that works on all devices

Admin Features
Secure JWT authentication with token-based sessions

View all trip requests with pagination (10 requests per page)

Search functionality by customer name or phone number

Filter by status (pending/approved/rejected/scheduled)

Update request status with inline approve/reject actions

Schedule trips with driver and vehicle assignment via modal interface

Analytics dashboard showing requests per day for the last 7 days with visual chart

🛠 Tech Stack
Backend
Node.js + Express.js - Runtime and web framework

SQLite - Database with automatic initialization

JWT - JSON Web Tokens for authentication

bcryptjs - Password security

CORS - Cross-origin resource sharing

Jest + Supertest - Testing framework

ESLint + Prettier - Code quality and formatting

Frontend
React.js 18 - UI framework with hooks

React Router DOM - Client-side routing

Axios - HTTP client for API calls

CSS3 - Responsive styling with modern design

📋 Prerequisites
Node.js (v14 or higher)

npm or yarn package manager

🏃‍♂️ Quick Start
Backend Setup
cd backend
npm install
cp .env.example .env
npm start

Backend server runs on http://localhost:5000

Frontend Setup
cd frontend
npm install
npm start

Frontend runs on http://localhost:3000

🔌 API Endpoints
Public Endpoints
POST /api/requests - Submit trip request (customer)

POST /api/admin/login - Admin authentication

GET /api/health - Health check endpoint

Protected Endpoints (Require JWT)
GET /api/requests - Get requests with search, pagination, and filtering

PATCH /api/requests/:id - Update request status and schedule trips

GET /api/drivers - Get available drivers list

GET /api/vehicles - Get available vehicles list

GET /api/analytics/daily - Get daily request analytics for last 7 days

GET /api/requests/:id - Get single request with assignment details

🗄️ Database Schema
Tables
service_requests - id, created_at, customer_name, phone, pickup_location, dropoff_location, pickup_time, passengers, notes, status

drivers - id, name, phone

vehicles - id, plate, capacity

assignments - id, request_id, driver_id, vehicle_id, scheduled_time

Seed Data (Auto-populated)
3 Drivers: John Driver, Jane Smith, Mike Johnson

3 Vehicles: ABC123 (4 seats), XYZ789 (6 seats), DEF456 (8 seats)

🔐 Demo Credentials
Admin Access:

Username: admin

Password: admin123

📁 Project Structure
coach-service-app/
├── backend/
│ ├── server.js
│ ├── package.json
│ ├── .env.example
│ ├── .eslintrc.js
│ ├── app.test.js
│ └── trip.db
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── CustomerForm.jsx
│ │ │ ├── AdminLogin.jsx
│ │ │ └── AdminDashboard.jsx
│ │ ├── App.jsx
│ │ └── index.jsx
│ ├── package.json
│ └── public/
└── README.md

🧪 Testing
Test Suite Includes:
Pure function tests for request validation

API route tests for all endpoints

Authentication flow tests

Database integration tests

Run Tests:
cd backend
npm test
npm run test:watch
npm run test:coverage

Test Results
Test Suites: 1 passed, 1 total
Tests: 10 passed, 10 total
Time: 1.558 s

🚀 Development Scripts
Backend Scripts
npm start
npm run dev
npm test
npm run test:watch
npm run lint
npm run lint:fix
npm run format

Frontend Scripts
npm start
npm run build
npm test

✅ Quality Gates Met
Commit early and often with clear messages

Unit tests for pure function and API routes

Logging middleware (method, path, status, duration)

Linter and formatter with run scripts

Environment variables with safe defaults

Clear separation of concerns

Input validation and error handling

Security measures implemented

Documentation complete

🔒 Security Features
JWT token-based authentication

Environment variables for sensitive data

Input validation and sanitization

CORS configuration

SQL injection protection

Password hashing

📱 Responsive Design
The application features a fully responsive design that works seamlessly on:

Desktop computers

Tablets

Mobile devices

🎯 User Workflows
Customer Journey:
Visit application homepage

Fill out trip request form with validation

Submit and receive instant confirmation

Admin Workflow:
Login with secure credentials

View dashboard with analytics and request overview

Search and filter requests as needed

Update status with inline actions

Schedule trips by assigning drivers and vehicles

🚀 Deployment Ready
The application includes all necessary configurations for production deployment:

Environment-specific configuration

Health check endpoints

Comprehensive error handling

Database migration and seeding system

Production build scripts

🐛 Troubleshooting
Common Issues & Solutions:
Port Already in Use
Change port in backend/.env file
PORT=5001

Database Connection Issues
Delete and recreate database
rm backend/trip.db
npm start

CORS Errors

Verify backend is running on port 5000

Check frontend API calls use correct URL

Authentication Issues

Clear browser localStorage

Verify JWT_SECRET in environment variables

📞 Support
For technical issues:

Check browser console for error messages

Verify all dependencies are installed

Ensure required ports (3000, 5000) are available

Check backend logs for detailed error information

📄 License
ISC License

Built with ❤️ for OCTICK Intern Assessment • Complete full-stack implementation
