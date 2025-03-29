# YumRun Food Delivery Application

YumRun is a comprehensive food delivery platform that connects customers with restaurants and delivery staff. The application features a modern UI built with React, Tailwind CSS, and Shadcn UI components.

## UI Updates

The application has been completely redesigned with:

- **Tailwind CSS**: For consistent, utility-first styling
- **Shadcn UI Components**: Modern, accessible UI components
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Dark Mode Support**: Toggle between light and dark themes
- **Consistent Branding**: Using YumRun's brand colors throughout

## Test Credentials

### Admin User
- **Email:** admin@yumrun.com
- **Password:** Admin@123
- **Access:** Full administrative access, including user management, restaurant approvals, and system settings

### Restaurant Owner
- **Email:** owner@restaurant.com  
- **Password:** Owner@123
- **Access:** Restaurant management, menu creation/editing, order management

### Regular User
- **Email:** user@example.com
- **Password:** User@123  
- **Access:** Browsing restaurants, placing orders, managing profile

## Features

- **User Authentication**: Secure login/signup for different user roles
- **Role-Based Access Control**: Different interfaces for customers, restaurant owners, and administrators
- **Profile Management**: Update personal information and preferences
- **Restaurant Management**: Add/edit restaurant details and menu items (for restaurant owners)
- **Admin Dashboard**: Manage users, restaurants, and system settings (for admins)
- **Order Management**: Place, track, and manage orders
- **Responsive UI**: Works on all device sizes

## Development Setup

1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Set up environment variables:
   - Create `.env` file in the backend directory
   - Set up MongoDB connection string and JWT secret

4. Run the development servers:
   ```
   # Backend
   cd backend && npm run dev

   # Frontend
   cd frontend && npm run dev
   ```

## Creating Test Users

To create test users for a new database:

```bash
# From the project root
cd backend
node scripts/createTestUsers.js
```

## UI Components

The application uses custom UI components built with Tailwind CSS and Shadcn UI:

- Button
- Input
- Card
- Alert
- Badge
- Container
- Dialog
- Checkbox
- Label
- Select
- Spinner

These components provide a consistent design language throughout the application.

## Tech Stack

- **Frontend**: React.js, Bootstrap
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **External APIs**: Nutritional analysis, payment processing

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- MongoDB

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/FYP-YUMRUN.git
cd yumrun

# Install dependencies
npm install

# Setup environment variables
# Copy example env files and modify them with your credentials
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Start development servers
npm run dev
```

### Development Commands

```bash
# Run both frontend and backend
npm run dev

# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend
```

## Project Structure

- `frontend/` - React application with user, restaurant, and admin interfaces
- `backend/` - Express API server
- `docs/` - Documentation and design assets

## License

MIT 
