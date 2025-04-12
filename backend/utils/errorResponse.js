/**
 * Custom Error class for API error responses
 * Extends the built-in Error class with a statusCode property
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    
    // Capture the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse; 