import React, { useState } from 'react';
import axios from 'axios';

const CustomerForm = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    pickup_location: '',
    dropoff_location: '',
    pickup_time: '',
    passengers: 1,
    notes: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await axios.post('http://localhost:5000/api/requests', formData);
      setMessage({ 
        type: 'success', 
        text: 'Trip request submitted successfully! We will contact you soon.' 
      });
      
      // Reset form
      setFormData({
        customer_name: '',
        phone: '',
        pickup_location: '',
        dropoff_location: '',
        pickup_time: '',
        passengers: 1,
        notes: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Something went wrong. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-content">
          <h1>🚌 Coach Service App</h1>
          <a href="/admin/login" className="btn btn-secondary">Admin Login</a>
        </div>
      </div>

      <div className="form-container">
        <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#1f2937' }}>
          Book Your Trip
        </h2>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Pickup Location *</label>
            <input
              type="text"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Dropoff Location *</label>
            <input
              type="text"
              name="dropoff_location"
              value={formData.dropoff_location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Pickup Date & Time *</label>
            <input
              type="datetime-local"
              name="pickup_time"
              value={formData.pickup_time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Number of Passengers *</label>
            <input
              type="number"
              name="passengers"
              value={formData.passengers}
              onChange={handleChange}
              min="1"
              max="20"
              required
            />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any special requirements..."
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%' }}
          >
            {isLoading ? 'Submitting...' : 'Submit Trip Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;