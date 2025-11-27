/**
 * Flow Model
 * Data access layer for flows
 */

const { getDatabase } = require('../config/database');

class FlowModel {
    /**
     * Get all flows
     */
    static getAll() {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.all('SELECT * FROM flows ORDER BY naam', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get flow by ID
     */
    static getById(flowId) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get('SELECT * FROM flows WHERE flow_id = ?', [flowId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Create new flow
     */
    static create(flowData) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const now = new Date().toISOString();

            db.run(
                'INSERT INTO flows (flow_id, naam, beschrijving, versie, auteur, flow_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    flowData.flow_id,
                    flowData.naam,
                    flowData.beschrijving,
                    flowData.versie || '1.0',
                    flowData.auteur || 'Systeem',
                    JSON.stringify(flowData),
                    now,
                    now
                ],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, flowId: flowData.flow_id });
                    }
                }
            );
        });
    }

    /**
     * Update existing flow
     */
    static update(flowId, flowData) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const now = new Date().toISOString();

            db.run(
                'UPDATE flows SET naam = ?, beschrijving = ?, versie = ?, auteur = ?, flow_data = ?, updated_at = ? WHERE flow_id = ?',
                [
                    flowData.naam,
                    flowData.beschrijving,
                    flowData.versie || '1.0',
                    flowData.auteur || 'Systeem',
                    JSON.stringify(flowData),
                    now,
                    flowId
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
     * Delete flow
     */
    static delete(flowId) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.run('DELETE FROM flows WHERE flow_id = ?', [flowId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    /**
     * Import flows from JSON files
     */
    static importFromFiles() {
        return new Promise((resolve, reject) => {
            const fs = require('fs');
            const path = require('path');
            const db = getDatabase();
            const flowsDir = path.join(__dirname, '../../flows');
            const results = [];

            if (!fs.existsSync(flowsDir)) {
                return reject(new Error('Flows directory not found'));
            }

            const files = fs.readdirSync(flowsDir).filter(file => file.endsWith('.json'));

            if (files.length === 0) {
                return reject(new Error('No JSON flow files found'));
            }

            let processed = 0;

            files.forEach(file => {
                try {
                    const flowData = JSON.parse(fs.readFileSync(path.join(flowsDir, file), 'utf8'));

                    db.get('SELECT id FROM flows WHERE flow_id = ?', [flowData.flow_id], (err, row) => {
                        if (err) {
                            results.push({ file, status: 'error', message: err.message });
                        } else if (row) {
                            // Update existing
                            FlowModel.update(flowData.flow_id, flowData)
                                .then(() => {
                                    results.push({ file, status: 'updated', message: `Flow ${flowData.naam} updated` });
                                })
                                .catch(err => {
                                    results.push({ file, status: 'error', message: err.message });
                                })
                                .finally(() => {
                                    processed++;
                                    if (processed === files.length) {
                                        resolve(results);
                                    }
                                });
                        } else {
                            // Create new
                            FlowModel.create(flowData)
                                .then(() => {
                                    results.push({ file, status: 'imported', message: `Flow ${flowData.naam} imported` });
                                })
                                .catch(err => {
                                    results.push({ file, status: 'error', message: err.message });
                                })
                                .finally(() => {
                                    processed++;
                                    if (processed === files.length) {
                                        resolve(results);
                                    }
                                });
                        }
                    });
                } catch (error) {
                    results.push({ file, status: 'error', message: error.message });
                    processed++;
                    if (processed === files.length) {
                        resolve(results);
                    }
                }
            });
        });
    }
}

module.exports = FlowModel;
