import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FullPageLoader from './components/FullPageLoader';
import './styles.css'; // Import the new styles

// Lazy load components for code splitting
const LandingPage = lazy(() => import('./components/LandingPage'));
const CustomerForm = lazy(() => import('./components/CustomerForm'));
const StatusCheck = lazy(() => import('./components/StatusCheck'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

function App() {
  return (
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <Suspense fallback={<FullPageLoader />}>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/book" element={<CustomerForm />} />
            <Route path="/status" element={<StatusCheck />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Suspense>
    </Router>
  );
}

export default App;