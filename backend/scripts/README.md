# Database Seeding Scripts

This directory contains scripts for seeding the YumRun database with test data.

## Available Scripts

### 1. seedDatabase.js

Seeds the database with:
- Restaurant owners
- Restaurants
- Menu items with nutritional information
- Sample customer reviews
- Downloads placeholder images to the uploads directory

**Usage:**
```bash
npm run seed
```

### 2. createTestUsers.js

Creates test users with different roles:
- Admin user
- Restaurant owner
- Regular user
- Delivery staff
- User with health condition (Diabetes)

**Usage:**
```bash
npm run create-users
```

## Running the Seeds in Sequence

For a complete test setup, run both scripts in sequence:

```bash
npm run create-users
npm run seed
```

## Notes

- The seed script will create the necessary directory structure for uploads if it doesn't exist.
- Images will be downloaded as placeholders using placehold.co service.
- Existing data for restaurants, menu items, and related reviews will be cleared before seeding.
- Test users from createTestUsers.js will not be deleted, allowing you to run it once and then run the seed script multiple times.

## Login Credentials

After running the scripts, you can use these credentials to login:

### From createTestUsers.js
- Admin: admin@yumrun.com / Secret@123
- Restaurant Owner: owner@yumrun.com / Secret@123
- Regular User: user@yumrun.com / Secret@123
- Delivery Staff: delivery@yumrun.com / Secret@123
- Diabetic User: diabetic@yumrun.com / Secret@123

### From seedDatabase.js
- Restaurant Owners: owner1@example.com through owner6@example.com / password123
- Customers: customer1@example.com through customer3@example.com / password123 