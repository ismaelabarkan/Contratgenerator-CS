/**
 * Database Configuration
 * Initializes SQLite database connection and schema
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || './flows.db';

let db = null;

/**
 * Get database instance (singleton pattern)
 */
function getDatabase() {
    if (db) {
        return db;
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            throw err;
        } else {
            console.log('Connected to SQLite database');
            initDatabase();
        }
    });

    return db;
}

/**
 * Initialize database tables
 */
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
            createClausulesTable();
        }
    });
}

function createClausulesTable() {
    console.log('Creating clausules table...');

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

            // Skip seeding in test environment
            if (process.env.NODE_ENV !== 'test') {
                seedInitialData();
            }
        }
    });
}

/**
 * Seed initial data from JSON files
 */
function seedInitialData() {
    console.log('Starting seeding process...');
    const fs = require('fs');

    setTimeout(() => {
        // Seed FLOWS
        const flowsDir = path.join(__dirname, '../../flows');
        if (fs.existsSync(flowsDir)) {
            const files = fs.readdirSync(flowsDir).filter(file => file.endsWith('.json'));

            files.forEach(file => {
                try {
                    const flowData = JSON.parse(fs.readFileSync(path.join(flowsDir, file), 'utf8'));

                    db.get('SELECT id FROM flows WHERE flow_id = ?', [flowData.flow_id], (err, row) => {
                        if (err) {
                            console.error('Error checking flow:', err.message);
                        } else if (!row) {
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

        // Seed CLAUSULES
        const clausulesDir = path.join(__dirname, '../../clausules');
        if (fs.existsSync(clausulesDir)) {
            const files = fs.readdirSync(clausulesDir).filter(file => file.endsWith('.json'));
            console.log(`Found ${files.length} clausule files to seed`);

            files.forEach(file => {
                try {
                    const clausulesData = JSON.parse(fs.readFileSync(path.join(clausulesDir, file), 'utf8'));

                    Object.keys(clausulesData).forEach(clausuleId => {
                        const clausule = clausulesData[clausuleId];

                        db.get('SELECT id FROM clausules WHERE clausule_id = ?', [clausuleId], (err, row) => {
                            if (err) {
                                console.error(`Error checking clausule ${clausuleId}:`, err.message);
                            } else if (!row) {
                                db.run(
                                    'INSERT INTO clausules (clausule_id, titel, categorie, inhoud, versie, auteur, actief) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                    [
                                        clausuleId,
                                        clausule.titel || 'Onbekend',
                                        clausule.categorie || 'Algemeen',
                                        JSON.stringify(clausule),
                                        clausule.versie || '1.0',
                                        clausule.auteur || 'Systeem',
                                        clausule.verplicht ? 1 : 1
                                    ],
                                    function(err) {
                                        if (err) {
                                            console.error(`Error inserting clausule ${clausuleId}:`, err.message);
                                        } else {
                                            console.log(`Seeded clausule: ${clausuleId} - ${clausule.titel}`);
                                        }
                                    }
                                );
                            }
                        });
                    });
                } catch (error) {
                    console.error(`Error reading ${file}:`, error.message);
                }
            });
        }

        console.log('Seeding process completed');
    }, 1000);
}

/**
 * Close database connection
 */
function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Database connection closed');
        });
    }
}

module.exports = {
    getDatabase,
    closeDatabase
};
