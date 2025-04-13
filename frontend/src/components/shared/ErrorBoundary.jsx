import { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button } from '../ui';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

// Safe check for development mode that doesn't use process.env
const isDevelopment = () => {
  // In development, window.location.hostname is typically 'localhost' or '127.0.0.1'
  const hostname = window.location?.hostname || '';
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' ||
         hostname.includes('.local');
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static propTypes = {
    children: PropTypes.node.isRequired,
    onRetry: PropTypes.func,
    title: PropTypes.string,
    errorMessage: PropTypes.string,
    actionButton: PropTypes.node
  };

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error info for debugging
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }
  
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // If retry function is provided, call it
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="p-6 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
          <div className="flex items-center mb-4 text-red-500">
            <FaExclamationTriangle className="mr-2 text-2xl" />
            <h2 className="text-xl font-semibold">{this.props.title || "Something went wrong"}</h2>
          </div>
          
          <Alert variant="error" className="mb-4">
            {this.props.errorMessage || "An unexpected error occurred. Please try again."}
          </Alert>
          
          {this.state.error && isDevelopment() && (
            <div className="p-3 mb-4 overflow-auto text-sm text-red-600 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-300">
              <p className="font-mono">{this.state.error.toString()}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={this.handleReset}>
              <FaRedo className="mr-1" /> Retry
            </Button>
            {this.props.actionButton}
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 