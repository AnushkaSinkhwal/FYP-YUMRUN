# YumRun Backend API

This is the backend API for YumRun, a food delivery platform that emphasizes health consciousness, streamlined restaurant management, and efficient order delivery.

## Overview

The YumRun backend provides a comprehensive API for:
- User authentication and management
- Admin dashboard and controls
- Restaurant management
- Menu and nutrition information
- Order processing
- Delivery coordination

## Documentation

Detailed documentation is available in the `docs` directory:

- [Setup Guide](./docs/SETUP.md): Instructions for setting up the project
- [Authentication Guide](./docs/AUTHENTICATION.md): Details on the authentication system
- [API Documentation](./docs/API.md): Comprehensive API endpoint reference

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: Database
- **JWT**: Authentication mechanism
- **bcrypt**: Password hashing

## Getting Started

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Configure environment variables (see [Setup Guide](./docs/SETUP.md))
4. Create an admin user
   ```bash
   node scripts/createUser.js
   ```
5. Start the server
   ```bash
   npm start
   ```
   
For development with auto-reload:
```bash
npm run dev
```

## Project Structure

```
backend/
├── controllers/      # Request handlers
├── docs/             # Documentation
├── middleware/       # Express middleware
├── models/           # MongoDB schema models
├── routes/           # API routes
├── scripts/          # Utility scripts
├── utils/            # Helper functions
├── .env.example      # Example environment variables
├── app.js            # Express app setup
└── server.js         # Entry point
```

## Testing

Run the authentication test script to verify the system:

```bash
node scripts/test-auth.js
```

## Contributing

1. Follow the established code style and patterns
2. Create API endpoints in the appropriate routes folder
3. Use middleware for authentication and validation
4. Document new endpoints in the API documentation

## License

Copyright © 2023 YumRun. All rights reserved. 