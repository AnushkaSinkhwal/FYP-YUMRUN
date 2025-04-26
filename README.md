# YumRun: Health-Focused Food Delivery Platform

YumRun is a food delivery application that prioritizes health and nutrition as core principles. The platform connects customers with restaurants and delivery riders while providing nutritional information and health-focused features.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Development](#development)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

YumRun differentiates itself from conventional food delivery platforms by empowering users to make informed dietary choices aligned with their health goals. The application provides detailed nutritional information for menu items, allowing users to filter based on dietary preferences and restrictions.

## Key Features

### For Customers

- **Health-Focused Ordering**
  - View nutritional information for menu items
  - Filter by dietary preferences (vegetarian, vegan, gluten-free)
  - Allergen identification system
  - Health score ratings for menu items

- **Personalized Experience**
  - Order history tracking
  - Favorite restaurants and dishes
  - Personalized recommendations based on past orders and preferences

- **Order Management**
  - Real-time order tracking
  - Order status notifications
  - Communication with delivery riders
  - Order history and details
  - Option to reorder favorite meals

- **Loyalty System**
  - Earn points on purchases (10 points per Rs. 100 spent)
  - Redeem points for discounts
  - Track loyalty status and history
  - Points expiration management

- **Reviews & Ratings**
  - Rate restaurants and menu items
  - Multi-dimensional rating system (food quality, packaging, delivery time)
  - View community reviews
  - Rate delivery experience

- **Payment Options**
  - Khalti integration for digital payments
  - Cash on delivery option
  - Secure payment processing
  - Transaction history

### For Restaurants

- **Menu Management**
  - Create and update menu items with nutritional info
  - Organize items by categories
  - Set item availability
  - Upload food images
  - Manage ingredient information

- **Order Management**
  - Receive and process orders in real-time
  - Order acceptance/rejection workflow
  - Update order status
  - Coordinate with delivery riders
  - View order history
  - Special instruction handling

- **Analytics Dashboard**
  - Track sales performance
  - Monitor popular items
  - View customer trends
  - Revenue analysis
  - Peak hour identification

- **Promotional Tools**
  - Create discounts and offers
  - Run special promotions
  - Manage combo deals
  - Happy hour specials
  - Performance tracking of promotions

- **Restaurant Profile**
  - Update business information
  - Manage operating hours
  - Showcase restaurant photos
  - Define service area
  - Set cuisine types

### For Delivery Riders

- **Order Management**
  - Accept delivery requests
  - View pickup and delivery details
  - Update delivery status
  - Complete deliveries
  - Order history tracking

- **Navigation Assistance**
  - View delivery routes
  - Location sharing with customers
  - Address details
  - Delivery route optimization

- **Earnings Tracking**
  - View delivery fees
  - Track daily and weekly earnings
  - Payment history
  - Incentive and bonus tracking

- **Status Management**
  - Set availability (online/offline)
  - Manage working hours
  - View delivery history
  - Service area preferences

### For Administrators

- **User Management**
  - Manage customer accounts
  - Review and approve restaurant applications
  - Oversee delivery rider accounts
  - Account verification processes
  - Suspension capabilities

- **Restaurant Monitoring**
  - Approve new restaurant registrations
  - Document verification process
  - Monitor restaurant performance
  - Enforce quality standards
  - Restaurant categorization

- **System Analytics**
  - Platform-wide statistics
  - Revenue tracking
  - User engagement metrics
  - Geographic distribution analysis
  - Performance bottleneck identification

- **Content Management**
  - Platform-wide announcements
  - Promotional banner system
  - Featured restaurant selection

## Tech Stack

### Frontend
- **React.js**: Core framework for building the user interface
  - Component-based architecture
  - Virtual DOM for efficient rendering
  - Hooks for state management
- **React Router**: Client-side routing
  - Route protection based on authentication
  - Nested routes
- **Tailwind CSS**: Utility-first styling framework
    - Custom theme configuration
    - Responsive design utilities
    - Dark mode support
- **Shadcn UI**: Component library for consistent design
  - Accessible components
  - Customizable theming
- **Context API**: State management
  - AuthContext for authentication
  - CartContext for shopping cart
  - ToastContext for notifications
- **Axios**: API request handling
    - Request/response interceptors
    - Authentication header management

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
  - Middleware-based request processing
  - Route grouping by domain
  - Error handling middleware
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: MongoDB object modeling
  - Schema-based data modeling
  - Validation at the model level
  - Relationship handling with refs
- **JWT**: Authentication and authorization
  - Token generation and validation
  - Role-based access control
- **Multer**: File upload handling
  - File type validation
  - Storage configuration
- **Node-cron**: Scheduled tasks automation
  - Loyalty points expiration processing
  - Database maintenance

### Payment Integration
- **Khalti**: Digital payment gateway integration

## System Architecture

YumRun follows a client-server architecture with:

1. **Client Layer**: React-based frontend for different user interfaces (customer, restaurant, delivery, admin)
2. **API Layer**: Express.js RESTful API providing business logic
3. **Data Layer**: MongoDB database storing application data
4. **Service Layer**: Background jobs, notifications, and third-party integrations

Communication between layers is secured using JWT authentication and proper data validation.

### Frontend Architecture

- **Component Structure**:
  - Atomic design principles
  - Reusable UI components
  - Page components
  - Layout components

- **State Management**:
  - Context API for global state
  - Local component state for UI-specific data
  - Custom hooks for reusable logic

- **Routing**:
  - React Router for navigation
  - Protected routes
  - Role-based access

### Backend Architecture

- **API Structure**:
  - RESTful endpoints
  - Controller-Service pattern
  - Middleware for cross-cutting concerns

- **Database Access**:
  - Mongoose models
  - Repository pattern
  - Aggregation pipelines for complex queries

- **Authentication Flow**:
  - JWT token generation
  - Token validation middleware
  - Refresh token mechanism

## Installation

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/yumrun.git
   cd yumrun
   ```

2. **Install dependencies**
   ```
   yarn install:all
   ```

3. **Configure environment variables**
   - Backend: Copy `.env.example` to `.env` in the backend directory
   - Frontend: Copy `.env.example` to `.env` in the frontend directory
   
   **Backend `.env` requirements:**
   ```
   # Server Configuration
   PORT=8000
   NODE_ENV=development
   
   # MongoDB Connection
   CONNECTION_STRING=mongodb://localhost:27017/yumrun
   
   # JWT Authentication
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:4000
   
   # File Upload Limits
   MAX_FILE_SIZE=5000000
   
   # Khalti Payment Gateway
   KHALTI_SECRET_KEY=your_khalti_secret_key
   KHALTI_PUBLIC_KEY=your_khalti_public_key
   ```
   
   **Frontend `.env` requirements:**
   ```
   VITE_API_URL=http://localhost:8000/api
   VITE_KHALTI_PUBLIC_KEY=your_khalti_public_key
   ```

4. **Start development servers**
   ```
   yarn dev
   ```

## Development

### Development Workflow

1. **Run the application**
   ```
   yarn dev
   ```
   This starts both frontend and backend concurrently.
   - Frontend: Vite dev server on port 4000
   - Backend: Express server on port 8000

2. **Code changes**
   - Frontend: Vite provides hot module replacement for instant updates
   - Backend: Using nodemon for automatic server restart on changes

3. **Build for production**
   ```
   yarn build
   ```
   This builds the frontend for production deployment.

### Database Setup

MongoDB will be created automatically when the server first connects. You can initialize the database with test data using the provided scripts in the backend directory.

## Usage

Access the application at `http://localhost:4000` after starting the development servers.

### Default Accounts

For testing purposes, the following accounts are available:

- **Customer**
  - Email: customer@example.com
  - Password: Test@123

- **Restaurant Owner**
  - Email: restaurant@example.com
  - Password: Test@123

- **Delivery Rider**
  - Email: rider@example.com
  - Password: Test@123

- **Administrator**
  - Email: admin@example.com
  - Password: Test@123

### Core Workflows

#### Customer Journey
1. Browse restaurants and menu items
2. Filter by dietary preferences
3. Add items to cart
4. Checkout and payment
5. Track order status
6. Rate and review experience

#### Restaurant Owner Journey
1. Manage restaurant profile
2. Create and update menu items
3. Process incoming orders
4. Track sales and analytics

#### Delivery Rider Journey
1. Set availability status
2. Accept delivery assignments
3. Update delivery status
4. Track earnings

#### Administrator Journey
1. Approve new restaurants
2. Manage user accounts
3. Monitor system performance
4. View platform analytics

## API Documentation

The API endpoints are organized by resource type. Base URL: `http://localhost:8000/api/`

### Authentication Endpoints `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| GET | `/me` | Get current user |
| PUT | `/me` | Update profile |
| POST | `/password` | Change password |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password/:token` | Reset password |

### User Endpoints `/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List users (admin) |
| GET | `/:id` | Get user details |
| PUT | `/:id` | Update user |
| DELETE | `/:id` | Delete user |
| GET | `/:id/orders` | Get user orders |

### Restaurant Endpoints `/api/restaurants`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List restaurants |
| GET | `/:id` | Get restaurant details |
| POST | `/` | Create restaurant |
| PUT | `/:id` | Update restaurant |
| DELETE | `/:id` | Delete restaurant |
| GET | `/:id/menu` | Get restaurant menu |
| GET | `/nearby` | Find nearby restaurants |

### Menu Endpoints `/api/menu`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | List menu items |
| GET | `/items/:id` | Get menu item details |
| POST | `/items` | Create menu item |
| PUT | `/items/:id` | Update menu item |
| DELETE | `/items/:id` | Delete menu item |

### Order Endpoints `/api/orders`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List orders |
| GET | `/:id` | Get order details |
| POST | `/` | Create order |
| PUT | `/:id/status` | Update order status |
| GET | `/:id/tracking` | Get order tracking |

### Other Key Endpoints

- **Payment**: `/api/payment`
- **Reviews**: `/api/reviews`
- **Nutrition**: `/api/nutrition`
- **Loyalty**: `/api/loyalty`
- **Delivery**: `/api/delivery`
- **Admin**: `/api/admin`
- **Offers**: `/api/offers`

## User Roles

### Customer
Can browse restaurants, place orders, track deliveries, and manage their profile.

### Restaurant Owner
Can manage restaurant profile, menu items, process orders, and view analytics.

### Delivery Rider
Can accept delivery requests, update delivery status, and track earnings.

### Administrator
Has full access to the system including user management, restaurant approvals, and system monitoring.

## Project Structure

```
yumrun/
├── backend/              # Node.js Express API
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── uploads/          # Uploaded files
│   ├── utils/            # Helper functions
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
│
├── frontend/             # React application
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── assets/       # Images and other assets
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── layouts/      # Page layout components
│   │   ├── lib/          # Utility libraries
│   │   ├── Pages/        # Page components
│   │   ├── utils/        # Helper functions
│   │   ├── App.jsx       # Root component
│   │   └── main.jsx      # Entry point
│   │
│   ├── index.html        # HTML template
│   └── vite.config.js    # Vite configuration
│
└── package.json          # Root package.json
```

## Database Models

### Key Models

- **User**: Core entity for all system users with role-specific fields
- **Restaurant**: Business information and menu management
- **MenuItem**: Food items with nutritional information
- **Order**: Order details with status tracking
- **Review**: Customer feedback and ratings
- **Loyalty**: Points system implementation
- **Payment**: Transaction records

### Relationships

- Users can place multiple orders
- Restaurants have multiple menu items
- Orders contain multiple menu items
- Users can leave multiple reviews
- Restaurants can have multiple reviews

## Authentication

YumRun implements a JWT-based authentication system:

### Registration Flow
1. User submits registration information
2. Password is hashed using bcrypt
3. User record is created in database
4. JWT token is generated and returned

### Login Flow
1. User submits credentials
2. Server validates email and password
3. JWT token is generated and returned
4. Token is stored in client for subsequent requests

### Authorization
1. JWT token is validated on protected routes
2. User role is checked against required permissions
3. Resource ownership is verified when applicable

## Security Features

- **Password Hashing**: Secure password storage with bcrypt
- **JWT Authentication**: Token-based authentication
- **Input Validation**: Server-side validation of all inputs
- **File Upload Security**: Type checking and size limitations
- **Error Handling**: Proper error responses without exposing sensitive information

## Deployment

### Frontend Deployment
- Build the frontend with `yarn build:frontend`
- Deploy the generated `dist` directory to a static hosting service
- Configure environment variables for the production API

### Backend Deployment
- Set up a production MongoDB database
- Configure environment variables for production
- Deploy the Node.js application to a hosting service
- Set up proper monitoring and logging

## Testing

- **Manual Testing**: Core user flows verified through manual testing
- **API Testing**: Endpoint testing using Postman
- **Responsive Testing**: UI verification across different screen sizes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License. 
