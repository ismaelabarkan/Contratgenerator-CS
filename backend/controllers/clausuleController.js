/**
 * Clausule Controller
 * Business logic for clausule operations
 */

const ClausuleModel = require('../models/Clausule');
const { sanitizeInput } = require('../../utils/sanitize');

/**
 * Get all clausules with optional filters
 */
async function getAllClausules(req, res) {
    try {
        const { categorie, actief } = req.query;
        const filters = {};

        if (categorie) filters.categorie = categorie;
        if (actief !== undefined) filters.actief = actief === 'true';

        const clausules = await ClausuleModel.getAll(filters);
        res.json(clausules);
    } catch (error) {
        console.error('Error getting clausules:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get all categories
 */
async function getCategories(req, res) {
    try {
        const categories = await ClausuleModel.getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get specific clausule by ID
 */
async function getClausuleById(req, res) {
    try {
        const { clausuleId } = req.params;
        const clausule = await ClausuleModel.getById(clausuleId);

        if (!clausule) {
            return res.status(404).json({ error: 'Clausule not found' });
        }

        res.json(clausule);
    } catch (error) {
        console.error('Error getting clausule:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Create new clausule
 */
async function createClausule(req, res) {
    try {
        let { clausule_id, titel, categorie, inhoud, versie, auteur, tags } = req.body;

        // Validate required fields
        if (!clausule_id || !titel || !categorie || !inhoud) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Sanitize input to prevent XSS
        clausule_id = sanitizeInput(clausule_id);
        titel = sanitizeInput(titel);
        categorie = sanitizeInput(categorie);
        inhoud = sanitizeInput(inhoud);
        versie = sanitizeInput(versie);
        auteur = sanitizeInput(auteur);
        tags = sanitizeInput(tags);

        const clausuleData = {
            clausule_id,
            titel,
            categorie,
            inhoud,
            versie,
            auteur,
            tags
        };

        const result = await ClausuleModel.create(clausuleData);
        res.json({ message: 'Clausule created successfully', id: result.id });
    } catch (error) {
        console.error('Error creating clausule:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Update existing clausule
 */
async function updateClausule(req, res) {
    try {
        const { clausuleId } = req.params;
        let { titel, categorie, inhoud, versie, auteur, actief, tags } = req.body;

        // Sanitize input to prevent XSS
        titel = sanitizeInput(titel);
        categorie = sanitizeInput(categorie);
        inhoud = sanitizeInput(inhoud);
        versie = sanitizeInput(versie);
        auteur = sanitizeInput(auteur);
        tags = sanitizeInput(tags);

        const clausuleData = {
            titel,
            categorie,
            inhoud,
            versie,
            auteur,
            actief,
            tags
        };

        const result = await ClausuleModel.update(clausuleId, clausuleData);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Clausule not found' });
        }

        res.json({ message: 'Clausule updated successfully' });
    } catch (error) {
        console.error('Error updating clausule:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Delete clausule
 */
async function deleteClausule(req, res) {
    try {
        const { clausuleId } = req.params;
        const result = await ClausuleModel.delete(clausuleId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Clausule not found' });
        }

        res.json({ message: 'Clausule deleted successfully' });
    } catch (error) {
        console.error('Error deleting clausule:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Import clausules from JSON files
 */
async function importClausules(req, res) {
    try {
        const results = await ClausuleModel.importFromFiles();
        res.json({
            message: 'Clausules import completed',
            results: results,
            total: results.length
        });
    } catch (error) {
        console.error('Error importing clausules:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getAllClausules,
    getCategories,
    getClausuleById,
    createClausule,
    updateClausule,
    deleteClausule,
    importClausules
};
