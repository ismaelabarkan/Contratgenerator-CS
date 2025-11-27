/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

/**
 * Error handler middleware
 * Must be the last middleware in the chain
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    // Don't leak stack traces in production
    const isDev = process.env.NODE_ENV === 'development';

    const statusCode = err.statusCode || 500;
    const response = {
        error: err.message || 'Internal Server Error'
    };

    if (isDev) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};
