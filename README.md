# YUMRUN

A health-focused food ordering and delivery platform with nutritional transparency and personalized recommendations.

## Features

- **For Users**: Account management, health profile, meal customization, order tracking, reviews, loyalty points
- **For Restaurants**: Menu management, order tracking, health metrics
- **For Admins**: User/restaurant management, platform oversight

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
git clone https://github.com/yourusername/yumrun.git
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