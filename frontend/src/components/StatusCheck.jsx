import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const StatusCheck = () => {
  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false); // ADDED for mobile nav
  const navigate = useNavigate();

  // ... (All your functions like checkStatus, getStatusBadge, formatDateTime are unchanged)
  const checkStatus = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setLoading(true);
    setSearched(true);
    setRequests([]);
    try {
      const endpoint = searchType === 'phone' 
        ? `/api/requests/phone/${encodeURIComponent(searchValue)}`
        : `/api/requests/email/${encodeURIComponent(searchValue)}`;
      const response = await axios.get(endpoint);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'badge badge-pending';
      case 'approved': return 'badge badge-approved';
      case 'rejected': return 'badge badge-rejected';
      case 'scheduled': return 'badge badge-scheduled';
      default: return 'badge';
    }
  };
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="page-container">
      {/* UPDATED HEADER with mobile nav */}
      <header className="page-header scrolled">
        <div className="page-header-content">
          <Link to="/" className="logo" onClick={() => setIsNavOpen(false)}>
            {/* UPDATED LOGO */}
            <img src="/images/logo.png" alt="CoachExpress Logo" className="logo-image" />
            <span className="logo-text">CoachExpress</span>
          </Link>
          
          <nav className={`main-nav ${isNavOpen ? 'open' : ''}`}>
            <button 
              onClick={() => {
                navigate('/book');
                setIsNavOpen(false);
              }}
              className="btn btn-primary"
            >
              Book New Trip
            </button>
          </nav>

          <button 
            className="mobile-nav-toggle"
            onClick={() => setIsNavOpen(!isNavOpen)}
            aria-label="Toggle navigation"
          >
            {isNavOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>
      
      <div className="status-wrapper animated">
        <div className="status-search-box">
          <div className="form-main-header" style={{marginBottom: '1.5rem'}}>
            <h2>Track Your Request</h2>
            <p>Enter your details to check the status of your trips</p>
          </div>

          <form onSubmit={checkStatus}>
            <div className="form-grid">
              <div className="form-group">
                <label>Search By</label>
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                  <option value="phone">Phone Number</option>
                  <option value="email">Email Address</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>{searchType === 'phone' ? 'Phone Number' : 'Email Address'}</label>
                <input
                  type={searchType === 'phone' ? 'tel' : 'email'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'phone' ? 'Enter your phone' : 'Enter your email'}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !searchValue.trim()}
            >
              {loading ? 'Searching...' : 'Check Status'}
            </button>
          </form>
        </div>

        {/* ... (loading state) ... */}

        {!loading && searched && requests.length === 0 && (
          <div className="empty-state">
            <h4>No requests found</h4>
            <p>
              No trip requests found for this {searchType}. Please check your information or submit a new request.
            </p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="status-card-list">
            <h3 style={{ marginLeft: '0.5rem', color: 'var(--primary-dark)' }}>
              Your Trip Requests ({requests.length})
            </h3>
            {requests.map(request => (
              // NEW "TICKET" LAYOUT
              <div key={request.id} className="status-card">
                <div className="status-card-badge">
                  <span className={getStatusBadge(request.status)}>
                    {request.status}
                  </span>
                </div>
                <div className="status-card-content">
                  <div className="status-detail-group">
                    <h4>Route</h4>
                    <p>📍 {request.pickup_location}</p>
                    <p style={{color: 'var(--text-light)'}}>🎯 {request.dropoff_location}</p>
                  </div>
                  <div className="status-detail-group">
                    <h4>Pickup Time</h4>
                    <p>{formatDateTime(request.pickup_time)}</p>
                  </div>
                  <div className="status-detail-group">
                    <h4>Driver & Vehicle</h4>
                    {request.driver_name ? (
                      <>
                        <p>👤 {request.driver_name}</p>
                        <p style={{color: 'var(--text-light)'}}>📋 {request.vehicle_plate}</p>
                      </>
                    ) : (
                      <p style={{color: 'var(--text-light)'}}>Not assigned</p>
                    )}
                  </div>
                  <div className="status-detail-group">
                    <h4>Scheduled Time</h4>
                    <p style={{color: request.scheduled_time ? 'var(--primary-dark)' : 'var(--text-light)'}}>
                      {request.scheduled_time ? formatDateTime(request.scheduled_time) : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusCheck;