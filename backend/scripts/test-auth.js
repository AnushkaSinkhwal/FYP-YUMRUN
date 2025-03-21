require('dotenv').config();
const axios = require('axios');
const colors = require('colors');

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test@123';
const TEST_ADMIN_EMAIL = 'admin@example.com';
const TEST_ADMIN_PASSWORD = 'Admin@123';

// Utility to make requests with authorization header
const makeRequest = async (url, method = 'get', data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
      },
      data
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
const testRegularUserAuthentication = async () => {
  console.log('\n========== TESTING REGULAR USER AUTHENTICATION =========='.cyan);
  
  // 1. Register a new user
  console.log('\n1. Registering a new user'.yellow);
  const registerResponse = await makeRequest('/auth/register', 'post', {
    name: 'Test User',
    email: TEST_EMAIL,
    phone: '1234567890',
    password: TEST_PASSWORD,
    healthCondition: 'Healthy'
  });
  
  if (registerResponse.success) {
    console.log('✅ User registration successful'.green);
    console.log(`User: ${registerResponse.data.user.name}`.gray);
    console.log(`Email: ${registerResponse.data.user.email}`.gray);
  } else {
    if (registerResponse.status === 400 && registerResponse.error.includes('already exists')) {
      console.log('⚠️ User already exists, proceeding with login test'.yellow);
    } else {
      console.log('❌ User registration failed'.red);
      console.log(`Error: ${registerResponse.error}`.red);
      return null;
    }
  }
  
  // 2. Login with created user
  console.log('\n2. Testing user login'.yellow);
  const loginResponse = await makeRequest('/auth/login', 'post', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (!loginResponse.success) {
    console.log('❌ User login failed'.red);
    console.log(`Error: ${loginResponse.error}`.red);
    return null;
  }
  
  console.log('✅ User login successful'.green);
  const token = loginResponse.data.token;
  console.log(`Token received: ${token.substring(0, 20)}...`.gray);
  
  // 3. Access protected route
  console.log('\n3. Testing protected route access'.yellow);
  const protectedResponse = await makeRequest('/users/me', 'get', null, token);
  
  if (!protectedResponse.success) {
    console.log('❌ Protected route access failed'.red);
    console.log(`Error: ${protectedResponse.error}`.red);
    return null;
  }
  
  console.log('✅ Protected route access successful'.green);
  console.log(`User data retrieved`.gray);
  
  return token;
};

const testAdminAuthentication = async () => {
  console.log('\n========== TESTING ADMIN AUTHENTICATION =========='.cyan);
  
  // 1. Login as admin
  console.log('\n1. Testing admin login'.yellow);
  const loginResponse = await makeRequest('/auth/login', 'post', {
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD
  });
  
  if (!loginResponse.success) {
    console.log('❌ Admin login failed'.red);
    console.log(`Error: ${loginResponse.error}`.red);
    console.log('Make sure you have created an admin user using createUser.js script'.gray);
    return null;
  }
  
  console.log('✅ Admin login successful'.green);
  const token = loginResponse.data.token;
  console.log(`Token received: ${token.substring(0, 20)}...`.gray);
  
  // 2. Access admin route
  console.log('\n2. Testing admin route access'.yellow);
  const adminResponse = await makeRequest('/admin/statistics', 'get', null, token);
  
  if (!adminResponse.success) {
    console.log('❌ Admin route access failed'.red);
    console.log(`Error: ${adminResponse.error}`.red);
    return null;
  }
  
  console.log('✅ Admin route access successful'.green);
  console.log('Statistics:', adminResponse.data.data);
  
  return token;
};

const testInvalidAuthentication = async () => {
  console.log('\n========== TESTING INVALID AUTHENTICATION =========='.cyan);
  
  // 1. Test with invalid token
  console.log('\n1. Testing with invalid token'.yellow);
  const invalidToken = 'invalid.token.string';
  const invalidTokenResponse = await makeRequest('/users/me', 'get', null, invalidToken);
  
  if (invalidTokenResponse.success) {
    console.log('❌ Invalid token test failed - access was granted'.red);
    return false;
  }
  
  console.log('✅ Invalid token correctly rejected'.green);
  
  // 2. Test admin routes with regular user
  console.log('\n2. Testing admin route with regular user token'.yellow);
  
  // First create a regular user and get token
  const loginResponse = await makeRequest('/auth/login', 'post', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (!loginResponse.success) {
    console.log('❌ Could not login as regular user to test restrictions'.red);
    return false;
  }
  
  const userToken = loginResponse.data.token;
  
  // Now try to access admin route
  const adminAccessResponse = await makeRequest('/admin/statistics', 'get', null, userToken);
  
  if (adminAccessResponse.success) {
    console.log('❌ Regular user was able to access admin route'.red);
    return false;
  }
  
  console.log('✅ Admin route correctly restricted for regular users'.green);
  return true;
};

// Main test function
const runTests = async () => {
  console.log('\n🔐 TESTING JWT AUTHENTICATION SYSTEM 🔐'.cyan.bold);
  console.log('==============================================='.gray);
  
  try {
    // Test regular user flows
    const userToken = await testRegularUserAuthentication();
    if (!userToken) {
      console.log('\n❌ Regular user authentication tests failed'.red);
    }
    
    // Test admin flows
    const adminToken = await testAdminAuthentication();
    if (!adminToken) {
      console.log('\n❌ Admin authentication tests failed'.red);
    }
    
    // Test invalid authentication scenarios
    const invalidTestsPassed = await testInvalidAuthentication();
    if (!invalidTestsPassed) {
      console.log('\n❌ Invalid authentication tests failed'.red);
    }
    
    if (userToken && adminToken && invalidTestsPassed) {
      console.log('\n✅ All authentication tests passed successfully! 🎉'.green.bold);
    } else {
      console.log('\n⚠️ Some authentication tests failed'.yellow.bold);
    }
  } catch (error) {
    console.error('\n❌ Error running tests:'.red, error.message);
  }
};

// Run the tests
runTests(); 