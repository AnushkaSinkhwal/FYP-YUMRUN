/**
 * Validates if a string is in MongoDB ObjectID format (24 hexadecimal characters)
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if the ID is a valid MongoDB ObjectID format
 */
export const isValidObjectId = (id) => {
  if (!id) return false;
  const stringId = String(id).trim();
  return /^[0-9a-fA-F]{24}$/.test(stringId);
};

/**
 * Cleans an ID string by trimming and removing quotes
 * @param {string} id - The ID to clean
 * @returns {string} - The cleaned ID string
 */
export const cleanObjectId = (id) => {
  if (!id) return '';
  return String(id).trim().replace(/^["']|["']$/g, '');
}; 