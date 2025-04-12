// Image utility functions for the application

// Get the base URL for backend server
const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
};

/**
 * Get the full URL for an image path
 * @param {string} path - The image path (e.g., /uploads/placeholders/food-placeholder.jpg)
 * @returns {string} - The full URL including the backend server
 */
export const getFullImageUrl = (path) => {
  // If the path already includes http or https, return it as is
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  
  // If path is null/undefined or empty, return a default placeholder
  if (!path) {
    return `${getBackendUrl()}/uploads/placeholders/food-placeholder.jpg`;
  }
  
  // Make sure path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Return full URL
  return `${getBackendUrl()}${formattedPath}`;
};

// Common placeholder images
export const PLACEHOLDERS = {
  FOOD: `${getBackendUrl()}/uploads/placeholders/food-placeholder.jpg`,
  RESTAURANT: `${getBackendUrl()}/uploads/placeholders/restaurant-placeholder.jpg`,
  BANNER: `${getBackendUrl()}/uploads/placeholders/banner-placeholder.jpg`,
  USER: `${getBackendUrl()}/uploads/placeholders/user-placeholder.jpg`
};

export default {
  getFullImageUrl,
  PLACEHOLDERS
}; 