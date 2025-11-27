/**
 * Clausule Routes
 * API endpoints for clausule operations
 */

const express = require('express');
const router = express.Router();
const clausuleController = require('../controllers/clausuleController');

// Get all clausules
router.get('/', clausuleController.getAllClausules);

// Get categories (must be before /:clausuleId to avoid conflict)
router.get('/categories', clausuleController.getCategories);

// Get specific clausule
router.get('/:clausuleId', clausuleController.getClausuleById);

// Create new clausule
router.post('/', clausuleController.createClausule);

// Update clausule
router.put('/:clausuleId', clausuleController.updateClausule);

// Delete clausule
router.delete('/:clausuleId', clausuleController.deleteClausule);

module.exports = router;
