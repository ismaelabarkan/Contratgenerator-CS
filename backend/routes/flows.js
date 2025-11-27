/**
 * Flow Routes
 * API endpoints for flow operations
 */

const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flowController');

// Get all flows
router.get('/', flowController.getAllFlows);

// Get specific flow
router.get('/:flowId', flowController.getFlowById);

// Save/update flow
router.post('/:flowId', flowController.saveFlow);

// Delete flow
router.delete('/:flowId', flowController.deleteFlow);

module.exports = router;
