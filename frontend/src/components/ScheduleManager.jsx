import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScheduleManager = ({ drivers, vehicles }) => {
  const [schedules, setSchedules] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, []);
  
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }
      
      const response = await axios.get(`/api/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { _: Date.now() } // Cache busting
      });
      
      let scheduleData = [];
      if (Array.isArray(response.data)) {
        scheduleData = response.data;
      } else if (response.data.assignments && Array.isArray(response.data.assignments)) {
        scheduleData = response.data.assignments;
      } else if (response.data.data && Array.isArray(response.data.data)) {
         scheduleData = response.data.data;
      } else {
        console.warn('Unexpected response format:', response.data);
      }
      setSchedules(scheduleData);

    } catch (error) {
      console.error('Error fetching schedules:', error);
      setMessage({ type: 'error', text: 'Failed to load schedules' });
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/assignments/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Schedule updated successfully!' });
      setEditing(null);
      setEditData({});
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      setMessage({ type: 'error', text: 'Failed to update schedule' });
    }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule? This will not cancel the trip request.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Schedule deleted successfully!' });
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setMessage({ type: 'error', text: 'Failed to delete schedule' });
    }
  };

  const startEditing = (schedule) => {
    setEditing(schedule.id);
    setEditData({
      driver_id: schedule.driver_id,
      vehicle_id: schedule.vehicle_id,
      scheduled_time: schedule.scheduled_time ? schedule.scheduled_time.slice(0, 16) : ''
    });
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditData({});
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not scheduled';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-full-page" style={{height: '50vh'}}>
        <div className="loading-spinner"></div> Loading schedules...
      </div>
    );
  }

  return (
    <div className="schedule-manager-container animated-fade">
      {message.text && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}

      {/* Debug Info */}
      <div style={{ background: '#f0f8ff', padding: '10px', margin: '10px 0', borderRadius: '5px', fontSize: '12px' }}>
        <strong>Available:</strong> {drivers.length} drivers, {vehicles.length} vehicles
      </div>

      {schedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h4>No Scheduled Trips</h4>
          <p>
            There are no scheduled trips at the moment.
            Schedule new trips from the 'Trip Requests' tab.
          </p>
        </div>
      ) : (
        <div className={`schedule-list ${isMobile ? 'mobile-view' : ''}`}>
          {schedules.map(schedule => (
            <div key={schedule.id} className="schedule-card">
              <div className="schedule-card-header">
                <h3>{schedule.customer_name || 'N/A'}</h3>
                <span className="badge badge-scheduled">Scheduled</span>
              </div>
              
              {editing === schedule.id ? (
                // Editing View
                <div className="schedule-card-editing">
                  <div className={`form-grid ${isMobile ? 'mobile' : ''}`}>
                    <div className="form-group">
                      <label>Driver</label>
                      <select 
                        value={editData.driver_id || ''}
                        onChange={(e) => setEditData({...editData, driver_id: e.target.value})}
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
                        value={editData.vehicle_id || ''}
                        onChange={(e) => setEditData({...editData, vehicle_id: e.target.value})}
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
                        value={editData.scheduled_time || ''}
                        onChange={(e) => setEditData({...editData, scheduled_time: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Display View
                <div className={`schedule-card-content ${isMobile ? 'mobile' : ''}`}>
                  <div className="schedule-card-group">
                    <h4>Contact</h4>
                    <p>{schedule.phone}</p>
                    <p style={{color: 'var(--text-light)'}}>{schedule.email}</p>
                  </div>
                  <div className="schedule-card-group">
                    <h4>Route</h4>
                    <p>📍 {schedule.pickup_location}</p>
                    <p style={{color: 'var(--text-light)'}}>🎯 {schedule.dropoff_location}</p>
                  </div>
                  <div className="schedule-card-group">
                    <h4>Assignment</h4>
                    <p>👤 {schedule.driver_name || 'N/A'}</p>
                    <p style={{color: 'var(--text-light)'}}>🚙 {schedule.vehicle_plate || 'N/A'}</p>
                  </div>
                  <div className="schedule-card-group">
                    <h4>Scheduled Time</h4>
                    <p style={{fontWeight: 600, color: 'var(--primary-dark)'}}>
                      {formatDateTime(schedule.scheduled_time)}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="schedule-card-footer">
                {editing === schedule.id ? (
                  <>
                    <button onClick={cancelEditing} className="btn btn-secondary btn-small">
                      Cancel
                    </button>
                    <button 
                      onClick={() => updateSchedule(schedule.id)}
                      disabled={!editData.driver_id || !editData.vehicle_id || !editData.scheduled_time}
                      className="btn btn-primary btn-small"
                    >
                      ✅ Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => deleteSchedule(schedule.id)} className="btn btn-danger btn-small">
                      🗑️ Delete
                    </button>
                    <button onClick={() => startEditing(schedule)} className="btn btn-primary btn-small">
                      ✏️ Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;