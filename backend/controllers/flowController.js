/**
 * Flow Controller
 * Business logic for flow operations
 */

const FlowModel = require('../models/Flow');
const { sanitizeInput } = require('../../utils/sanitize');

/**
 * Get all flows
 */
async function getAllFlows(req, res) {
    try {
        const flows = await FlowModel.getAll();
        res.json(flows);
    } catch (error) {
        console.error('Error getting flows:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get specific flow by ID
 */
async function getFlowById(req, res) {
    try {
        const { flowId } = req.params;
        const flow = await FlowModel.getById(flowId);

        if (!flow) {
            return res.status(404).json({ error: 'Flow not found' });
        }

        // Parse flow_data JSON
        try {
            const flowData = JSON.parse(flow.flow_data);
            res.json(flowData);
        } catch (parseErr) {
            res.status(500).json({ error: 'Invalid flow data' });
        }
    } catch (error) {
        console.error('Error getting flow:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Save/update flow
 */
async function saveFlow(req, res) {
    try {
        const { flowId } = req.params;
        const flowData = req.body;

        // Validate required fields
        if (!flowData.flow_id || !flowData.naam || !flowData.stappen) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Sanitize input to prevent XSS
        flowData.naam = sanitizeInput(flowData.naam);
        flowData.beschrijving = sanitizeInput(flowData.beschrijving);
        flowData.auteur = sanitizeInput(flowData.auteur);

        // Check if flow exists
        const existingFlow = await FlowModel.getById(flowId);

        if (existingFlow) {
            // Update existing flow
            await FlowModel.update(flowId, flowData);
            res.json({ message: 'Flow updated successfully', id: existingFlow.id });
        } else {
            // Create new flow
            const result = await FlowModel.create(flowData);
            res.json({ message: 'Flow created successfully', id: result.id });
        }
    } catch (error) {
        console.error('Error saving flow:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Delete flow
 */
async function deleteFlow(req, res) {
    try {
        const { flowId } = req.params;
        const result = await FlowModel.delete(flowId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Flow not found' });
        }

        res.json({ message: 'Flow deleted successfully' });
    } catch (error) {
        console.error('Error deleting flow:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Import flows from JSON files
 */
async function importFlows(req, res) {
    try {
        const results = await FlowModel.importFromFiles();
        res.json({
            message: 'Import completed',
            results: results,
            total: results.length
        });
    } catch (error) {
        console.error('Error importing flows:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getAllFlows,
    getFlowById,
    saveFlow,
    deleteFlow,
    importFlows
};
