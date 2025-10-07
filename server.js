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
            seedInitialData();
        }
    });
}

// Seed initial data from JSON files
function seedInitialData() {
    const fs = require('fs');
    const flowsDir = path.join(__dirname, 'flows');
    
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
