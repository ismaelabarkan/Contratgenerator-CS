/**
 * Clausule Model
 * Data access layer for clausules
 */

const { getDatabase } = require('../config/database');

class ClausuleModel {
    /**
     * Get all clausules with optional filters
     */
    static getAll(filters = {}) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            let query = 'SELECT * FROM clausules';
            let params = [];

            const { categorie, actief } = filters;

            if (categorie || actief !== undefined) {
                const conditions = [];
                if (categorie) {
                    conditions.push('categorie = ?');
                    params.push(categorie);
                }
                if (actief !== undefined) {
                    conditions.push('actief = ?');
                    params.push(actief ? 1 : 0);
                }
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY categorie, titel';

            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get all unique categories
     */
    static getCategories() {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.all('SELECT DISTINCT categorie FROM clausules ORDER BY categorie', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.categorie));
                }
            });
        });
    }

    /**
     * Get clausule by ID
     */
    static getById(clausuleId) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get('SELECT * FROM clausules WHERE clausule_id = ?', [clausuleId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Create new clausule
     */
    static create(clausuleData) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const now = new Date().toISOString();

            db.run(
                'INSERT INTO clausules (clausule_id, titel, categorie, inhoud, versie, auteur, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    clausuleData.clausule_id,
                    clausuleData.titel,
                    clausuleData.categorie,
                    clausuleData.inhoud,
                    clausuleData.versie || '1.0',
                    clausuleData.auteur || 'Systeem',
                    clausuleData.tags || '',
                    now,
                    now
                ],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID });
                    }
                }
            );
        });
    }

    /**
     * Update existing clausule
     */
    static update(clausuleId, clausuleData) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const now = new Date().toISOString();

            db.run(
                'UPDATE clausules SET titel = ?, categorie = ?, inhoud = ?, versie = ?, auteur = ?, actief = ?, tags = ?, updated_at = ? WHERE clausule_id = ?',
                [
                    clausuleData.titel,
                    clausuleData.categorie,
                    clausuleData.inhoud,
                    clausuleData.versie,
                    clausuleData.auteur,
                    clausuleData.actief !== undefined ? (clausuleData.actief ? 1 : 0) : 1,
                    clausuleData.tags || '',
                    now,
                    clausuleId
                ],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    /**
     * Delete clausule
     */
    static delete(clausuleId) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.run('DELETE FROM clausules WHERE clausule_id = ?', [clausuleId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    /**
     * Import clausules from JSON files
     */
    static importFromFiles() {
        return new Promise((resolve, reject) => {
            const fs = require('fs');
            const path = require('path');
            const db = getDatabase();
            const clausulesDir = path.join(__dirname, '../../clausules');
            const results = [];

            if (!fs.existsSync(clausulesDir)) {
                return reject(new Error('Clausules directory not found'));
            }

            const files = fs.readdirSync(clausulesDir).filter(file => file.endsWith('.json'));

            if (files.length === 0) {
                return reject(new Error('No JSON clausule files found'));
            }

            let processed = 0;
            let totalClausules = 0;

            files.forEach(file => {
                try {
                    const clausulesData = JSON.parse(fs.readFileSync(path.join(clausulesDir, file), 'utf8'));
                    const clausuleKeys = Object.keys(clausulesData);
                    totalClausules += clausuleKeys.length;

                    clausuleKeys.forEach(clausuleId => {
                        const clausule = clausulesData[clausuleId];

                        db.get('SELECT id FROM clausules WHERE clausule_id = ?', [clausuleId], (err, row) => {
                            if (err) {
                                results.push({ clausule: clausuleId, status: 'error', message: err.message });
                            } else if (row) {
                                // Update existing
                                const updateData = {
                                    titel: clausule.titel,
                                    categorie: clausule.categorie,
                                    inhoud: JSON.stringify(clausule),
                                    versie: clausule.versie || '1.0',
                                    auteur: clausule.auteur || 'Systeem',
                                    actief: clausule.verplicht ? 1 : 0,
                                    tags: clausule.categorie
                                };

                                ClausuleModel.update(clausuleId, updateData)
                                    .then(() => {
                                        results.push({ clausule: clausuleId, status: 'updated', message: `Clausule ${clausule.titel} updated` });
                                    })
                                    .catch(err => {
                                        results.push({ clausule: clausuleId, status: 'error', message: err.message });
                                    })
                                    .finally(() => {
                                        processed++;
                                        if (processed === totalClausules) {
                                            resolve(results);
                                        }
                                    });
                            } else {
                                // Create new
                                const createData = {
                                    clausule_id: clausuleId,
                                    titel: clausule.titel,
                                    categorie: clausule.categorie,
                                    inhoud: JSON.stringify(clausule),
                                    versie: clausule.versie || '1.0',
                                    auteur: clausule.auteur || 'Systeem',
                                    tags: clausule.categorie
                                };

                                ClausuleModel.create(createData)
                                    .then(() => {
                                        results.push({ clausule: clausuleId, status: 'imported', message: `Clausule ${clausule.titel} imported` });
                                    })
                                    .catch(err => {
                                        results.push({ clausule: clausuleId, status: 'error', message: err.message });
                                    })
                                    .finally(() => {
                                        processed++;
                                        if (processed === totalClausules) {
                                            resolve(results);
                                        }
                                    });
                            }
                        });
                    });
                } catch (error) {
                    results.push({ file, status: 'error', message: error.message });
                    processed++;
                    if (processed === totalClausules) {
                        resolve(results);
                    }
                }
            });
        });
    }
}

module.exports = ClausuleModel;
