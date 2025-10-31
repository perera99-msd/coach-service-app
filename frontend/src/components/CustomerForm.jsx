import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const CustomerForm = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    pickup_location: '',
    dropoff_location: '',
    pickup_time: '',
    passengers: 1,
    notes: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isNavOpen, setIsNavOpen] = useState(false); // ADDED for mobile nav
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await axios.post('/api/requests', formData);
      setMessage({ 
        type: 'success', 
        text: 'Trip request submitted successfully! We will contact you soon.' 
      });
      
      setFormData({
        customer_name: '', email: '', phone: '', pickup_location: '',
        dropoff_location: '', pickup_time: '', passengers: 1, notes: ''
      });
      setCurrentStep(1);
      
      setTimeout(() => {
        navigate('/status');
      }, 2000);
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

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const renderSidebar = () => (
    <div className="form-sidebar">
      <div className="form-progress">
        <h3>Your Booking</h3>
        <div className={`progress-step ${currentStep === 1 ? 'active' : ''}`}>
          <h4>Step 1: Personal Information</h4>
          <p>Tell us who is traveling.</p>
        </div>
        <div className={`progress-step ${currentStep === 2 ? 'active' : ''}`}>
          <h4>Step 2: Trip Details</h4>
          <p>Where and when are you going?</p>
        </div>
        <div className={`progress-step ${currentStep === 3 ? 'active' : ''}`}>
          <h4>Step 3: Review & Submit</h4>
          <p>Confirm your request.</p>
        </div>
      </div>

      {(currentStep > 1 || formData.customer_name) && (
        <div className="form-review-summary animated-fade">
          <h4>Trip Summary</h4>
          {formData.customer_name && (
            <div className="review-item">
              <span className="label">Passenger:</span>
              <span className="value">{formData.customer_name}</span>
            </div>
          )}
          {formData.phone && (
            <div className="review-item">
              <span className="label">Contact:</span>
              <span className="value">{formData.phone}</span>
            </div>
          )}
          {formData.pickup_location && (
            <div className="review-item">
              <span className="label">From:</span>
              <span className="value">{formData.pickup_location}</span>
            </div>
          )}
          {formData.dropoff_location && (
            <div className="review-item">
              <span className="label">To:</span>
              <span className="value">{formData.dropoff_location}</span>
            </div>
          )}
          {formData.pickup_time && (
             <div className="review-item">
              <span className="label">Pickup:</span>
              <span className="value">{new Date(formData.pickup_time).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      {/* THIS IS THE UPDATED HEADER with mobile nav */}
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
                navigate('/status');
                setIsNavOpen(false);
              }}
              className="btn btn-secondary"
            >
              Check Status
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

      <div className="form-container-layout animated">
        {renderSidebar()}
        
        <div className="form-main">
          <div className="form-main-header">
            <h2>Book Your Journey</h2>
            <p>Complete the form to request your coach service</p>
          </div>

          {message.text && (
            <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="form-step" key="step1">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required placeholder="Enter your full name" autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="your.email@example.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 (555) 123-4567" />
                </div>
                
                <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Trip Details */}
            {currentStep === 2 && (
              <div className="form-step" key="step2">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Pickup Location *</label>
                    <input type="text" name="pickup_location" value={formData.pickup_location} onChange={handleChange} required placeholder="Enter pickup address" />
                  </div>
                  <div className="form-group">
                    <label>Dropoff Location *</label>
                    <input type="text" name="dropoff_location" value={formData.dropoff_location} onChange={handleChange} required placeholder="Enter destination address" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Pickup Date & Time *</label>
                    <input type="datetime-local" name="pickup_time" value={formData.pickup_time} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Number of Passengers *</label>
                    <select name="passengers" value={formData.passengers} onChange={handleChange} required>
                      {[...Array(30).keys()].map(i => i + 1).map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'passenger' : 'passengers'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={prevStep} className="btn btn-secondary">
                    ← Back
                  </button>
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Additional Info */}
            {currentStep === 3 && (
              <div className="form-step" key="step3">
                <div className="form-group">
                  <label>Additional Notes (Optional)</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4" placeholder="Any special requirements, luggage details..." />
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={prevStep} className="btn btn-secondary">
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-accent" disabled={isLoading}>
                    {isLoading ? (
                      <>Submitting...</>
                    ) : (
                      '✅ Submit Booking Request'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;