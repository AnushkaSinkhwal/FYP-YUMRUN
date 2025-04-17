/**
 * This file provides a workaround for prop-types issues with MUI packages
 * It re-exports the prop-types module to ensure it's correctly resolved
 */
import PropTypes from 'prop-types';

// Re-export all PropTypes properties
export const array = PropTypes.array;
export const bool = PropTypes.bool;
export const func = PropTypes.func;
export const number = PropTypes.number;
export const object = PropTypes.object;
export const string = PropTypes.string;
export const symbol = PropTypes.symbol;
export const any = PropTypes.any;
export const arrayOf = PropTypes.arrayOf;
export const element = PropTypes.element;
export const elementType = PropTypes.elementType;
export const instanceOf = PropTypes.instanceOf;
export const node = PropTypes.node;
export const objectOf = PropTypes.objectOf;
export const oneOf = PropTypes.oneOf;
export const oneOfType = PropTypes.oneOfType;
export const shape = PropTypes.shape;
export const exact = PropTypes.exact;

// Default export for compatibility
export default PropTypes; 