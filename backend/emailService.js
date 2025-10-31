const nodemailer = require('nodemailer');

// Create transporter (using Gmail as example)
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendStatusUpdateEmail = async (customerEmail, customerName, status, requestId) => {
  // If email not configured, log and return
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`📧 Email notification (simulated): ${customerName} - Request #${requestId} - Status: ${status}`);
    return;
  }

  const statusMessages = {
    pending: 'is pending review. We will update you soon.',
    approved: 'has been approved! We will contact you shortly to confirm details.',
    rejected: 'has been rejected. Please contact us for more information.',
    scheduled: 'has been scheduled! Check your dashboard for trip details.'
  };

  const statusColors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    scheduled: '#3b82f6'
  };

  const mailOptions = {
    from: `Coach Service <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `Trip Request ${status.charAt(0).toUpperCase() + status.slice(1)} - Coach Service`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚌 Coach Service</h1>
            <p>Your Travel Partner</p>
          </div>
          <div class="content">
            <h2>Hello ${customerName},</h2>
            <p>Your trip request <strong>#${requestId}</strong> ${statusMessages[status] || 'status has been updated.'}</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColors[status]}; margin: 20px 0;">
              <strong>Current Status:</strong>
              <span class="status-badge" style="background: ${statusColors[status]}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            
            <p>You can check your request status anytime by visiting our website and entering your phone number or email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/status" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Check Your Status
              </a>
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br><strong>Coach Service Team</strong></p>
            <p>Need help? Contact us at support@coachservice.com</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${customerEmail} for request #${requestId}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
};

// Send welcome email for new requests
const sendWelcomeEmail = async (customerEmail, customerName, requestId) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`📧 Welcome email (simulated): ${customerName} - Request #${requestId}`);
    return;
  }

  const mailOptions = {
    from: `Coach Service <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: 'Trip Request Received - Coach Service',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>🚌 Thank You for Choosing Coach Service!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>Hello ${customerName},</h2>
          <p>We've successfully received your trip request <strong>#${requestId}</strong> and it's currently under review.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>What happens next?</h3>
            <ul>
              <li>Our team will review your request within 24 hours</li>
              <li>You'll receive email updates when your status changes</li>
              <li>Once approved, we'll match you with the perfect vehicle and driver</li>
            </ul>
          </div>
          
          <p>You can check your request status anytime using your phone number or email address on our website.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/status" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Track Your Request
            </a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p>Best regards,<br><strong>Coach Service Team</strong></p>
        </div>
      </div>
    `
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${customerEmail}`);
  } catch (error) {
    console.error('❌ Welcome email failed:', error);
  }
};

module.exports = { sendStatusUpdateEmail, sendWelcomeEmail };