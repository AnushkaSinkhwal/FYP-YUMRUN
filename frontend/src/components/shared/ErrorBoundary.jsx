import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button } from '../ui';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static propTypes = {
    children: PropTypes.node.isRequired
  };

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-8 max-w-lg mx-auto my-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <Alert variant="error" className="mb-6">
            <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
            <p className="mb-4">An unexpected error occurred in this component.</p>
            {this.state.error && (
              <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                <p><strong>Error:</strong> {this.state.error.toString()}</p>
              </div>
            )}
          </Alert>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="mr-2"
            >
              Try Again
            </Button>
            
            <Button
              variant="brand"
              onClick={() => window.location.href = '/'}
            >
              Go to Home Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 