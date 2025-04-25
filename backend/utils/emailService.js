const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a transporter with Gmail SMTP settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise<Object>} - Email sending result
 */
const sendEmail = async (options) => {
  try {
    const { to, subject, html } = options;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"YumRun" <solverspro@gmail.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Email Templates
 */
const emailTemplates = {
  /**
   * Welcome Email Template
   * @param {Object} user - User data
   * @returns {string} - HTML email content
   */
  welcomeEmail: (user) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to YumRun</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #FF5722;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
          }
          .content {
            padding: 20px;
            background-color: #fff;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            background-color: #FF5722;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to YumRun!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName || 'there'},</h2>
            <p>Thank you for joining YumRun! We're excited to have you on board.</p>
            <p>With YumRun, you can:</p>
            <ul>
              <li>Order delicious food from your favorite local restaurants</li>
              <li>Track your orders in real-time</li>
              <li>Discover new cuisines and dishes</li>
              <li>Save your favorite restaurants for quick access</li>
            </ul>
            <p>Start exploring our extensive menu offerings now!</p>
            <a href="${process.env.FRONTEND_URL}" class="button">Get Started</a>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Enjoy your food journey!</p>
            <p>Best regards,<br>The YumRun Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} YumRun. All rights reserved.</p>
            <p>123 YumRun Street, Foodie District, Kathmandu, Nepal</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Password Reset Email Template
   * @param {Object} options - Options object
   * @param {string} options.resetLink - Password reset link
   * @param {string} options.name - User's name
   * @returns {string} - HTML email content
   */
  passwordResetEmail: (options) => {
    const { resetLink, name } = options;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your YumRun Password</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #FF5722;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            background-color: #fff;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .button {
            display: inline-block;
            background-color: #FF5722;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
          }
          .note {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f8f8;
            border-left: 4px solid #FF5722;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'},</h2>
            <p>We received a request to reset your password for your YumRun account. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <div class="note">
              <p>This password reset link will expire in 1 hour for security reasons.</p>
              <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
              <p style="word-break: break-all;">${resetLink}</p>
            </div>
            <p>If you have any questions or need assistance, please contact our support team.</p>
            <p>Best regards,<br>The YumRun Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} YumRun. All rights reserved.</p>
            <p>123 YumRun Street, Foodie District, Kathmandu, Nepal</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Order Confirmation Email Template
   * @param {Object} order - Order details
   * @param {Object} user - User data
   * @returns {string} - HTML email content
   */
  orderConfirmationEmail: (order, user) => {
    // Format currency
    const formatCurrency = (amount) => {
      // Add safety check for null/undefined amount
      return `Rs ${parseFloat(amount || 0).toFixed(2)}`;
    };

    // Generate order items HTML
    const orderItemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    // Format delivery address
    let formattedAddress = 'Address not provided';
    if (order.deliveryAddress) {
        if (typeof order.deliveryAddress === 'object') {
            // Attempt to build from common fields
            formattedAddress = [
                order.deliveryAddress.fullAddress,
                order.deliveryAddress.street,
                order.deliveryAddress.city,
                order.deliveryAddress.state,
                order.deliveryAddress.zipCode,
                order.deliveryAddress.country
            ].filter(Boolean).join(', '); 
            // If still empty (e.g., empty object), use a default
            if (!formattedAddress) formattedAddress = 'Address details incomplete';
        } else if (typeof order.deliveryAddress === 'string') {
            formattedAddress = order.deliveryAddress; // Use the string directly
        }
    }

    // Safely get user name
    const customerName = user?.fullName || user?.name || 'Valued Customer';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - YumRun #${order.orderNumber || order._id}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #FF5722;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
          }
          .content {
            padding: 20px;
            background-color: #fff;
          }
          .order-info {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .order-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .order-table th {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: left;
          }
          .order-summary {
            margin-top: 20px;
            border-top: 2px solid #eee;
            padding-top: 15px;
          }
          .button {
            display: inline-block;
            background-color: #FF5722;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order, ${customerName}!</h2>
            <p>Your order has been received and is being processed. Here's a summary of your order:</p>
            
            <div class="order-info">
              <p><strong>Order Number:</strong> ${order.orderNumber || order._id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              {/* Use formatted address */}
              <p><strong>Delivery Address:</strong> ${formattedAddress}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              <p><strong>Estimated Delivery:</strong> ${order.estimatedDeliveryTime || '30-45 minutes'}</p>
            </div>

            <h3>Order Details</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>

            <div class="order-summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                 {/* Use totalPrice for Subtotal */}
                <span>${formatCurrency(order.totalPrice)}</span>
              </div>
              <div class="summary-row">
                <span>Delivery Fee:</span>
                <span>${formatCurrency(order.deliveryFee)}</span>
              </div>
              {/* Add Tax and Tip if they exist and are non-zero */}
              ${order.tax && order.tax > 0 ? `
              <div class="summary-row">
                <span>Tax:</span>
                <span>${formatCurrency(order.tax)}</span>
              </div>
              ` : ''}
              ${order.tip && order.tip > 0 ? `
              <div class="summary-row">
                <span>Tip:</span>
                <span>${formatCurrency(order.tip)}</span>
              </div>
              ` : ''}
              ${order.discount && order.discount > 0 ? `
              <div class="summary-row">
                <span>Discount:</span>
                <span style="color: green;">-${formatCurrency(order.discount)}</span>
              </div>
              ` : ''}
              <div class="summary-row" style="font-weight: bold; margin-top: 10px; font-size: 18px;">
                <span>Total:</span>
                 {/* Use grandTotal for Total */}
                <span>${formatCurrency(order.grandTotal)}</span>
              </div>
            </div>

            {/* Ensure the link uses the correct base URL */}
            <a href="${process.env.FRONTEND_URL || 'http://localhost:7000'}/user/orders/${order._id}" class="button">View Order Details</a>
            
            <p style="margin-top: 20px;">If you have any questions or need assistance, please contact our support team.</p>
            <p>Enjoy your meal!</p>
            <p>Best regards,<br>The YumRun Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} YumRun. All rights reserved.</p>
            <p>123 YumRun Street, Foodie District, Kathmandu, Nepal</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Order Status Update Email Template
   * @param {Object} options - Email options
   * @param {Object} options.order - Order details
   * @param {string} options.status - Order status
   * @param {string} options.name - User's name
   * @returns {string} - HTML email content
   */
  orderStatusUpdateEmail: (options) => {
    const { order, status, name } = options;
    
    // Status messages and colors
    const statusConfig = {
      'preparing': {
        title: 'Your Order is Being Prepared',
        message: 'The restaurant has started preparing your delicious meal.',
        color: '#FFB74D'
      },
      'ready': {
        title: 'Your Order is Ready for Pickup',
        message: 'Your order is ready and will be picked up by a delivery rider soon.',
        color: '#4CAF50'
      },
      'on-the-way': {
        title: 'Your Order is On the Way',
        message: 'Your order has been picked up by our delivery rider and is on the way to you.',
        color: '#2196F3'
      },
      'delivered': {
        title: 'Your Order Has Been Delivered',
        message: 'Your order has been delivered. Enjoy your meal!',
        color: '#4CAF50'
      },
      'cancelled': {
        title: 'Your Order Has Been Cancelled',
        message: 'Your order has been cancelled. If you did not request this cancellation, please contact our support team.',
        color: '#F44336'
      }
    };

    const statusInfo = statusConfig[status] || {
      title: `Order Status: ${status.toUpperCase()}`,
      message: 'Your order status has been updated.',
      color: '#757575'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - YumRun</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: ${statusInfo.color};
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            background-color: #fff;
          }
          .order-info {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .status-banner {
            background-color: ${statusInfo.color}20;
            border-left: 4px solid ${statusInfo.color};
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: ${statusInfo.color};
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusInfo.title}</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'},</h2>
            
            <div class="status-banner">
              <p><strong>${statusInfo.message}</strong></p>
            </div>
            
            <div class="order-info">
              <p><strong>Order Number:</strong> ${order.orderNumber || order._id}</p>
              <p><strong>Restaurant:</strong> ${order.restaurant?.name || 'Your selected restaurant'}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
              ${status === 'on-the-way' ? `
              <p><strong>Estimated Arrival:</strong> ${order.estimatedDeliveryTime || 'Soon'}</p>
              ` : ''}
            </div>
            
            <a href="${process.env.FRONTEND_URL}/order-confirmation/${order._id}" class="button">Track Your Order</a>
            
            <p style="margin-top: 20px;">If you have any questions or need assistance, please contact our support team.</p>
            <p>Thank you for choosing YumRun!</p>
            <p>Best regards,<br>The YumRun Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} YumRun. All rights reserved.</p>
            <p>123 YumRun Street, Foodie District, Kathmandu, Nepal</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Restaurant Registration Approval Email Template
   * @param {Object} restaurant - Restaurant details
   * @returns {string} - HTML email content
   */
  restaurantApprovalEmail: (restaurant) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restaurant Approval - YumRun</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
          }
          .content {
            padding: 20px;
            background-color: #fff;
          }
          .restaurant-info {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #FF5722;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 15px;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Restaurant Approved!</h1>
          </div>
          <div class="content">
            <h2>Congratulations, ${restaurant.owner?.fullName || restaurant.name}!</h2>
            <p>We're excited to inform you that your restaurant has been approved on YumRun.</p>
            <p>You can now log in to your dashboard, set up your menu, and start receiving orders.</p>
            
            <div class="restaurant-info">
              <p><strong>Restaurant Name:</strong> ${restaurant.name}</p>
              <p><strong>Address:</strong> ${restaurant.address}</p>
            </div>
            
            <p>Here's what you can do next:</p>
            <ol>
              <li>Log in to your restaurant dashboard</li>
              <li>Set up your menu items with descriptions and prices</li>
              <li>Upload high-quality photos of your dishes</li>
              <li>Configure your operating hours</li>
              <li>Set up payment methods</li>
            </ol>
            
            <a href="${process.env.FRONTEND_URL}/restaurant/dashboard" class="button">Go to Dashboard</a>
            
            <p style="margin-top: 20px;">If you have any questions or need assistance, please contact our support team.</p>
            <p>We look forward to a successful partnership!</p>
            <p>Best regards,<br>The YumRun Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} YumRun. All rights reserved.</p>
            <p>123 YumRun Street, Foodie District, Kathmandu, Nepal</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Contact Form Submission Email Template
   * @param {Object} data - Form data
   * @param {string} data.name - Sender's name
   * @param {string} data.email - Sender's email
   * @param {string} data.subject - Email subject
   * @param {string} data.message - Email message
   * @returns {string} - HTML email content
   */
  contactFormEmail: (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: sans-serif; line-height: 1.5; color: #333; }
          .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
          h2 { color: #FF5722; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          p { margin-bottom: 10px; }
          strong { color: #555; }
          .message-content { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 15px; white-space: pre-wrap; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <div class="message-content">
            <strong>Message:</strong>
            <p>${data.message}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Email Verification OTP Template
   * @param {Object} options - Options object
   * @param {string} options.otp - Verification OTP code
   * @param {string} options.name - User's name
   * @returns {string} - HTML email content
   */
  emailVerificationOTP: (options) => {
    const { otp, name } = options;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - YumRun</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #FF5722;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            background-color: #fff;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            text-align: center;
            margin: 30px 0;
            color: #FF5722;
          }
          .note {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f8f8;
            border-left: 4px solid #FF5722;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hello ${name || 'there'},</h2>
            <p>Thank you for registering with YumRun! Please use the following OTP (One-Time Password) to verify your email address:</p>
            <div class="otp-code">${otp}</div>
            <div class="note">
              <p>This OTP will expire in 10 minutes for security reasons.</p>
              <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
            <p>If you have any questions or need assistance, please contact our support team.</p>
            <p>Best regards,<br>The YumRun Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} YumRun. All rights reserved.</p>
            <p>123 YumRun Street, Foodie District, Kathmandu, Nepal</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

/**
 * Send email verification OTP
 * @param {Object} options - Options object
 * @param {string} options.email - User's email
 * @param {string} options.otp - Verification OTP code
 * @param {string} options.name - User's name
 * @returns {Promise<Object>} - Email sending result
 */
const sendVerificationOTP = async (options) => {
  const { email, otp, name } = options;
  
  const html = emailTemplates.emailVerificationOTP({ otp, name });
  
  return sendEmail({
    to: email,
    subject: 'Email Verification - YumRun',
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationOTP,
  emailTemplates
}; 