// Image utility functions for the application

// Get the base URL for backend server
const getBackendUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  console.log('Backend URL:', backendUrl);
  return backendUrl;
};

/**
 * Get the full URL for an image path
 * @param {string} path - The image path (e.g., /uploads/placeholders/food-placeholder.jpg)
 * @returns {string} - The full URL including the backend server
 */
export const getFullImageUrl = (path) => {
  console.log('getFullImageUrl called with path:', path);
  
  // If the path already includes http or https, return it as is
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    console.log('Path already contains http/https, returning as is');
    return path;
  }
  
  // If path is null/undefined or empty, return a default placeholder
  if (!path) {
    const defaultUrl = `${getBackendUrl()}/uploads/placeholders/food-placeholder.jpg`;
    console.log('No path provided, returning default placeholder:', defaultUrl);
    return defaultUrl;
  }
  
  // Handle case when path is uploads/menu/file.jpg (without leading slash)
  // or /uploads/menu/file.jpg (with leading slash)
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If path doesn't start with /uploads and doesn't have http/https, it might be just a filename
  if (!formattedPath.includes('/uploads/') && !formattedPath.includes('/images/')) {
    // Check if it's just a filename like "abc.jpg"
    if (formattedPath.match(/^\/[^/]+\.(jpg|jpeg|png|gif|webp)$/i)) {
      const fullPath = `${getBackendUrl()}/uploads/menu${formattedPath}`;
      console.log('Simple filename detected, adding uploads/menu prefix:', fullPath);
      return fullPath;
    }
  }
  
  // Return full URL
  const fullUrl = `${getBackendUrl()}${formattedPath}`;
  console.log('Final image URL:', fullUrl);
  return fullUrl;
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