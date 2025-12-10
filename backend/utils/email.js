const nodemailer = require('nodemailer');

// Create transporter with better error handling
let transporter;

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials are not configured!');
    console.error('Missing EMAIL_USER or EMAIL_PASS environment variables');
    return null;
  }

  const config = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // For Gmail, you might need to use OAuth2 or App Password
  // If using App Password, make sure EMAIL_PASS is the app password, not the regular password
  if (config.service === 'gmail') {
    console.log('📧 Using Gmail service for email');
    console.log(`📧 Email user: ${config.auth.user}`);
  }

  return nodemailer.createTransport(config);
};

// Initialize transporter
transporter = createTransporter();

// Verify transporter connection (non-blocking)
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️  Email transporter verification failed:', error.message);
      console.warn('   Email functionality may be unavailable until connection is restored.');
      console.warn('   Error details:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      console.warn('   Server will continue running. Check your email configuration and network.');
    } else {
      console.log('✅ Email transporter is ready to send emails');
    }
  });
} else {
  console.warn('⚠️  Email transporter not initialized. Email functionality will be unavailable.');
}

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const error = new Error('Email credentials are not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    console.error('❌', error.message);
    throw error;
  }

  if (!transporter) {
    const error = new Error('Email transporter is not initialized. Check your email configuration.');
    console.error('❌', error.message);
    throw error;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `GradJob <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    console.log(`📤 Sending email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Email error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      message: error.message
    });
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Could not connect to email server. Please check your network connection and EMAIL_SERVICE setting.');
    } else {
      throw error;
    }
  }
};

module.exports = { transporter, sendEmail };

