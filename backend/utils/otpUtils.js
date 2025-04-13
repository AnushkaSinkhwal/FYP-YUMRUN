/**
 * Utility functions for OTP generation and validation
 */

/**
 * Generate a random numeric OTP of specified length
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

/**
 * Check if an OTP is expired
 * @param {Date} expiryTime - Expiry timestamp
 * @returns {boolean} - True if expired, false otherwise
 */
const isOTPExpired = (expiryTime) => {
  if (!expiryTime) return true;
  return new Date() > new Date(expiryTime);
};

/**
 * Generate expiry time for OTP
 * @param {number} minutes - Validity period in minutes (default: 10)
 * @returns {Date} - Expiry timestamp
 */
const generateOTPExpiry = (minutes = 10) => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + minutes);
  return expiryTime;
};

module.exports = {
  generateOTP,
  isOTPExpired,
  generateOTPExpiry
}; 