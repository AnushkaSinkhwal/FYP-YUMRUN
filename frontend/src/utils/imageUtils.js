// Image utility functions for the application

// Get the base URL for backend server
const getBackendUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  if (!backendUrl) {
    console.warn('Warning: VITE_BACKEND_URL is not set. Using default: http://localhost:8000');
  }
  return backendUrl;
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
  
  // If path is null/undefined/empty or just "undefined" string, return default placeholder
  if (!path || path === 'undefined' || path === 'null') {
    return PLACEHOLDERS.FOOD;
  }
  
  // Handle case when path is uploads/menu/file.jpg (without leading slash)
  // or /uploads/menu/file.jpg (with leading slash)
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Special case for menu item images
  if (!formattedPath.includes('/uploads/') && !formattedPath.includes('/images/')) {
    // If it's just a filename like "abc.jpg" without a path
    if (formattedPath.match(/^\/[^/]+\.(jpg|jpeg|png|gif|webp)$/i)) {
      return `${getBackendUrl()}/uploads/menu${formattedPath}`;
    }
    
    // If it's just "food-placeholder.jpg" without uploads prefix
    if (formattedPath.includes('placeholder')) {
      return `${getBackendUrl()}/uploads/placeholders${formattedPath}`;
    }
  }
  
  // Return full URL with backend
  return `${getBackendUrl()}${formattedPath}`;
};

/**
 * Gets the best image from an item that might have both image and imageUrl fields
 * @param {Object} item - The item to get the image from
 * @returns {string} - The URL to the image
 */
export const getBestImageUrl = (item) => {
  if (!item) {
    return PLACEHOLDERS.FOOD;
  }
  
  // Prioritize image fields: imageUrl, image, then fallback to default
  let imagePath = null;
  
  // For menu items, check both properties
  if (item.imageUrl && item.imageUrl !== 'undefined') {
    imagePath = item.imageUrl;
  } else if (item.image && item.image !== 'undefined') {
    imagePath = item.image;
  }
  
  // If no valid image found, return placeholder
  if (!imagePath || imagePath === 'undefined') {
    return PLACEHOLDERS.FOOD;
  }
  
  // Convert the path to a full URL
  return getFullImageUrl(imagePath);
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
  getBestImageUrl,
  PLACEHOLDERS
}; 