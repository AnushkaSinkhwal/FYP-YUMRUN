# YumRun API Documentation

This document provides comprehensive information about the YumRun API endpoints, request formats, and authentication requirements.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected endpoints require a valid JWT token in the Authorization header.

### Authentication Headers

```
Authorization: Bearer <token>
```

## Base URL

All endpoints are relative to the base URL:

```
http://localhost:5000/api
```

## User Endpoints

### Register a New User

```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "phone": "1234567890",
  "password": "SecurePassword123!",
  "healthCondition": "Healthy" 
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "1234567890",
      "healthCondition": "Healthy",
      "isAdmin": false,
      "isOwner": false,
      "isDeliveryStaff": false
    },
    "token": "jwt_token"
  }
}
```

### User Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "1234567890",
      "healthCondition": "Healthy",
      "isAdmin": false,
      "isOwner": false,
      "isDeliveryStaff": false
    },
    "token": "jwt_token"
  }
}
```

### Get Current User

```
GET /users/me
```

**Headers:**
```
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "1234567890",
      "healthCondition": "Healthy",
      "isAdmin": false,
      "isOwner": false,
      "isDeliveryStaff": false
    }
  }
}
```

### Update User Profile

```
PUT /users/me
```

**Headers:**
```
Authorization: Bearer jwt_token
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "0987654321",
  "healthCondition": "Diabetes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "Updated Name",
      "email": "user@example.com",
      "phone": "0987654321",
      "healthCondition": "Diabetes",
      "isAdmin": false,
      "isOwner": false,
      "isDeliveryStaff": false
    }
  }
}
```

## Admin Endpoints

All admin endpoints require authentication with an admin user token.

### Get Statistics

```
GET /admin/statistics
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": 150,
    "owners": 25,
    "orders": 1200,
    "deliveries": 1180
  }
}
```

### Get All Users

```
GET /admin/users
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of users per page (default: 10)
- `search` (optional): Search term for name or email
- `role` (optional): Filter by role (admin, owner, delivery)

**Response:**
```json
{
  "success": true,
  "count": 150,
  "pagination": {
    "current": 1,
    "total": 15,
    "next": 2,
    "prev": null
  },
  "data": [
    {
      "_id": "user_id_1",
      "name": "User Name 1",
      "email": "user1@example.com",
      "phone": "1234567890",
      "healthCondition": "Healthy",
      "isAdmin": false,
      "isOwner": false,
      "isDeliveryStaff": false
    },
    // More users...
  ]
}
```

### Update User Role

```
PUT /admin/users/:userId/role
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "isAdmin": true,
  "isOwner": false,
  "isDeliveryStaff": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "isAdmin": true,
      "isOwner": false,
      "isDeliveryStaff": false
    }
  }
}
```

### Delete User

```
DELETE /admin/users/:userId
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Restaurant Endpoints

### Get All Restaurants

```
GET /restaurants
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of restaurants per page (default: 10)
- `search` (optional): Search term for restaurant name or cuisine
- `cuisineType` (optional): Filter by cuisine type

**Response:**
```json
{
  "success": true,
  "count": 25,
  "pagination": {
    "current": 1,
    "total": 3,
    "next": 2,
    "prev": null
  },
  "data": [
    {
      "_id": "restaurant_id_1",
      "name": "Restaurant Name 1",
      "address": "123 Food St",
      "phone": "1234567890",
      "cuisineType": ["Italian", "Mediterranean"],
      "openingHours": "9AM - 10PM",
      "owner": {
        "_id": "owner_id",
        "name": "Owner Name"
      },
      "averageRating": 4.5
    },
    // More restaurants...
  ]
}
```

### Get Restaurant Details

```
GET /restaurants/:restaurantId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "restaurant_id",
    "name": "Restaurant Name",
    "address": "123 Food St",
    "phone": "1234567890",
    "cuisineType": ["Italian", "Mediterranean"],
    "openingHours": "9AM - 10PM",
    "owner": {
      "_id": "owner_id",
      "name": "Owner Name"
    },
    "menu": [
      {
        "_id": "menu_item_id_1",
        "name": "Spaghetti Carbonara",
        "description": "Classic Italian pasta dish",
        "price": 12.99,
        "calories": 650,
        "ingredients": ["Pasta", "Eggs", "Cheese", "Bacon"],
        "category": "Pasta",
        "image": "http://example.com/images/carbonara.jpg"
      },
      // More menu items...
    ],
    "reviews": [
      {
        "_id": "review_id_1",
        "user": {
          "_id": "user_id",
          "name": "User Name"
        },
        "rating": 5,
        "comment": "Amazing food and service!",
        "createdAt": "2023-01-01T12:00:00Z"
      },
      // More reviews...
    ],
    "averageRating": 4.5
  }
}
```

### Create Restaurant (Owner only)

```
POST /owner/restaurants
```

**Headers:**
```
Authorization: Bearer owner_jwt_token
```

**Request Body:**
```json
{
  "name": "New Restaurant",
  "address": "456 Cuisine Ave",
  "phone": "9876543210",
  "cuisineType": ["Japanese", "Sushi"],
  "openingHours": "11AM - 9PM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Restaurant created successfully",
  "data": {
    "restaurant": {
      "_id": "restaurant_id",
      "name": "New Restaurant",
      "address": "456 Cuisine Ave",
      "phone": "9876543210",
      "cuisineType": ["Japanese", "Sushi"],
      "openingHours": "11AM - 9PM",
      "owner": "owner_id"
    }
  }
}
```

## Order Endpoints

### Create Order

```
POST /orders
```

**Headers:**
```
Authorization: Bearer jwt_token
```

**Request Body:**
```json
{
  "restaurant": "restaurant_id",
  "items": [
    {
      "menuItem": "menu_item_id_1",
      "quantity": 2,
      "specialInstructions": "Extra cheese please"
    },
    {
      "menuItem": "menu_item_id_2",
      "quantity": 1
    }
  ],
  "deliveryAddress": "789 Customer St, Apt 4B",
  "paymentMethod": "CASH"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "user": "user_id",
      "restaurant": "restaurant_id",
      "items": [
        {
          "menuItem": {
            "_id": "menu_item_id_1",
            "name": "Spaghetti Carbonara",
            "price": 12.99
          },
          "quantity": 2,
          "price": 25.98,
          "specialInstructions": "Extra cheese please"
        },
        {
          "menuItem": {
            "_id": "menu_item_id_2",
            "name": "Tiramisu",
            "price": 7.99
          },
          "quantity": 1,
          "price": 7.99
        }
      ],
      "subtotal": 33.97,
      "deliveryFee": 5.00,
      "tax": 3.40,
      "total": 42.37,
      "status": "PENDING",
      "deliveryAddress": "789 Customer St, Apt 4B",
      "paymentMethod": "CASH",
      "createdAt": "2023-01-15T14:30:00Z",
      "estimatedDeliveryTime": "2023-01-15T15:15:00Z"
    }
  }
}
```

### Get User Orders

```
GET /orders
```

**Headers:**
```
Authorization: Bearer jwt_token
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of orders per page (default: 10)
- `status` (optional): Filter by order status (PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)

**Response:**
```json
{
  "success": true,
  "count": 15,
  "pagination": {
    "current": 1,
    "total": 2,
    "next": 2,
    "prev": null
  },
  "data": [
    {
      "_id": "order_id_1",
      "restaurant": {
        "_id": "restaurant_id",
        "name": "Restaurant Name"
      },
      "status": "DELIVERED",
      "total": 42.37,
      "createdAt": "2023-01-15T14:30:00Z",
      "deliveryAddress": "789 Customer St, Apt 4B"
    },
    // More orders...
  ]
}
```

### Get Order Details

```
GET /orders/:orderId
```

**Headers:**
```
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "user": {
      "_id": "user_id",
      "name": "User Name"
    },
    "restaurant": {
      "_id": "restaurant_id",
      "name": "Restaurant Name",
      "address": "123 Food St",
      "phone": "1234567890"
    },
    "items": [
      {
        "menuItem": {
          "_id": "menu_item_id_1",
          "name": "Spaghetti Carbonara",
          "price": 12.99,
          "image": "http://example.com/images/carbonara.jpg"
        },
        "quantity": 2,
        "price": 25.98,
        "specialInstructions": "Extra cheese please"
      },
      {
        "menuItem": {
          "_id": "menu_item_id_2",
          "name": "Tiramisu",
          "price": 7.99,
          "image": "http://example.com/images/tiramisu.jpg"
        },
        "quantity": 1,
        "price": 7.99
      }
    ],
    "subtotal": 33.97,
    "deliveryFee": 5.00,
    "tax": 3.40,
    "total": 42.37,
    "status": "DELIVERED",
    "statusHistory": [
      {
        "status": "PENDING",
        "timestamp": "2023-01-15T14:30:00Z"
      },
      {
        "status": "CONFIRMED",
        "timestamp": "2023-01-15T14:32:00Z"
      },
      {
        "status": "PREPARING",
        "timestamp": "2023-01-15T14:40:00Z"
      },
      {
        "status": "OUT_FOR_DELIVERY",
        "timestamp": "2023-01-15T14:55:00Z"
      },
      {
        "status": "DELIVERED",
        "timestamp": "2023-01-15T15:20:00Z"
      }
    ],
    "deliveryAddress": "789 Customer St, Apt 4B",
    "paymentMethod": "CASH",
    "createdAt": "2023-01-15T14:30:00Z",
    "estimatedDeliveryTime": "2023-01-15T15:15:00Z",
    "deliveryPerson": {
      "_id": "delivery_id",
      "name": "Delivery Person Name",
      "phone": "5555555555"
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message describing what went wrong",
    "code": "ERROR_CODE" 
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication token is missing or invalid
- `FORBIDDEN`: User doesn't have permission to access the resource
- `NOT_FOUND`: Requested resource not found
- `VALIDATION_ERROR`: Request validation failed
- `SERVER_ERROR`: Internal server error 