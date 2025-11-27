/**
 * Mock for isomorphic-dompurify
 * Simple implementation for testing
 */

module.exports = {
    sanitize: (input, options) => {
        if (typeof input !== 'string') return input;

        // Simple mock: just remove <script> tags
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<script[^>]*>/gi, '')
            .replace(/<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/onerror=/gi, '')
            .replace(/onclick=/gi, '')
            .replace(/onload=/gi, '');
    }
};
