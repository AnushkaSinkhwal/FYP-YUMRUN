const express = require('express');
const router = express.Router();
const { sendEmail, emailTemplates } = require('../utils/emailService');
const dotenv = require('dotenv');

dotenv.config(); // Ensure environment variables are loaded

/**
 * @route   POST /api/contact
 * @desc    Handle contact form submission and send email to admin
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all fields'
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable is not set.');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Could not process request.'
      });
    }

    // Send email to admin
    const emailResult = await sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission: ${subject}`,
      html: emailTemplates.contactFormEmail({ name, email, subject, message })
    });

    if (!emailResult.success) {
      console.error('Failed to send contact form email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!'
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

module.exports = router; 