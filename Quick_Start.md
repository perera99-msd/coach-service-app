🚀 How to Run CoachExpress Application

📦 Quick Installation Guide

Step 1: Download and Extract
⬇️ Download the project ZIP file
📁 Extract to your preferred directory

Step 2: Backend Setup
💻 Open terminal/command prompt and run:
cd backend
npm install
cp .env.example .env
npm run dev
✅ Backend will start on http://localhost:5000

Step 3: Frontend Setup
💻 Open NEW terminal/command prompt and run:
cd frontend
npm install
npm run dev
✅ Frontend will start on http://localhost:3000

🌐 Access Points
👥 Customer App: http://localhost:3000
🔧 Admin Panel: http://localhost:3000/admin/login
❤️ API Health: http://localhost:5000/api/health

🔐 Demo Login
Admin Credentials:
👤 Username: admin
🔑 Password: admin123

🧪 Testing the App

Submit a Trip Request
🌐 Go to http://localhost:3000
🚗 Click "Book Your Trip"
📝 Fill out the multi-step form
✅ Submit request

Check Request Status
🌐 Go to http://localhost:3000/status
📞 Enter phone number used in booking
👀 View trip status

Admin Management
🌐 Go to http://localhost:3000/admin/login
🔐 Login with admin credentials
📊 View, approve, reject, or schedule requests
📈 Check analytics dashboard

🔧 Troubleshooting

Port Already in Use?
Backend:
Change PORT in backend/.env to 5001

Frontend:
Vite will automatically use next available port

Database Issues?
cd backend
rm trip.db
npm run dev

Installation Problems?
Delete node_modules and reinstall:
rm -rf node_modules
npm install

❓ Need Help?
🔍 Check browser console for errors
⚡ Ensure both backend and frontend are running
🚪 Verify ports 3000 and 5000 are available
📋 Check terminal logs for detailed information

⏱️ Time to setup: ~5 minutes
🏆 Built for OCTICK Intern Assessment
