/**
 * Health Check Route
 * API endpoint for health monitoring
 */

const express = require('express');
const router = express.Router();

// Health check
router.get('/', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '4.3.0'
    });
});

module.exports = router;
