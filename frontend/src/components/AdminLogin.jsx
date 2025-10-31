import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await axios.post('/api/admin/login', credentials);
      localStorage.setItem('token', response.data.token);
      setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      
      setTimeout(() => navigate('/admin/dashboard'), 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid credentials. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e) => {
     setCredentials({...credentials, [e.target.name]: e.target.value});
  };

  return (
    <div className="login-container">
      {/* Image Panel */}
      <div className="login-image-panel animated-fade">
        <Link to="/" className="logo">
          {/* UPDATED LOGO */}
          <img src="/images/logo.png" alt="CoachExpress Logo" className="logo-image" />
          <span className="logo-text">CoachExpress</span>
        </Link>
        <h2>Welcome Back</h2>
        <p>Sign in to manage all customer trip requests, schedules, and analytics.</p>
      </div>

      {/* Form Panel */}
      <div className="login-form-panel">
        <div className="login-box animated">
          <div className="login-header">
            <h2>Admin Portal</h2>
            <p>Sign in to your account</p>
          </div>

          {message.text && (
            <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder="Enter admin username"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* ADDED Back to Home Link */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            <Link to="/">← Back to Home</Link>
          </div>

          <div className="demo-info">
            <h4>Demo Credentials</h4>
            <ul>
              <li><strong>Username:</strong> <code>admin</code></li>
              <li><strong>Password:</strong> <code>admin123</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;