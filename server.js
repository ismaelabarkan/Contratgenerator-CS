const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./flows.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    console.log('Starting database initialization...');
    db.run(`
        CREATE TABLE IF NOT EXISTS flows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flow_id TEXT UNIQUE NOT NULL,
            naam TEXT NOT NULL,
            beschrijving TEXT,
            versie TEXT DEFAULT '1.0',
            auteur TEXT DEFAULT 'Systeem',
            laatste_update TEXT DEFAULT CURRENT_TIMESTAMP,
            flow_data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating flows table:', err.message);
        } else {
            console.log('Flows table ready');
            console.log('Creating clausules table...');
            createClausulesTable();
        }
    });
}

function createClausulesTable() {
    db.run(`
        CREATE TABLE IF NOT EXISTS clausules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clausule_id TEXT UNIQUE NOT NULL,
            titel TEXT NOT NULL,
            categorie TEXT NOT NULL,
            inhoud TEXT NOT NULL,
            versie TEXT DEFAULT '1.0',
            auteur TEXT DEFAULT 'Systeem',
            actief BOOLEAN DEFAULT 1,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating clausules table:', err.message);
        } else {
            console.log('Clausules table ready');
            console.log('Database initialization completed');
            seedInitialData();
        }
    });
}

// Seed initial data from JSON files
function seedInitialData() {
    console.log('Starting seeding process...');
    
    // Use setTimeout to make seeding asynchronous
    setTimeout(() => {
        const fs = require('fs');
        const flowsDir = path.join(__dirname, 'flows');
        
        // Seed flows only (clausules seeding disabled for now)
        if (fs.existsSync(flowsDir)) {
            const files = fs.readdirSync(flowsDir).filter(file => file.endsWith('.json'));
            
            files.forEach(file => {
                try {
                    const flowData = JSON.parse(fs.readFileSync(path.join(flowsDir, file), 'utf8'));
                    
                    // Check if flow already exists
                    db.get('SELECT id FROM flows WHERE flow_id = ?', [flowData.flow_id], (err, row) => {
                        if (err) {
                            console.error('Error checking flow:', err.message);
                        } else if (!row) {
                            // Insert new flow
                            db.run(
                                'INSERT INTO flows (flow_id, naam, beschrijving, versie, auteur, flow_data) VALUES (?, ?, ?, ?, ?, ?)',
                                [
                                    flowData.flow_id,
                                    flowData.naam,
                                    flowData.beschrijving,
                                    flowData.versie || '1.0',
                                    flowData.auteur || 'Systeem',
                                    JSON.stringify(flowData)
                                ],
                                function(err) {
                                    if (err) {
                                        console.error('Error inserting flow:', err.message);
                                    } else {
                                        console.log(`Seeded flow: ${flowData.naam}`);
                                    }
                                }
                            );
                        }
                    });
                } catch (error) {
                    console.error(`Error reading ${file}:`, error.message);
                }
            });
        }
        
        console.log('Seeding process completed');
    }, 1000); // Wait 1 second before starting seeding
}

// API Routes

// Get all flows
app.get('/api/flows', (req, res) => {
    db.all('SELECT * FROM flows ORDER BY naam', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get specific flow
app.get('/api/flows/:flowId', (req, res) => {
    const { flowId } = req.params;
    
    db.get('SELECT * FROM flows WHERE flow_id = ?', [flowId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Flow not found' });
            return;
        }
        
        try {
            const flowData = JSON.parse(row.flow_data);
            res.json(flowData);
        } catch (parseErr) {
            res.status(500).json({ error: 'Invalid flow data' });
        }
    });
});

// Save/update flow
app.post('/api/flows/:flowId', (req, res) => {
    const { flowId } = req.params;
    const flowData = req.body;
    
    // Validate required fields
    if (!flowData.flow_id || !flowData.naam || !flowData.stappen) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    
    // Check if flow exists
    db.get('SELECT id FROM flows WHERE flow_id = ?', [flowId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const now = new Date().toISOString();
        
        if (row) {
            // Update existing flow
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
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({ message: 'Flow updated successfully', id: row.id });
                    }
                }
            );
        } else {
            // Insert new flow
            db.run(
                'INSERT INTO flows (flow_id, naam, beschrijving, versie, auteur, flow_data) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    flowData.flow_id,
                    flowData.naam,
                    flowData.beschrijving,
                    flowData.versie || '1.0',
                    flowData.auteur || 'Systeem',
                    JSON.stringify(flowData)
                ],
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({ message: 'Flow created successfully', id: this.lastID });
                    }
                }
            );
        }
    });
});

// Delete flow
app.delete('/api/flows/:flowId', (req, res) => {
    const { flowId } = req.params;
    
    db.run('DELETE FROM flows WHERE flow_id = ?', [flowId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Flow not found' });
        } else {
            res.json({ message: 'Flow deleted successfully' });
        }
    });
});

// ===== CLAUSULE API ROUTES =====

// Get all clausules
app.get('/api/clausules', (req, res) => {
    const { categorie, actief } = req.query;
    let query = 'SELECT * FROM clausules';
    let params = [];
    
    if (categorie || actief !== undefined) {
        const conditions = [];
        if (categorie) {
            conditions.push('categorie = ?');
            params.push(categorie);
        }
        if (actief !== undefined) {
            conditions.push('actief = ?');
            params.push(actief === 'true' ? 1 : 0);
        }
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY categorie, titel';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get clausule categories (must be before /:clausuleId route)
app.get('/api/clausules/categories', (req, res) => {
    db.all('SELECT DISTINCT categorie FROM clausules ORDER BY categorie', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row.categorie));
    });
});

// Get specific clausule
app.get('/api/clausules/:clausuleId', (req, res) => {
    const { clausuleId } = req.params;
    
    db.get('SELECT * FROM clausules WHERE clausule_id = ?', [clausuleId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Clausule not found' });
            return;
        }
        res.json(row);
    });
});

// Create new clausule
app.post('/api/clausules', (req, res) => {
    const { clausule_id, titel, categorie, inhoud, versie, auteur, tags } = req.body;
    
    // Validate required fields
    if (!clausule_id || !titel || !categorie || !inhoud) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    
    const now = new Date().toISOString();
    
    db.run(
        'INSERT INTO clausules (clausule_id, titel, categorie, inhoud, versie, auteur, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            clausule_id,
            titel,
            categorie,
            inhoud,
            versie || '1.0',
            auteur || 'Systeem',
            tags || '',
            now,
            now
        ],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ message: 'Clausule created successfully', id: this.lastID });
            }
        }
    );
});

// Update clausule
app.put('/api/clausules/:clausuleId', (req, res) => {
    const { clausuleId } = req.params;
    const { titel, categorie, inhoud, versie, auteur, actief, tags } = req.body;
    
    const now = new Date().toISOString();
    
    db.run(
        'UPDATE clausules SET titel = ?, categorie = ?, inhoud = ?, versie = ?, auteur = ?, actief = ?, tags = ?, updated_at = ? WHERE clausule_id = ?',
        [
            titel,
            categorie,
            inhoud,
            versie,
            auteur,
            actief !== undefined ? (actief ? 1 : 0) : 1,
            tags || '',
            now,
            clausuleId
        ],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Clausule not found' });
            } else {
                res.json({ message: 'Clausule updated successfully' });
            }
        }
    );
});

// Delete clausule
app.delete('/api/clausules/:clausuleId', (req, res) => {
    const { clausuleId } = req.params;
    
    db.run('DELETE FROM clausules WHERE clausule_id = ?', [clausuleId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Clausule not found' });
        } else {
            res.json({ message: 'Clausule deleted successfully' });
        }
    });
});

// Import clausules from JSON files
app.post('/api/import/clausules', (req, res) => {
    const fs = require('fs');
    const clausulesDir = path.join(__dirname, 'clausules');
    const results = [];
    
    if (!fs.existsSync(clausulesDir)) {
        return res.status(404).json({ error: 'Clausules directory not found' });
    }
    
    const files = fs.readdirSync(clausulesDir).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
        return res.status(404).json({ error: 'No JSON clausule files found' });
    }
    
    files.forEach(file => {
        try {
            const clausulesData = JSON.parse(fs.readFileSync(path.join(clausulesDir, file), 'utf8'));
            
            Object.keys(clausulesData).forEach(clausuleId => {
                const clausule = clausulesData[clausuleId];
                
                // Check if clausule already exists
                db.get('SELECT id FROM clausules WHERE clausule_id = ?', [clausuleId], (err, row) => {
                    if (err) {
                        results.push({ clausule: clausuleId, status: 'error', message: err.message });
                    } else if (row) {
                        // Update existing clausule
                        db.run(
                            'UPDATE clausules SET titel = ?, categorie = ?, inhoud = ?, versie = ?, auteur = ?, actief = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE clausule_id = ?',
                            [
                                clausule.titel,
                                clausule.categorie,
                                JSON.stringify(clausule),
                                clausule.versie || '1.0',
                                clausule.auteur || 'Systeem',
                                clausule.verplicht ? 1 : 0,
                                clausule.categorie,
                                clausuleId
                            ],
                            function(err) {
                                if (err) {
                                    results.push({ clausule: clausuleId, status: 'error', message: err.message });
                                } else {
                                    results.push({ clausule: clausuleId, status: 'updated', message: `Clausule ${clausule.titel} updated` });
                                }
                            }
                        );
                    } else {
                        // Insert new clausule
                        db.run(
                            'INSERT INTO clausules (clausule_id, titel, categorie, inhoud, versie, auteur, actief, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [
                                clausuleId,
                                clausule.titel,
                                clausule.categorie,
                                JSON.stringify(clausule),
                                clausule.versie || '1.0',
                                clausule.auteur || 'Systeem',
                                clausule.verplicht ? 1 : 0,
                                clausule.categorie
                            ],
                            function(err) {
                                if (err) {
                                    results.push({ clausule: clausuleId, status: 'error', message: err.message });
                                } else {
                                    results.push({ clausule: clausuleId, status: 'imported', message: `Clausule ${clausule.titel} imported` });
                                }
                            }
                        );
                    }
                });
            });
        } catch (error) {
            results.push({ file, status: 'error', message: error.message });
        }
    });
    
    // Wait a bit for async operations to complete
    setTimeout(() => {
        res.json({ 
            message: 'Clausules import completed', 
            results: results,
            total: results.length
        });
    }, 2000);
});

// Import flows from JSON files
app.post('/api/import/flows', (req, res) => {
    const fs = require('fs');
    const flowsDir = path.join(__dirname, 'flows');
    const results = [];
    
    if (!fs.existsSync(flowsDir)) {
        return res.status(404).json({ error: 'Flows directory not found' });
    }
    
    const files = fs.readdirSync(flowsDir).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
        return res.status(404).json({ error: 'No JSON flow files found' });
    }
    
    files.forEach(file => {
        try {
            const flowData = JSON.parse(fs.readFileSync(path.join(flowsDir, file), 'utf8'));
            
            // Check if flow already exists
            db.get('SELECT id FROM flows WHERE flow_id = ?', [flowData.flow_id], (err, row) => {
                if (err) {
                    results.push({ file, status: 'error', message: err.message });
                } else if (row) {
                    // Update existing flow
                    db.run(
                        'UPDATE flows SET naam = ?, beschrijving = ?, versie = ?, auteur = ?, flow_data = ?, updated_at = CURRENT_TIMESTAMP WHERE flow_id = ?',
                        [
                            flowData.naam,
                            flowData.beschrijving,
                            flowData.versie || '1.0',
                            flowData.auteur || 'Systeem',
                            JSON.stringify(flowData),
                            flowData.flow_id
                        ],
                        function(err) {
                            if (err) {
                                results.push({ file, status: 'error', message: err.message });
                            } else {
                                results.push({ file, status: 'updated', message: `Flow ${flowData.naam} updated` });
                            }
                        }
                    );
                } else {
                    // Insert new flow
                    db.run(
                        'INSERT INTO flows (flow_id, naam, beschrijving, versie, auteur, flow_data) VALUES (?, ?, ?, ?, ?, ?)',
                        [
                            flowData.flow_id,
                            flowData.naam,
                            flowData.beschrijving,
                            flowData.versie || '1.0',
                            flowData.auteur || 'Systeem',
                            JSON.stringify(flowData)
                        ],
                        function(err) {
                            if (err) {
                                results.push({ file, status: 'error', message: err.message });
                            } else {
                                results.push({ file, status: 'imported', message: `Flow ${flowData.naam} imported` });
                            }
                        }
                    );
                }
            });
        } catch (error) {
            results.push({ file, status: 'error', message: error.message });
        }
    });
    
    // Wait a bit for async operations to complete
    setTimeout(() => {
        res.json({ 
            message: 'Import completed', 
            results: results,
            total: files.length
        });
    }, 1000);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});
