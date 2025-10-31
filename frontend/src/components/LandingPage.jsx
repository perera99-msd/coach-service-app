import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Effect to handle header transparency on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="landing-container">
      {/* Navigation */}
      <header className={`page-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="page-header-content">
          <Link to="/" className="logo" onClick={() => setIsNavOpen(false)}>
            {/* UPDATED LOGO */}
            <img src="/images/logo.png" alt="CoachExpress Logo" className="logo-image" />
            <span className="logo-text">CoachExpress</span>
          </Link>
          
          <nav className={`main-nav ${isNavOpen ? 'open' : ''}`}>
            <a href="#features" onClick={() => setIsNavOpen(false)}>Features</a>
            <button 
              onClick={() => {
                navigate('/admin/login');
                setIsNavOpen(false);
              }}
              className="btn btn-secondary"
            >
              Admin Portal
            </button>
            <button 
              onClick={() => {
                navigate('/book');
                setIsNavOpen(false);
              }}
              className="btn btn-primary"
            >
              Book Now
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

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animated-fade">
          <h1>Comfortable Travel</h1>
          <p>
            Experience premium coach service for your personal and professional journeys.
          </p>
        </div>

        {/* New cards container */}
        <div className="hero-cards-container">
          <div className="hero-card dark animated-fast" style={{animationDelay: '0.2s'}}>
            <h3>Book Your Trip</h3>
            <p>Start a new journey with us in just a few clicks.</p>
            <button 
              onClick={() => navigate('/book')}
              className="btn btn-primary"
            >
              🚗 Book Your Trip
            </button>
          </div>
          <div className="hero-card light animated-fast" style={{animationDelay: '0.4s'}}>
            <h3>Check Your Status</h3>
            <p>Already booked? Track your request status here.</p>
            <button 
              onClick={() => navigate('/status')}
              className="btn btn-secondary"
            >
              📋 Check Trip Status
            </button>
          </div>
        </div>

        {/* Image Placeholders */}
        <div className="hero-placeholder left"><img src="/images/left.png" alt="Decorative visual" /></div>
        <div className="hero-placeholder right"><img src="/images/right.png" alt="Decorative visual" /></div>

      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-title">
            <h2>Reliable & Simple</h2>
            <p>Everything you need for a seamless journey.</p>
          </div>

          <div className="features-grid">
            {/* Feature Card 1 */}
            <div className="feature-card animated">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">⏱️</span>
              </div>
              <div className="feature-card-content">
                <h3>Quick Booking</h3>
                <p>Book your trip in under 2 minutes with our simple form.</p>
              </div>
            </div>
            
            {/* Feature Card 2 */}
            <div className="feature-card animated" style={{animationDelay: '0.1s'}}>
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🚙</span>
              </div>
              <div className="feature-card-content">
                <h3>Professional Drivers</h3>
                <p>All drivers are certified, experienced, and committed to safety.</p>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="feature-card animated" style={{animationDelay: '0.2s'}}>
              <div className="feature-icon-wrapper">
                <span className="feature-icon">📱</span>
              </div>
              <div className="feature-card-content">
                <h3>Real-time Tracking</h3>
                <p>Monitor your trip status and driver location anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;