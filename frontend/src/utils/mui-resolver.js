/**
 * This file provides a workaround for the react-is issue with MUI packages
 * It re-exports the required functions from the correct version of react-is
 */
import * as ReactIs from 'react-is';

// Export the specific functions that MUI is looking for
export const isElement = ReactIs.isElement;
export const isValidElementType = ReactIs.isValidElementType;
export const isFragment = ReactIs.isFragment;

// Export other common functions to ensure they're available
export const typeOf = ReactIs.typeOf;
export const contextType = ReactIs.ContextType;
export const forward_ref = ReactIs.ForwardRef;
export const memo = ReactIs.Memo;
export const portal = ReactIs.Portal;
export const profiler = ReactIs.Profiler;
export const strict_mode = ReactIs.StrictMode;
export const suspense = ReactIs.Suspense;

// Default export for compatibility
export default ReactIs; 