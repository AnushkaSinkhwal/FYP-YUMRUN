# YumRun Backend Setup Guide

This guide provides instructions for setting up the YumRun backend API and creating an admin user.

## Prerequisites

- Node.js (v14 or later)
- MongoDB instance (local or cloud-based like MongoDB Atlas)
- npm or yarn package manager

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root of the backend directory based on the `.env.example` file:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
CONNECTION_STRING=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority

# JWT Authentication (IMPORTANT)
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRY=7d
```

Be sure to replace the placeholder values with your actual MongoDB connection string and a secure random string for the JWT secret.

### 3. Create an Admin User

The system requires at least one admin user to manage the application. We've created a script to help you set up your first admin user.

Run the following command:

```bash
node scripts/createUser.js
```

This interactive script will prompt you for user details:

```
Enter full name: Admin User
Enter email: admin@yumrun.com
Enter phone number (10 digits): 1234567890
Enter password (min 8 chars, 1 number, 1 special char): Admin@123
Enter health condition (Healthy, Diabetes, Heart Condition, Hypertension, Other): Healthy
Make this user an admin? (y/n): y
Make this user a restaurant owner? (y/n): n
Make this user delivery staff? (y/n): n
```

Make sure to answer 'y' when prompted "Make this user an admin?" to create an admin user.

### 4. Start the Server

To start the server, run:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Authentication

The system uses JWT (JSON Web Tokens) for authentication. When a user logs in, they receive a token that must be included in subsequent requests.

### Admin Login

Once you've created an admin user, you can log in with those credentials at:

```
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

The response will include a JWT token that should be included in the Authorization header for all subsequent requests to protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

If you encounter issues during setup:

1. **Database Connection Errors**: Verify your MongoDB connection string and ensure your IP address is whitelisted if using MongoDB Atlas.

2. **Authentication Issues**: Ensure your JWT_SECRET is set in the .env file and that you're including the token in your requests.

3. **User Creation Errors**: If the createUser script fails, check the error message. It may be due to validation issues (e.g., password not meeting requirements).

For additional help, refer to the API documentation or contact the development team. 