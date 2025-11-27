/**
 * Input Sanitization Utility
 * Protects against XSS attacks by sanitizing user input
 *
 * Usage:
 *   const { sanitizeInput, sanitizeObject } = require('./utils/sanitize');
 *   const cleanTitle = sanitizeInput(userInput);
 */

const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitize a single string input
 * @param {string} input - User input to sanitize
 * @param {object} options - DOMPurify configuration options
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input, options = {}) => {
    // Return non-strings as-is
    if (typeof input !== 'string') {
        return input;
    }

    // Default configuration: allow basic formatting but no scripts
    const defaultConfig = {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false
    };

    const config = { ...defaultConfig, ...options };

    return DOMPurify.sanitize(input, config);
};

/**
 * Sanitize all string properties in an object
 * @param {object} obj - Object with properties to sanitize
 * @param {array} excludeKeys - Keys to skip sanitization
 * @returns {object} Object with sanitized strings
 */
const sanitizeObject = (obj, excludeKeys = []) => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
        // Skip excluded keys
        if (excludeKeys.includes(key)) {
            sanitized[key] = value;
            continue;
        }

        // Recursively sanitize nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value, excludeKeys);
        }
        // Sanitize arrays
        else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeInput(item) : item
            );
        }
        // Sanitize strings
        else if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        }
        // Keep other types as-is
        else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

/**
 * Strip ALL HTML tags (for plain text fields)
 * @param {string} input - Input string
 * @returns {string} Plain text without any HTML
 */
const stripHTML = (input) => {
    if (typeof input !== 'string') {
        return input;
    }

    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        KEEP_CONTENT: true
    });
};

module.exports = {
    sanitizeInput,
    sanitizeObject,
    stripHTML
};
