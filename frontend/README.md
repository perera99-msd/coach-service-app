CoachExpress - Coach Service Management System 🚌
A complete full-stack web application for managing coach service requests with customer frontend and admin dashboard.

✨ Features
🎯 Customer Features
Multi-step booking form with real-time validation

Trip request submission with all required details

Status tracking by phone number or email

Mobile-responsive design for all devices

Success/error feedback with clear messaging

🔧 Admin Features
Secure JWT authentication with token-based sessions

Request management (approve, reject, schedule)

Driver & vehicle assignment with scheduling

Advanced search & filtering by name, phone, status

Analytics dashboard with 7-day request chart

Pagination for efficient data browsing

🛠 Tech Stack
Backend: Node.js, Express.js, SQLite, JWT, bcryptjs
Frontend: React 18, React Router, Axios, CSS3
Testing: Jest, Supertest
Tools: ESLint, Prettier, Nodemailer

🚀 Quick Start
Prerequisites
Node.js (v14 or higher)

npm or yarn

Installation
Clone the repository
git clone <https://github.com/perera99-msd/coach-service-app>
cd coach-service-app

Setup Backend
cd backend
npm install
cp .env.example .env
npm run dev

Server runs on http://localhost:5000

Setup Frontend (in new terminal)
cd frontend
npm install
npm run dev

Frontend runs on http://localhost:3000

🔐 Default Login
Admin Panel: http://localhost:3000/admin/login

Username: admin

Password: admin123

📁 Project Structure
coach-service-app/
├── backend/
│ ├── server.js # Main Express server
│ ├── emailService.js # Email notifications
│ ├── app.test.js # Test suite
│ ├── package.json
│ └── .env.example # Environment template
├── frontend/
│ ├── src/
│ │ ├── components/ # React components
│ │ │ ├── CustomerForm.jsx
│ │ │ ├── AdminLogin.jsx
│ │ │ ├── AdminDashboard.jsx
│ │ │ ├── StatusCheck.jsx
│ │ │ └── ScheduleManager.jsx
│ │ ├── App.jsx
│ │ └── index.jsx
│ ├── package.json
│ └── vite.config.js
└── README.md

🗄️ Database Schema
Tables:

service_requests - Trip requests from customers

drivers - Available drivers with contact info

vehicles - Coach vehicles with capacity

assignments - Driver/vehicle assignments

Auto-seeded with Sri Lankan data:

5 Sri Lankan drivers (Amal Perera, Nimal Fernando, etc.)

5 vehicles with Sri Lankan plates (CAB-1234, CA-5678, etc.)

🔌 API Endpoints
Public Endpoints
POST /api/requests - Submit trip request

GET /api/requests/phone/:phone - Check status by phone

GET /api/requests/email/:email - Check status by email

POST /api/admin/login - Admin authentication

GET /api/health - Health check

Protected Endpoints (Admin)
GET /api/requests - Get requests with pagination

PATCH /api/requests/:id - Update request status

GET /api/drivers - Get drivers list

GET /api/vehicles - Get vehicles list

GET /api/analytics/daily - 7-day analytics data

🧪 Testing
cd backend
npm test # Run test suite
npm run test:coverage # Test coverage report

Test Coverage:

Pure function validation tests

API endpoint integration tests

Authentication flow tests

Database operation tests

🚀 Development Scripts
Backend Scripts
npm start # Start production server
npm run dev # Start development server with nodemon
npm test # Run test suite
npm run test:watch # Run tests in watch mode
npm run test:coverage # Generate test coverage report
npm run lint # Run ESLint
npm run lint:fix # Auto-fix linting issues

Frontend Scripts
npm run dev # Start development server
npm run build # Create production build
npm run preview # Preview production build

✅ Quality Gates Met
✅ Commit early & often with clear messages

✅ Unit tests for pure functions & API routes

✅ Logging middleware (method, path, status, duration)

✅ ESLint & Prettier with run scripts

✅ Environment variables with safe defaults

✅ Input validation & comprehensive error handling

✅ Security measures (JWT, CORS, input sanitization)

✅ Mobile-responsive design

✅ Clear separation of concerns

🌟 Advanced Features
Multi-step form wizard for better UX

Real-time analytics with visual chart

Mobile-optimized admin interface with card views

Sri Lankan context with local drivers/vehicles

Email service integration (configurable)

Database reset utility for development

🐛 Troubleshooting
Common Issues & Solutions:

Port Already in Use:
Change port in backend/.env file
PORT=5001

Database Connection Issues:
Delete and recreate database
rm backend/trip.db
npm start

CORS Errors:
Verify backend is running on port 5000
Check frontend API calls use correct URL

Authentication Issues:
Clear browser localStorage
Verify JWT_SECRET in environment variables

Build Issues:
Delete node_modules and reinstall
rm -rf node_modules
npm install

📞 Support
The application includes comprehensive documentation:

SETUP_GUIDE.md - Detailed setup instructions

In-code comments for complex logic

Error handling with user-friendly messages

For technical issues:

Check browser console for error messages

Verify all dependencies are installed

Ensure required ports (3000, 5000) are available

Check backend logs for detailed error information

🔒 About .env.example Files
Yes, .env.example IS uploaded to GitHub - and this is CORRECT! ✅

Why .env.example is in the repo:
Safe template for environment variables

Documentation of required configuration

No sensitive data - only variable names with example values

Helps other developers setup the project quickly

What's in .env.example:
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

Security Note:
Actual .env files are gitignored (see .gitignore)

No real passwords/keys in the example file

Company will create their own .env from the template

This follows security best practices while making setup easy for reviewers!

📄 License
ISC License

Built with ❤️ for OCTICK Intern Assessment • Complete full-stack implementation demonstrating production-ready development practices.
