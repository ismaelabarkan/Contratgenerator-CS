/**
 * Import Routes
 * API endpoints for importing data from JSON files
 */

const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flowController');
const clausuleController = require('../controllers/clausuleController');

// Import flows from JSON files
router.post('/flows', flowController.importFlows);

// Import clausules from JSON files
router.post('/clausules', clausuleController.importClausules);

module.exports = router;
