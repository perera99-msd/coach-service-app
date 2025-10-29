import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate, currentPage, search, statusFilter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [requestsRes, driversRes, vehiclesRes, analyticsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/requests?page=${currentPage}&search=${search}&status=${statusFilter}`, config),
        axios.get('http://localhost:5000/api/drivers', config),
        axios.get('http://localhost:5000/api/vehicles', config),
        axios.get('http://localhost:5000/api/analytics/daily', config)
      ]);

      setRequests(requestsRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/requests/${id}`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const scheduleTrip = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/requests/${id}`, 
        { status: 'scheduled', ...scheduleData }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScheduling(null);
      setScheduleData({ driver_id: '', vehicle_id: '', scheduled_time: '' });
      fetchData();
    } catch (error) {
      console.error('Error scheduling trip:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-content">
          <h1>🚌 Admin Dashboard</h1>
          <div>
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="form-container">
        <h3>Requests Last 7 Days</h3>
        <div style={{ display: 'flex', alignItems: 'end', height: '100px', gap: '10px', marginTop: '20px' }}>
          {analytics.map((day, index) => (
            <div key={index} style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  height: `${(day.count / Math.max(...analytics.map(a => a.count || 1))) * 80}px`,
                  background: '#3b82f6',
                  borderRadius: '4px',
                  marginBottom: '5px'
                }}
              ></div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{day.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="form-container">
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <button onClick={fetchData} className="btn btn-primary">Refresh</button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Pickup</th>
              <th>Dropoff</th>
              <th>Passengers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.requests?.map(request => (
              <tr key={request.id}>
                <td>{request.customer_name}</td>
                <td>{request.phone}</td>
                <td>{request.pickup_location}</td>
                <td>{request.dropoff_location}</td>
                <td>{request.passengers}</td>
                <td>
                  <span className={`status ${request.status}`}>
                    {request.status}
                  </span>
                </td>
                <td>
                  {request.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        onClick={() => updateStatus(request.id, 'approved')}
                        className="btn btn-success"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => updateStatus(request.id, 'rejected')}
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => setScheduling(request.id)}
                        className="btn btn-primary"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Schedule
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {requests.pagination && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span>Page {requests.pagination.page} of {requests.pagination.totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= requests.pagination.totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduling && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="form-container" style={{ maxWidth: '400px' }}>
            <h3>Schedule Trip</h3>
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
            </div>
            <div className="form-group">
              <label>Scheduled Time</label>
              <input
                type="datetime-local"
                value={scheduleData.scheduled_time}
                onChange={(e) => setScheduleData({...scheduleData, scheduled_time: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => scheduleTrip(scheduling)}
                disabled={!scheduleData.driver_id || !scheduleData.vehicle_id || !scheduleData.scheduled_time}
                className="btn btn-primary"
              >
                Schedule
              </button>
              <button 
                onClick={() => {
                  setScheduling(null);
                  setScheduleData({ driver_id: '', vehicle_id: '', scheduled_time: '' });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;