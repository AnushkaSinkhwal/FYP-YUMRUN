# YumRun: Health-Focused Food Delivery Platform

YumRun is a comprehensive food delivery platform designed with health and nutrition as core principles. The application connects customers with restaurants and delivery riders while providing nutritional information, personalized recommendations, and health-focused features. This health-centric approach differentiates YumRun from conventional food delivery platforms by empowering users to make informed dietary choices aligned with their health goals and requirements.

## 🌟 Key Features

### For Customers

- **Health-Focused Ordering**
  - Detailed nutritional breakdowns (calories, macros, micronutrients)
  - Dietary filters (vegetarian, vegan, gluten-free, low-carb, etc.)
  - Allergen identification and filtering system
  - Health score rating for menu items
  - Customizable health profiles with personal nutrition goals
  - Personalized recommendations based on health data

- **Personalized Recommendations**
  - Machine learning-based suggestion engine using order history
  - Dietary preference matching algorithm
  - Health goal-oriented recommendations
  - Cuisine preference detection
  - Special occasion suggestions
  - Trending and popular item recommendations within health parameters

- **Customizable Meals**
  - Interactive ingredient add/remove system
  - Real-time nutritional recalculation
  - Portion size adjustment
  - Cooking preference options (spice level, doneness, etc.)
  - Special instructions handling
  - Substitution suggestions for healthier alternatives

- **Order Tracking**
  - Real-time GPS location of delivery riders
  - Estimated time of arrival calculations
  - Delivery status notifications (order accepted, preparing, on way, etc.)
  - Delivery route visualization
  - Communication channel with riders
  - In-app notification system

- **Loyalty System**
  - Points earning structure (10 points per Rs. 100 spent)
  - Points redemption options
  - Tier-based rewards (Bronze, Silver, Gold, Platinum)
  - Special milestone bonuses
  - Seasonal promotions and double-points days
  - Points expiration management

- **Reviews & Ratings**
  - Multi-dimensional rating system (food quality, packaging, delivery time, value)
  - Photo upload capability for reviews
  - Verified purchase badges
  - Helpfulness voting on reviews
  - Restaurant response system
  - Analytical insights from review data

- **Multiple Payment Options**
  - Khalti integration for digital payments
  - Cash on delivery
  - Credit/debit card processing
  - Mobile banking integration
  - Split payment capability
  - Secure payment gateway with tokenization

### For Restaurants

- **Menu Management**
  - Comprehensive item creation with nutritional input
  - Category and tag organization
  - Ingredient-level tracking and management
  - Seasonal menu planning tools
  - Stock level integration
  - Special/limited time offer creation
  - Bulk upload and update capabilities

- **Order Management**
  - Real-time order notification system
  - Order acceptance/rejection workflow
  - Preparation time assignment
  - Delivery coordination interface
  - Special instruction handling
  - Order history and analytics
  - Customer communication channel

- **Analytics Dashboard**
  - Sales performance metrics
  - Item popularity rankings
  - Customer retention analysis
  - Peak hour identification
  - Revenue projection tools
  - Comparison with historical data
  - Nutritional trend analysis of orders

- **Promotional Tools**
  - Discount creation system
  - Buy-one-get-one offers
  - Combo meal deals
  - Happy hour specials
  - Target audience segmentation
  - Promotion scheduling
  - Performance tracking of promotions

- **Profile Management**
  - Business information configuration
  - Operating hours setup with special days
  - Cuisine type specification
  - Service area definition
  - Restaurant story and philosophy section
  - Staff account management
  - Photo gallery management

### For Delivery Riders

- **Order Management**
  - Available order notifications
  - Order acceptance interface
  - Pickup and delivery details
  - Customer contact information
  - Special delivery instructions
  - Order history and statistics
  - Performance metrics

- **Navigation Tools**
  - Optimized route planning
  - Turn-by-turn directions
  - Traffic-aware routing
  - Multiple order sequencing
  - Location sharing with customer
  - Address geocoding and verification
  - Landmark-based navigation assistance

- **Earnings Tracking**
  - Real-time earnings calculation
  - Delivery fee breakdown
  - Tip management
  - Incentive and bonus tracking
  - Weekly and monthly summaries
  - Payment history
  - Tax reporting assistance

- **Status Management**
  - Availability toggle (online/offline)
  - Working hours setup
  - Break time management
  - Service area preferences
  - Capacity settings (max orders)
  - Automatic status updates based on activity
  - Scheduled availability

### For Administrators

- **User Management**
  - Comprehensive user database
  - Role-based access control
  - Account verification processes
  - Suspension and ban capabilities
  - User activity monitoring
  - Support ticket management
  - Bulk user operations

- **Restaurant Approvals**
  - Application review interface
  - Document verification process
  - Health and safety compliance checks
  - Quality standards enforcement
  - Probation period management
  - Restaurant categorization
  - Performance-based ranking system

- **System Analytics**
  - Platform-wide usage statistics
  - Revenue and transaction reporting
  - User acquisition and retention metrics
  - Geographic distribution analysis
  - Performance bottleneck identification
  - A/B testing framework
  - Seasonal trend analysis

- **Content Management**
  - Platform-wide announcements
  - Promotional banner system
  - Featured restaurant selection
  - Homepage content configuration
  - Email template management
  - Push notification campaigns
  - Health tip content creation

## 🔧 Technical Architecture

### System Overview
YumRun follows a modern client-server architecture with clear separation of concerns:

1. **Client Layer**: React-based frontend for various user interfaces (customer, restaurant, delivery, admin)
2. **API Layer**: Express.js RESTful API providing business logic and data access
3. **Data Layer**: MongoDB database storing all application data
4. **Service Layer**: Background jobs, notifications, and third-party integrations

Communication between layers is secured using JWT authentication, HTTPS encryption, and proper data validation at every level.

### Frontend Architecture

- **Framework**: React.js (v19.0.0)
  - Component-based architecture for reusability and maintainability
  - Virtual DOM for efficient rendering
  - Client-side routing for seamless user experience
  - Hooks for state management and lifecycle events

- **State Management**:
  - Context API with custom providers for global state
  - Local component state for UI-specific data
  - Custom hooks for reusable logic
  - Optimized re-rendering with memoization
  - Persistent state with localStorage/sessionStorage

- **Routing**: React Router (v7.1.5)
  - Declarative routing with nested routes
  - Route protection based on authentication and roles
  - Route-based code splitting for performance
  - URL parameter and query string handling
  - History management and navigation guards

- **Styling**:
  - Tailwind CSS for utility-first styling
    - Custom theme configuration
    - Responsive design utilities
    - Dark mode support
    - Custom plugin configuration
  - Shadcn UI for consistent component design
    - Accessibility-compliant components
    - Customizable theming system
    - Responsive behavior
  - CSS modules for component-specific styling
    - Scoped styles to prevent conflicts
    - Variable usage for consistency

- **Key Libraries**:
  - `react-toastify` for notifications
    - Custom toast configurations
    - Success, error, warning, and info messages
  - `axios` for API requests
    - Request/response interceptors
    - Authentication header management
    - Error handling middleware
  - `date-fns` for date/time manipulation
    - Localization support
    - Timezone handling
  - UI components from Radix UI
    - Accessible form controls
    - Modal and dialog components
    - Dropdown and select components
  - `react-slick` and `swiper` for carousels
    - Touch-enabled interfaces
    - Responsive breakpoints
    - Custom navigation controls

### Backend Architecture

- **Server**: Node.js with Express.js
  - Middleware-based request processing
  - Route grouping by domain
  - Error handling middleware
  - Request validation
  - Rate limiting and security features

- **Database**: MongoDB with Mongoose ORM
  - Schema-based data modeling
  - Validation at the model level
  - Indexing for performance
  - Relationship handling with refs
  - Aggregation pipeline for complex queries
  - Transaction support for data integrity

- **Authentication**: JWT-based with bcrypt password hashing
  - Token generation and validation
  - Refresh token mechanism
  - Role-based access control
  - Password security (hashing, salting)
  - Session management

- **File Storage**: Local file system with public URLs
  - Organized directory structure
  - File type validation
  - Size limitations
  - URL generation
  - Clean-up mechanisms
  - Backup strategies

- **Scheduled Jobs**: Node-cron for recurring tasks
  - Loyalty points expiration processing
  - Database cleanup and maintenance
  - Reporting generation
  - Email notifications
  - Status updates

- **API Structure**: RESTful API endpoints organized by domain
  - Consistent response formatting
  - HTTP status code usage
  - Resource-based URL structure
  - Query parameter handling
  - Pagination support

- **Key Libraries**:
  - `jsonwebtoken` for authentication
    - Token signing and verification
    - Expiration management
  - `multer` for file uploads
    - Multipart form handling
    - File filtering
    - Storage configuration
  - `nodemailer` for email notifications
    - Template-based emails
    - HTML and text versions
    - Attachment support
  - `validator` for input validation
    - Email, phone, URL validation
    - Sanitization functions
  - `express-async-handler` for error handling
    - Promise rejection handling
    - Consistent error responses

### Database Models

- **Users**
  - Core entity representing all system users
  - Role-specific fields for customers, restaurant owners, delivery riders, admins
  - Health profile data for customers
  - Authentication and personal information
  - Relationship mappings to orders, favorites, etc.

- **Restaurants**
  - Business information and operating parameters
  - Location and delivery area specifications
  - Menu categories and specialties
  - Rating aggregations
  - Owner relationship

- **MenuItems**
  - Comprehensive food item details
  - Nutritional information (macros, calories, etc.)
  - Customization options
  - Ingredient lists
  - Health attributes and allergen information
  - Pricing and availability

- **Orders**
  - Order details and line items
  - Status tracking information
  - Payment details
  - Delivery information
  - Customer, restaurant, and rider relationships
  - Timestamps for all status changes

- **Reviews**
  - Multi-faceted rating system
  - Review text and metadata
  - Photo attachments
  - Helpfulness votes
  - Restaurant response tracking

- **Loyalty**
  - Points system implementation
  - Transaction history
  - Redemption records
  - Expiration tracking
  - Tier status management

- **Payments**
  - Transaction records
  - Payment method details
  - Status tracking
  - Refund information
  - Receipt generation

- **Notifications**
  - Message content and metadata
  - Delivery status
  - User targeting
  - Type classification
  - Action triggers

## 💻 Project Structure

The YumRun application follows a modern monorepo structure with clear separation between frontend and backend components, organized for scalability and maintainability.

```
yumrun/
├── frontend/                # React frontend application
│   ├── public/              # Static assets
│   │   ├── favicon.ico      # Application favicon
│   │   ├── index.html       # HTML entry point
│   │   ├── manifest.json    # PWA manifest
│   │   └── robots.txt       # Search engine crawling rules
│   ├── src/
│   │   ├── assets/          # Images, fonts, and other assets
│   │   │   ├── fonts/       # Custom typography
│   │   │   ├── icons/       # SVG icons
│   │   │   └── images/      # Image resources
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Basic UI components (buttons, inputs, etc.)
│   │   │   │   ├── Button/  # Button component variants
│   │   │   │   ├── Input/   # Form input components
│   │   │   │   ├── Card/    # Card container components
│   │   │   │   └── ...      # Other UI primitives
│   │   │   ├── user/        # User-specific components
│   │   │   ├── restaurant/  # Restaurant-specific components
│   │   │   ├── delivery/    # Delivery-specific components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── shared/      # Cross-role components
│   │   │   └── layout/      # Page layout components
│   │   ├── context/         # React Context providers
│   │   │   ├── AuthContext.jsx     # Authentication state
│   │   │   ├── CartContext.jsx     # Shopping cart state
│   │   │   ├── ToastContext.jsx    # Notification system
│   │   │   └── ThemeContext.jsx    # Theme management
│   │   ├── layouts/         # Page layout components
│   │   │   ├── AdminLayout.jsx     # Admin dashboard layout
│   │   │   ├── UserLayout.jsx      # Customer dashboard layout
│   │   │   └── RestaurantLayout.jsx # Restaurant dashboard layout
│   │   ├── lib/             # Utility functions and constants
│   │   │   ├── api.js       # API client configuration
│   │   │   ├── constants.js # Application constants
│   │   │   ├── helpers.js   # Helper functions
│   │   │   └── validation.js # Form validation schemas
│   │   ├── Pages/           # Application pages
│   │   │   ├── Home.jsx     # Landing page
│   │   │   ├── SignIn.jsx   # Authentication pages
│   │   │   ├── admin/       # Admin pages
│   │   │   │   ├── Dashboard.jsx # Admin dashboard
│   │   │   │   ├── Users.jsx     # User management
│   │   │   │   └── ...           # Other admin pages
│   │   │   ├── restaurant/  # Restaurant pages
│   │   │   │   ├── Dashboard.jsx # Restaurant dashboard
│   │   │   │   ├── Menu.jsx      # Menu management
│   │   │   │   └── ...           # Other restaurant pages
│   │   │   ├── delivery/    # Delivery pages
│   │   │   ├── user/        # User pages
│   │   │   └── ...          # Other public pages
│   │   ├── utils/           # Helper functions
│   │   │   ├── auth.js      # Authentication utilities
│   │   │   ├── formatter.js # Data formatting utilities
│   │   │   ├── storage.js   # Local storage utilities
│   │   │   └── validation.js # Input validation utilities
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useAuth.js   # Authentication hook
│   │   │   ├── useCart.js   # Shopping cart hook
│   │   │   └── useForm.js   # Form handling hook
│   │   ├── App.jsx          # Main application component
│   │   │   └── routing configuration
│   │   ├── App.css          # Global styles
│   │   ├── index.css        # CSS entry point
│   │   ├── responsive.css   # Responsive design rules
│   │   └── main.jsx         # Application entry point
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   │   └── custom theme, plugins, extensions
│   ├── postcss.config.js    # PostCSS configuration
│   ├── vite.config.js       # Vite build configuration
│   │   └── plugins, optimization settings
│   ├── eslint.config.js     # ESLint configuration
│   ├── package.json         # Frontend dependencies
│   └── README.md            # Frontend documentation
│
├── backend/                 # Node.js backend application
│   ├── controllers/         # Request handlers
│   │   ├── authController.js # Authentication logic
│   │   ├── userController.js # User management
│   │   ├── restaurantController.js # Restaurant management
│   │   ├── orderController.js # Order processing
│   │   └── ...              # Other domain controllers
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # Authentication middleware
│   │   ├── errorHandler.js  # Error handling middleware
│   │   ├── upload.js        # File upload middleware
│   │   └── validator.js     # Request validation middleware
│   ├── models/              # Mongoose data models
│   │   ├── user.js          # User model
│   │   ├── restaurant.js    # Restaurant model
│   │   ├── menuItem.js      # Menu item model
│   │   ├── order.js         # Order model
│   │   └── ...              # Other data models
│   ├── routes/              # API route definitions
│   │   ├── auth.js          # Authentication routes
│   │   ├── users.js         # User management routes
│   │   ├── restaurants.js   # Restaurant routes
│   │   ├── orders.js        # Order processing routes
│   │   └── ...              # Other API routes
│   ├── scripts/             # Database scripts and utilities
│   │   ├── seedDatabase.js  # Database seeding
│   │   ├── createTestUsers.js # Test user creation
│   │   └── dbMigration.js   # Database migrations
│   ├── uploads/             # File uploads storage
│   │   ├── restaurants/     # Restaurant images
│   │   ├── menuItems/       # Food images
│   │   ├── users/           # User profile images
│   │   └── temp/            # Temporary uploads
│   ├── utils/               # Helper functions
│   │   ├── apiResponse.js   # Response formatting
│   │   ├── email.js         # Email utilities
│   │   ├── validation.js    # Data validation
│   │   └── loyaltyUtils.js  # Loyalty system helpers
│   ├── config/              # Configuration files
│   │   ├── db.js            # Database configuration
│   │   ├── email.js         # Email configuration
│   │   └── constants.js     # System constants
│   ├── jobs/                # Scheduled tasks
│   │   ├── loyaltyJobs.js   # Loyalty point processing
│   │   ├── notificationJobs.js # Notification processing
│   │   └── cleanupJobs.js   # Database cleanup
│   ├── app.js               # Express application setup
│   ├── server.js            # Server entry point
│   ├── package.json         # Backend dependencies
│   └── README.md            # Backend documentation
│
├── package.json             # Root package.json for project-wide scripts
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation
```

### File Organization Philosophy

The project follows these organizing principles:

1. **Domain-Driven Organization**: Files are grouped by business domain (user, restaurant, order) rather than technical function.
2. **Component Isolation**: Each component has its own directory with styles, tests, and supporting files.
3. **Feature Encapsulation**: Features are self-contained with minimal external dependencies.
4. **Separation of Concerns**: Clear boundaries between UI components, business logic, and data access.
5. **Scalable Structure**: Directory structure allows for growth without becoming unwieldy.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or later)
  - Required for running both frontend and backend
  - Recommended to install via NVM for version management
  
- **MongoDB** (v4.4 or later)
  - Primary database for storing application data
  - Can be installed locally or accessed via MongoDB Atlas
  
- **Yarn** or **npm** package manager
  - Yarn preferred for deterministic builds
  
- **Git** for version control
  - Required for cloning and managing the codebase

### Development Environment Setup

1. **Install Node.js**
   ```bash
   # Using NVM (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 14
   nvm use 14
   
   # Verify installation
   node --version  # Should be v14.x.x or higher
   ```

2. **Install MongoDB**
   ```bash
   # On macOS using Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   
   # On Ubuntu
   sudo apt update
   sudo apt install -y mongodb
   sudo systemctl start mongodb
   
   # Verify installation
   mongo --version
   ```

3. **Install Yarn**
   ```bash
   npm install -g yarn
   yarn --version  # Verify installation
   ```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FYP-YUMRUN.git
   cd FYP-YUMRUN
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   yarn install
   
   # Install frontend and backend dependencies
   yarn install:all
   
   # Or install them separately
   yarn install:backend
   yarn install:frontend
   ```

3. **Configure environment variables**
   ```bash
   # Backend environment setup
   cp backend/.env.example backend/.env
   
   # Frontend environment setup
   cp frontend/.env.example frontend/.env
   ```
   
   Edit the `.env` files with your specific configuration.
   
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
   FRONTEND_URL=http://localhost:5173
   
   # File Upload Limits
   MAX_FILE_SIZE=5000000
   
   # Email Configuration (if using)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASSWORD=your_email_password
   FROM_EMAIL=noreply@yumrun.com
   FROM_NAME=YumRun
   
   # Payment Gateway (Khalti)
   KHALTI_SECRET_KEY=your_khalti_secret_key
   KHALTI_PUBLIC_KEY=your_khalti_public_key
   
   # Google Maps API (for location services)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```
   
   **Frontend `.env` requirements:**
   ```
   # API Connection
   VITE_API_URL=http://localhost:8000/api
   
   # External Services
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_KHALTI_PUBLIC_KEY=your_khalti_public_key
   
   # Feature Flags
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_CHAT=false
   
   # Build Configuration
   VITE_APP_NAME=YumRun
   VITE_APP_VERSION=1.0.0
   ```

4. **Start development servers**
   ```bash
   # Start both frontend and backend concurrently
   yarn dev
   
   # Or start them separately in different terminals
   yarn dev:frontend  # Starts Vite dev server on port 5173
   yarn dev:backend   # Starts Express server on port 8000
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api
   - API Documentation: http://localhost:8000/api-docs (if implemented)

### Database Setup

#### Initializing the Database

The MongoDB database will be created automatically when the server first connects, but you'll need to set up initial data.

To initialize the database with test users and seed data:

```bash
cd backend
node scripts/createTestUsers.js
```

This creates the following test accounts:

- **Admin**
  - Email: admin@yumrun.com
  - Password: Admin@123
  - Access: Full administrative privileges
  
- **Restaurant Owner**
  - Email: owner@restaurant.com
  - Password: Owner@123
  - Access: Restaurant management capabilities
  
- **Customer**
  - Email: user@example.com
  - Password: User@123
  - Access: Customer ordering capabilities

#### Database Schema Initialization

The MongoDB schema is defined using Mongoose models and is automatically applied when the application starts. The models define the structure, validation rules, and relationships between documents.

You can manually inspect the database using MongoDB Compass or the mongo shell:

```bash
# Connect to the MongoDB shell
mongo
# Switch to the yumrun database
use yumrun
# List all collections
show collections
# View sample documents from the users collection
db.users.find().limit(5).pretty()
```

### Development Workflow

1. **Run the application**
   ```bash
   # Start development servers
   yarn dev
   ```

2. **Code changes**
   - Frontend: Vite provides hot module replacement for instant updates
   - Backend: Using nodemon for automatic server restart on changes

3. **Code linting**
   ```bash
   # Lint frontend code
   cd frontend && yarn lint
   
   # Fix linting issues automatically
   cd frontend && yarn lint --fix
   ```

4. **Building for production**
   ```bash
   # Build the frontend
   yarn build:frontend
   
   # The build output will be in frontend/dist/
   ```

## 🔄 Core Workflows

### Customer Journey

#### 1. User Registration and Authentication
   - **Registration Process**
     1. User navigates to signup page
     2. Enters personal details (name, email, phone, address)
     3. Creates password (validated for strength)
     4. Submits registration form
     5. Receives verification email
     6. Confirms email to activate account
   
   - **Login Process**
     1. User enters email and password
     2. System validates credentials
     3. JWT token is issued and stored
     4. User is redirected to homepage/dashboard

#### 2. Restaurant Browsing and Search
   - **Search Functionality**
     1. User enters search terms or filters
     2. System queries database with filter parameters
     3. Results are presented with pagination
     4. User can refine search with additional filters
   
   - **Filter Options**
     - Cuisine type (Indian, Italian, Chinese, etc.)
     - Dietary preferences (Vegetarian, Vegan, Gluten-free)
     - Health conditions (Diabetic-friendly, Low-sodium)
     - Price range (budget to premium)
     - Rating threshold (4+ stars, etc.)
     - Distance from user location
     - Delivery time estimate

#### 3. Menu Item Selection and Customization
   - **Menu Browsing**
     1. User selects a restaurant
     2. Views menu categories
     3. Browses available items
     4. Views detailed item information
   
   - **Nutritional Information Display**
     1. Calories, macronutrients (protein, carbs, fat)
     2. Micronutrients (vitamins, minerals)
     3. Allergen warnings
     4. Health attributes (heart-healthy, diabetic-friendly)
   
   - **Meal Customization**
     1. User selects an item to customize
     2. Views available modifications (add/remove ingredients)
     3. System recalculates nutrition with each change
     4. User confirms customization
     5. Price adjusts according to changes

#### 4. Cart Management
   - **Adding Items**
     1. User selects quantity
     2. Adds item to cart
     3. System confirms addition
   
   - **Cart Editing**
     1. User reviews cart contents
     2. Can modify quantities
     3. Can remove items
     4. Can add special instructions
     5. System updates totals in real-time

#### 5. Checkout Process
   - **Order Review**
     1. User reviews cart items
     2. Confirms delivery address or adds new address
     3. Selects delivery time (ASAP or scheduled)
     4. Adds order notes
   
   - **Payment Processing**
     1. User selects payment method
     2. For digital payment:
        a. Redirected to payment gateway
        b. Completes payment
        c. Returns to YumRun with confirmation
     3. For COD:
        a. Confirms order without payment
        b. Payment recorded for collection on delivery
   
   - **Order Confirmation**
     1. System generates order number
     2. Sends confirmation email and SMS
     3. Displays confirmation screen
     4. Redirects to order tracking page

#### 6. Order Tracking
   - **Status Updates**
     1. Order received by restaurant
     2. Order preparation started
     3. Order ready for pickup
     4. Rider assigned and en route to restaurant
     5. Order picked up by rider
     6. Rider en route to delivery location
     7. Order delivered
   
   - **Real-Time Tracking**
     1. Map view shows rider's current location
     2. ETA calculation and display
     3. Ability to contact rider or restaurant

#### 7. Post-Order Experience
   - **Review and Rating**
     1. User prompted to rate experience
     2. Can rate food quality, packaging, delivery time, and service
     3. Can leave detailed review and photos
     4. Reviews visible to other users and restaurant
   
   - **Loyalty Points**
     1. Points calculated based on order value
     2. Added to user's loyalty account
     3. Notification of current balance and tier
     4. Option to redeem points on future orders

### Restaurant Owner Journey

#### 1. Restaurant Registration
   - **Application Process**
     1. Owner registers personal account
     2. Selects "Register a Restaurant" option
     3. Submits restaurant details:
        - Name, address, contact information
        - Business registration number
        - Restaurant description
        - Cuisine types
        - Operating hours
        - Delivery radius
        - Minimum order amount
     4. Uploads required documents:
        - Food safety certificates
        - Business license
        - Owner ID proof
     5. Application submitted for admin review
     6. Notification when approved/rejected

#### 2. Restaurant Profile Setup
   - **Basic Information**
     1. Configure restaurant details
     2. Set operating hours (regular and special)
     3. Define service area and delivery fees
     4. Upload logo and cover images
     5. Add restaurant description and policies
   
   - **Menu Creation**
     1. Define menu categories
     2. Add individual menu items:
        - Name and description
        - Price and portion size
        - Preparation time
        - Dietary attributes
        - Allergen information
        - Customization options
     3. Upload food images
     4. Input nutritional information
     5. Set item availability
     6. Configure ingredient options

#### 3. Order Management
   - **New Order Flow**
     1. Restaurant receives order notification
     2. Reviews order details and special instructions
     3. Accepts or rejects order (with reason)
     4. Sets estimated preparation time
     5. Begins preparation
     6. Marks order as ready for pickup
   
   - **Order History**
     1. View past orders by date range
     2. Filter by status, customer, or amount
     3. Export order data for accounting
     4. View customer feedback

#### 4. Inventory and Menu Management
   - **Item Availability**
     1. Update stock status
     2. Temporarily disable sold-out items
     3. Schedule items for special days
   
   - **Menu Updates**
     1. Edit existing items
     2. Add new items or categories
     3. Run promotional specials
     4. Update pricing

#### 5. Analytics and Reports
   - **Performance Metrics**
     1. View daily/weekly/monthly sales reports
     2. Analyze peak ordering times
     3. Review most popular items
     4. Monitor average order value
     5. Track customer retention rates
   
   - **Customer Insights**
     1. View demographic information
     2. Analyze ordering patterns
     3. Identify loyal customers
     4. Monitor customer satisfaction trends

### Delivery Rider Journey

#### 1. Rider Registration
   - **Application Process**
     1. Rider registers personal account
     2. Selects "Register as Delivery Partner" option
     3. Submits personal and vehicle details:
        - Name, address, contact information
        - Vehicle type and registration
        - License information
        - Working area preferences
     4. Uploads required documents:
        - ID proof
        - Vehicle registration
        - Driver's license
        - Insurance documents
     5. Application submitted for admin review
     6. Notification when approved/rejected

#### 2. Delivery Management
   - **Availability Setting**
     1. Rider toggles online/offline status
     2. Sets working hours
     3. Defines service area
   
   - **Order Acceptance**
     1. Rider receives nearby order notification
     2. Views restaurant location, delivery address, and estimated earnings
     3. Accepts or rejects delivery opportunity
     4. System provides optimal route to restaurant
   
   - **Pickup Process**
     1. Navigates to restaurant
     2. Confirms arrival at restaurant
     3. Collects order and verifies contents
     4. Confirms pickup in app
   
   - **Delivery Process**
     1. System provides optimal route to customer
     2. Rider navigates to delivery location
     3. Confirms arrival at customer location
     4. Hands over order to customer
     5. Collects payment (if COD)
     6. Marks delivery as completed

#### 3. Earnings and Performance
   - **Earnings Tracking**
     1. Views per-delivery earnings
     2. Tracks tips received
     3. Views daily/weekly/monthly summaries
     4. Monitors incentives and bonuses
   
   - **Performance Metrics**
     1. Delivery completion rate
     2. On-time delivery percentage
     3. Customer satisfaction rating
     4. Average delivery time
     5. Total deliveries completed

### Admin Journey

#### 1. User Management
   - **User Monitoring**
     1. View all user accounts
     2. Filter by role, status, or date joined
     3. Search specific users
     4. View user activity logs
   
   - **Account Actions**
     1. Verify unverified accounts
     2. Suspend problematic accounts
     3. Reset user passwords
     4. Modify user roles
     5. Handle account deletion requests

#### 2. Restaurant Management
   - **Approval Process**
     1. Review new restaurant applications
     2. Verify submitted documents
     3. Check business legitimacy
     4. Approve or reject with reason
     5. Set probation period if needed
   
   - **Monitoring and Support**
     1. Audit restaurant performance
     2. Handle restaurant complaints
     3. Enforce quality standards
     4. Manage featured restaurant selections

#### 3. System Monitoring
   - **Performance Oversight**
     1. Monitor system uptime
     2. Track API response times
     3. View error logs
     4. Analyze user behavior
   
   - **Financial Monitoring**
     1. Track transaction volumes
     2. Monitor revenue streams
     3. Handle refund requests
     4. Generate financial reports

#### 4. Content Management
   - **Platform Content**
     1. Manage homepage featured content
     2. Update promotional banners
     3. Edit static page content
     4. Configure email templates
   
   - **Announcements**
     1. Create system-wide notifications
     2. Target announcements to specific user groups
     3. Schedule promotional campaigns
     4. Measure announcement effectiveness

## 🔐 Authentication and Authorization

### Authentication System

YumRun implements a secure, token-based authentication system to protect user data and enforce appropriate access controls.

#### Registration Flow

1. **User Registration**
   - Client collects and validates user data
   - Password strength is checked (min 8 chars, mixed case, numbers)
   - Email uniqueness is verified
   - Phone number is validated and formatted

2. **Server-Side Processing**
   - Password is hashed using bcrypt (10 salt rounds)
   - User record is created in database
   - Verification token is generated
   - Welcome email with verification link is sent

3. **Email Verification**
   - User clicks verification link
   - Token is validated for authenticity and expiration
   - User account is marked as verified
   - User is redirected to login page

#### Login Flow

1. **Credential Submission**
   - User submits email and password
   - Rate limiting protects against brute force attacks
   - CAPTCHA triggers after multiple failed attempts

2. **Authentication**
   - Server looks up user by email
   - Password hash is compared with stored hash
   - Failed attempts are logged
   - Successful login generates JWT tokens

3. **Token Generation**
   - Access token (short-lived, 15min)
   - Refresh token (longer-lived, 7 days)
   - Tokens include user ID and role claims
   - Tokens are signed with server's secret key

4. **Session Management**
   - Access token stored in memory (React state)
   - Refresh token stored in HTTP-only cookie
   - Auto-refresh mechanism for seamless experience
   - Sliding expiration for active users

#### Password Reset

1. **Reset Request**
   - User submits email address
   - System generates reset token
   - Token is embedded in reset URL
   - Reset email is sent to user

2. **Password Change**
   - User clicks reset link
   - Token validity is verified
   - User sets new password
   - All active sessions are invalidated
   - Confirmation email is sent

### Authorization System

YumRun implements role-based access control (RBAC) to ensure users can only access appropriate functionality.

#### Role Hierarchy

1. **Admin**
   - Full system access
   - User management capabilities
   - System configuration
   - Content management
   - Analytics access

2. **Restaurant Owner**
   - Restaurant profile management
   - Menu management
   - Order processing
   - Customer management
   - Analytics for own restaurant

3. **Delivery Rider**
   - Profile management
   - Order acceptance and delivery
   - Earnings tracking
   - Navigation features
   - Communication with customers

4. **Customer**
   - Profile management
   - Restaurant browsing
   - Order placement
   - Order history access
   - Review submission

#### Permission Enforcement

1. **Frontend Protection**
   - Route guards prevent unauthorized access
   - UI elements are conditionally rendered
   - Navigation menus adjust to role
   - Client-side validation as UX enhancement

2. **Backend Protection**
   - JWT verification middleware
   - Role-checking middleware
   - Resource ownership validation
   - Detailed access logs
   - Input validation and sanitization

3. **API Security**
   - Rate limiting to prevent abuse
   - CORS protection
   - Request validation
   - Response sanitization
   - Error message security (no leaking of sensitive info)

## 🌐 API Structure

YumRun's backend provides a comprehensive RESTful API organized by domain. All endpoints follow consistent patterns for request/response handling and error management.

### API Design Principles

1. **RESTful Resources**
   - Resources identified by URLs
   - HTTP methods reflect actions (GET, POST, PUT, DELETE)
   - Consistent plural naming (users, restaurants, orders)
   - Nested resources for relationships (/restaurants/{id}/menu)

2. **Response Format**
   ```json
   {
     "success": true,
     "statusCode": 200,
     "message": "Operation successful",
     "data": { /* Response data */ },
     "pagination": { /* If applicable */ }
   }
   ```

3. **Error Format**
   ```json
   {
     "success": false,
     "statusCode": 400,
     "message": "Error description",
     "errors": [
       { "field": "email", "message": "Invalid email format" }
     ]
   }
   ```

4. **Authentication**
   - Bearer token in Authorization header
   - API key for public endpoints (if applicable)
   - CSRF protection for browser-based requests

### Core API Endpoints

#### Authentication Endpoints `/api/auth`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| POST | `/api/auth/register` | Register new user | `{ name, email, password, phone, address, role }` | User object with token |
| POST | `/api/auth/login` | User login | `{ email, password }` | User object with token |
| POST | `/api/auth/logout` | User logout | None | Success message |
| GET | `/api/auth/me` | Get current user | None | User object |
| PUT | `/api/auth/me` | Update profile | `{ name, phone, address, etc. }` | Updated user object |
| POST | `/api/auth/password` | Change password | `{ currentPassword, newPassword }` | Success message |
| POST | `/api/auth/forgot-password` | Request password reset | `{ email }` | Success message |
| POST | `/api/auth/reset-password/:token` | Reset password | `{ password }` | Success message |
| POST | `/api/auth/verify-email/:token` | Verify email | None | Success message |
| POST | `/api/auth/refresh-token` | Refresh JWT token | `{ refreshToken }` | New access token |

#### User Management Endpoints `/api/users`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/users` | List users (admin) | Query params for filtering | Array of users |
| GET | `/api/users/:id` | Get user details | None | User object |
| PUT | `/api/users/:id` | Update user (admin) | User data | Updated user object |
| DELETE | `/api/users/:id` | Delete user | None | Success message |
| GET | `/api/users/:id/orders` | Get user orders | Query params | Array of orders |
| GET | `/api/users/:id/reviews` | Get user reviews | Query params | Array of reviews |
| PUT | `/api/users/:id/role` | Change user role (admin) | `{ role }` | Updated user object |
| GET | `/api/users/health-profile` | Get health profile | None | Health profile object |
| PUT | `/api/users/health-profile` | Update health profile | Health data | Updated health profile |

#### Restaurant Endpoints `/api/restaurants`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/restaurants` | List restaurants | Query params for filtering | Array of restaurants |
| GET | `/api/restaurants/:id` | Get restaurant details | None | Restaurant object |
| POST | `/api/restaurants` | Create restaurant | Restaurant data | New restaurant object |
| PUT | `/api/restaurants/:id` | Update restaurant | Restaurant data | Updated restaurant object |
| DELETE | `/api/restaurants/:id` | Delete restaurant | None | Success message |
| GET | `/api/restaurants/:id/menu` | Get restaurant menu | Query params | Array of menu items |
| GET | `/api/restaurants/:id/reviews` | Get restaurant reviews | Query params | Array of reviews |
| GET | `/api/restaurants/:id/hours` | Get operating hours | None | Hours object |
| PUT | `/api/restaurants/:id/hours` | Update operating hours | Hours data | Updated hours object |
| GET | `/api/restaurants/nearby` | Find nearby restaurants | `{ lat, lng, radius }` | Array of restaurants |
| GET | `/api/restaurants/featured` | Get featured restaurants | None | Array of restaurants |
| GET | `/api/restaurants/categories` | Get cuisine categories | None | Array of categories |

#### Menu Endpoints `/api/menu`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/menu/items` | List menu items | Query params | Array of menu items |
| GET | `/api/menu/items/:id` | Get menu item details | None | Menu item object |
| POST | `/api/menu/items` | Create menu item | Menu item data | New menu item object |
| PUT | `/api/menu/items/:id` | Update menu item | Menu item data | Updated menu item object |
| DELETE | `/api/menu/items/:id` | Delete menu item | None | Success message |
| PUT | `/api/menu/items/:id/availability` | Update availability | `{ isAvailable }` | Updated item object |
| GET | `/api/menu/categories` | List menu categories | None | Array of categories |
| POST | `/api/menu/categories` | Create menu category | Category data | New category object |
| GET | `/api/menu/items/popular` | Get popular items | Query params | Array of popular items |
| GET | `/api/menu/items/health/:condition` | Get items for health condition | None | Array of suitable items |

#### Order Endpoints `/api/orders`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/orders` | List orders | Query params | Array of orders |
| GET | `/api/orders/:id` | Get order details | None | Order object |
| POST | `/api/orders` | Create order | Order data | New order object |
| PUT | `/api/orders/:id/status` | Update order status | `{ status, notes }` | Updated order object |
| GET | `/api/orders/:id/tracking` | Get order tracking | None | Tracking object |
| POST | `/api/orders/:id/cancel` | Cancel order | `{ reason }` | Updated order object |
| GET | `/api/orders/restaurant/:id` | Get restaurant orders | Query params | Array of orders |
| GET | `/api/orders/user/:id` | Get user orders | Query params | Array of orders |
| GET | `/api/orders/delivery/:id` | Get delivery rider orders | Query params | Array of orders |
| POST | `/api/orders/:id/review` | Add order review | Review data | Review object |

#### Payment Endpoints `/api/payment`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| POST | `/api/payment/initialize` | Initialize payment | Payment data | Payment session |
| POST | `/api/payment/verify` | Verify payment | `{ token, amount }` | Verification result |
| GET | `/api/payment/methods` | Get payment methods | None | Array of methods |
| GET | `/api/payment/transactions` | Get transactions | Query params | Array of transactions |
| POST | `/api/payment/refund` | Request refund | Refund data | Refund object |

#### Additional API Groups

- `/api/nutrition`: Nutritional information endpoints
- `/api/delivery`: Delivery management endpoints
- `/api/admin`: Admin-specific endpoints
- `/api/offers`: Promotional offers endpoints
- `/api/reviews`: Customer review endpoints
- `/api/favorites`: User favorites management
- `/api/loyalty`: Loyalty program endpoints
- `/api/search`: Search functionality endpoints

## 💅 UI Components

YumRun uses a consistent design system built with:

- **Tailwind CSS**: For utility-first styling
- **Shadcn UI**: For accessible UI components
- **Custom Components**: Application-specific components

Key components include:

- Navigation and layout components
- Form elements and controls
- Cards and containers
- Modals and dialogs
- Tables and data display elements
- Loading and error states

## 🔍 Health and Nutrition Features

- **Dietary Filtering**: Filter menu items by dietary requirements
- **Nutritional Breakdown**: Detailed nutritional information for all menu items
- **Health Profile**: User health profiles for personalized recommendations
- **Ingredient Customization**: Modify meals to suit dietary needs
- **Allergen Information**: Clearly marked allergens for food safety

## 📱 Responsive Design

YumRun is fully responsive across devices:

- Mobile-first approach
- Adaptive layouts
- Touch-friendly interfaces
- Optimized images and assets

## 🛡️ Security Features

- **Input Validation**: Server-side validation of all inputs
- **CORS Protection**: Configured cross-origin resource sharing
- **Secure Cookies**: HTTP-only cookies for authentication
- **Rate Limiting**: Protection against brute force attacks
- **File Upload Validation**: Secure file upload handling

## 🧪 Testing

- **Frontend Tests**: Component testing with React Testing Library
- **Backend Tests**: API testing with Jest and Supertest
- **End-to-End Tests**: User flow testing with Cypress

## 🌙 Dark Mode

YumRun supports both light and dark themes:

- System preference detection
- User preference toggle
- Persistent theme selection

## 📦 Deployment

### Frontend Deployment
- Build the frontend with `yarn build:frontend`
- Deploy the generated `dist` directory to any static hosting

### Backend Deployment
- Set production environment variables
- Start the server with `NODE_ENV=production node app.js`
- Consider using PM2 or similar for process management

## 📝 License

This project is licensed under the MIT License. 
