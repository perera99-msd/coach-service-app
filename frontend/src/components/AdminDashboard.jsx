import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ScheduleManager from './ScheduleManager';

const AdminDashboard = () => {
  const [requests, setRequests] = useState({ requests: [], pagination: {} });
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [scheduling, setScheduling] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    driver_id: '',
    vehicle_id: '',
    scheduled_time: ''
  });
  const [activeTab, setActiveTab] = useState('requests');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate, currentPage, search, statusFilter]);
  
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        params: { _: Date.now() } // Cache busting
      };

      const [driversRes, vehiclesRes, requestsRes, analyticsRes] = await Promise.all([
        axios.get('/api/drivers', config),
        axios.get('/api/vehicles', config),
        axios.get(`/api/requests?page=${currentPage}&search=${search}&status=${statusFilter}`, config),
        axios.get('/api/analytics/daily', config)
      ]);

      console.log('🔄 Fetched drivers:', driversRes.data); // Debug log
      console.log('🔄 Fetched vehicles:', vehiclesRes.data); // Debug log

      setDrivers(driversRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setRequests(requestsRes.data || { requests: [], pagination: {} });
      setAnalytics(Array.isArray(analyticsRes.data) ? analyticsRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
      setMessage({ type: 'error', text: 'Failed to load data' });
      setRequests({ requests: [], pagination: {} });
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, schedulePayload = null) => {
    try {
      const token = localStorage.getItem('token');
      const requestData = schedulePayload ? { status, ...schedulePayload } : { status };
      
      await axios.patch(`/api/requests/${id}`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: `Request ${status} successfully!` });
      fetchData();
      setScheduling(null);
      setScheduleData({ driver_id: '', vehicle_id: '', scheduled_time: '' });
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Request deleted successfully!' });
      fetchData();
    } catch (error) {
      console.error('Error deleting request:', error);
      setMessage({ type: 'error', text: 'Failed to delete request' });
    }
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleData.driver_id || !scheduleData.vehicle_id || !scheduleData.scheduled_time) {
      setMessage({ type: 'error', text: 'Please fill all schedule fields' });
      return;
    }
    await updateStatus(scheduling.id, 'scheduled', scheduleData);
  };

  const openScheduleModal = (request) => {
    setScheduling(request);
    setScheduleData({
      driver_id: '',
      vehicle_id: '',
      scheduled_time: request.pickup_time ? request.pickup_time.slice(0, 16) : ''
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-pending',
      approved: 'badge badge-approved', 
      rejected: 'badge badge-rejected',
      scheduled: 'badge badge-scheduled'
    };
    return badges[status] || 'badge';
  };

  const formatDateTime = (dateTime) => {
    return dateTime ? new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) : 'Not set';
  };
  
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handleRefresh = () => {
    setSearch('');
    setStatusFilter('all');
    setCurrentPage(1);
    fetchData();
  };

  // Reset database function (for development)
  const resetDatabase = async () => {
    if (!window.confirm('This will delete ALL data and reset with Sri Lankan drivers/vehicles. Continue?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/dev/reset-database', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Database reset with Sri Lankan data!' });
      setTimeout(() => {
        window.location.reload(); // Reload to get fresh data
      }, 1000);
    } catch (error) {
      console.error('Error resetting database:', error);
      setMessage({ type: 'error', text: 'Failed to reset database' });
    }
  };

  // Mobile-friendly table render
  const renderRequestsTab = () => {
    const formatChartDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
    
    const maxCount = analytics.length > 0 
      ? Math.max(...analytics.map(day => day.count)) 
      : 1;

    return (
      <div className="animated-fade">
        {/* Analytics Section */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Total Requests</h4>
            <p>{requests.pagination?.total || 0}</p>
          </div>

          <div className="analytics-card" style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
            <h4>Daily Requests (Last 7 Days)</h4>
            <div className="analytics-chart-container">
              {loading ? (
                <p style={{textAlign: 'center', width: '100%'}}>Loading chart...</p>
              ) : analytics.length > 0 ? (
                analytics.map((day, index) => (
                  <div key={index} className="chart-bar-group">
                    <div className="chart-bar-value">{day.count}</div>
                    <div 
                      className="chart-bar" 
                      style={{ height: `${(day.count / Math.max(maxCount, 1)) * 100}%` }}
                    >
                    </div>
                    <div className="chart-bar-label">{formatChartDate(day.date)}</div>
                  </div>
                ))
              ) : (
                <p style={{textAlign: 'center', width: '100%'}}>No daily data available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="form-group">
            <input
              type="text"
              placeholder="Search by name, phone..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="form-group">
            <select value={statusFilter} onChange={handleStatusChange}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <button onClick={handleRefresh} className="btn btn-secondary">
            🔄 Refresh
          </button>
          {process.env.NODE_ENV !== 'production' && (
            <button onClick={resetDatabase} className="btn btn-warning">
              🗃️ Reset DB
            </button>
          )}
        </div>

        {/* Debug Info */}
        <div style={{ background: '#f0f8ff', padding: '10px', margin: '10px 0', borderRadius: '5px', fontSize: '12px' }}>
          <strong>Debug:</strong> {drivers.length} drivers, {vehicles.length} vehicles loaded
        </div>

        {/* Responsive Table */}
        <div className="requests-table-wrapper">
          {isMobile ? (
            // Mobile Card View
            <div className="mobile-requests-list">
              {loading && (
                <div style={{textAlign: 'center', padding: '2rem'}}>Loading requests...</div>
              )}
              {!loading && requests.requests.length === 0 && (
                <div style={{textAlign: 'center', padding: '2rem'}}>No requests found.</div>
              )}
              {!loading && requests.requests.map(request => (
                <div key={request.id} className="mobile-request-card">
                  <div className="mobile-card-header">
                    <h4>{request.customer_name}</h4>
                    <span className={getStatusBadge(request.status)}>
                      {request.status}
                    </span>
                  </div>
                  <div className="mobile-card-content">
                    <div className="mobile-card-row">
                      <span className="label">Contact:</span>
                      <span>{request.phone}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="label">From:</span>
                      <span>📍 {request.pickup_location}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="label">To:</span>
                      <span>🎯 {request.dropoff_location}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="label">Pickup:</span>
                      <span>{formatDateTime(request.pickup_time)}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="label">Passengers:</span>
                      <span>{request.passengers}</span>
                    </div>
                    {request.notes && (
                      <div className="mobile-card-row">
                        <span className="label">Notes:</span>
                        <span className="notes">{request.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="mobile-card-actions">
                    {request.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(request.id, 'approved')} 
                          className="btn btn-success btn-small">Approve</button>
                        <button onClick={() => updateStatus(request.id, 'rejected')}
                          className="btn btn-danger btn-small">Reject</button>
                      </>
                    )}
                    {request.status !== 'rejected' && (
                      <button onClick={() => openScheduleModal(request)} className="btn btn-primary btn-small">
                        Schedule
                      </button>
                    )}
                    <button onClick={() => deleteRequest(request.id)}
                      className="btn btn-secondary btn-small">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Trip Details</th>
                  <th>Pickup Time</th>
                  <th>Pax</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Loading requests...</td>
                  </tr>
                )}
                {!loading && requests.requests.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No requests found.</td>
                  </tr>
                )}
                {!loading && requests.requests.map(request => (
                  <tr key={request.id}>
                    <td>{request.customer_name}</td>
                    <td>
                      <div className="contact-cell">
                        <span>{request.phone}</span>
                        <span>{request.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="route-cell">
                        <span>📍 {request.pickup_location}</span>
                        <span>🎯 {request.dropoff_location}</span>
                        {request.notes && <em className="notes">Notes: {request.notes}</em>}
                      </div>
                    </td>
                    <td>{formatDateTime(request.pickup_time)}</td>
                    <td>{request.passengers}</td>
                    <td>
                      <span className={getStatusBadge(request.status)}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        {request.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(request.id, 'approved')} 
                              className="btn btn-success btn-small">Approve</button>
                            <button onClick={() => updateStatus(request.id, 'rejected')}
                              className="btn btn-danger btn-small">Reject</button>
                          </>
                        )}
                        {request.status !== 'rejected' && (
                          <button onClick={() => openScheduleModal(request)} className="btn btn-primary btn-small">
                            Schedule
                          </button>
                        )}
                        <button onClick={() => deleteRequest(request.id)}
                          className="btn btn-secondary btn-small">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout-wrapper">
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/" className="logo">
          <img src="/images/logo.png" alt="CoachExpress Logo" className="logo-image" />
          <span className="logo-text">CoachExpress</span>
        </Link>
        
        <nav className="admin-sidebar-nav">
          <button 
            className={`nav-button ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('requests');
              if (isMobile) setSidebarOpen(false);
            }}
          >
            📋 Trip Requests
          </button>
          <button
            className={`nav-button ${activeTab === 'schedules' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('schedules');
              if (isMobile) setSidebarOpen(false);
            }}
          >
            🗓️ Schedules
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={() => {
            localStorage.removeItem('token');
            navigate('/admin/login');
          }} className="btn btn-secondary btn-small">
            Logout
          </button>
        </div> 
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        <header className="admin-header-main">
          {isMobile && (
            <button 
              className="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
          )}
          <h1>{activeTab === 'requests' ? 'Trip Requests' : 'Scheduled Trips'}</h1>
          
        </header>
        
        <main className="admin-content">
          {message.text && (
            <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'} animated-fast`}>
              {message.text}
            </div>
          )}

          {loading && activeTab !== 'requests' ? (
            <div className="loading-full-page" style={{height: '50vh'}}>Loading...</div>
          ) : activeTab === 'requests' ? (
            renderRequestsTab()
          ) : (
            <ScheduleManager drivers={drivers} vehicles={vehicles} />
          )}
        </main>
      </div>

      {/* Schedule Modal */}
      {scheduling && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Schedule Trip for {scheduling.customer_name}</h3>
            <p>Assign a driver and vehicle for this request.</p>
            
            <div className="form-group">
              <label>Driver</label>
              <select 
                value={scheduleData.driver_id}
                onChange={(e) => setScheduleData({...scheduleData, driver_id: e.target.value})}
              >
                <option value="">Select Driver</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.phone})
                  </option>
                ))}
              </select>
              {drivers.length === 0 && (
                <small style={{color: 'red'}}>No drivers available. Please check database.</small>
              )}
            </div>

            <div className="form-group">
              <label>Vehicle</label>
              <select 
                value={scheduleData.vehicle_id}
                onChange={(e) => setScheduleData({...scheduleData, vehicle_id: e.target.value})}
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} ({vehicle.capacity} seats)
                  </option>
                ))}
              </select>
              {vehicles.length === 0 && (
                <small style={{color: 'red'}}>No vehicles available. Please check database.</small>
              )}
            </div>

            <div className="form-group">
              <label>Scheduled Time</label>
              <input
                type="datetime-local"
                value={scheduleData.scheduled_time}
                onChange={(e) => setScheduleData({...scheduleData, scheduled_time: e.target.value})}
              />
            </div>

            <div className="modal-actions">
              <button onClick={() => setScheduling(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleScheduleSubmit} className="btn btn-primary">
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;