# Architectuur Analyse - Contract Generator v4.2.0
**Datum:** 7 november 2025
**Versie:** 4.2.0
**Analist:** Claude Code

---

## 1. Executive Summary

De Contract Generator is een **monolithische single-page application** met een Express.js backend en standalone React frontend. De applicatie functioneert goed voor haar huidige use case, maar heeft significante technische schuld en architecturale beperkingen die schaalbaarheid en onderhoud bemoeilijken.

**Urgentie:** Gemiddeld tot Hoog
**Risico's:** Security, maintainability, scalability
**Geschatte verbeter-effort:** 4-6 weken (gefaseerd)

---

## 2. Huidige Architectuur

### 2.1 High-Level Overzicht

```
┌─────────────────────────────────────────────────────┐
│  Gebruiker Browser                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │ standalone_contract_generator_v3_flow.html    │ │
│  │ (2736 regels - COMPLETE SPA)                  │ │
│  │  - React 18 (CDN)                             │ │
│  │  - Tailwind CSS (CDN)                         │ │
│  │  - DOMPurify (CDN)                            │ │
│  │  - docx.js (CDN)                              │ │
│  │  - ALL business logic embedded                │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                      ↓ HTTP/REST
┌─────────────────────────────────────────────────────┐
│  Express.js Server (server.js - 631 regels)        │
│  ┌───────────────────────────────────────────────┐ │
│  │ REST API (/api/flows, /api/clausules)        │ │
│  │ Static file serving                           │ │
│  └───────────────────────────────────────────────┘ │
│              ↓                                      │
│  ┌───────────────────────────────────────────────┐ │
│  │ SQLite Database (flows.db)                    │ │
│  │  - flows table                                │ │
│  │  - clausules table                            │ │
│  │  - JSON storage in TEXT fields                │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Frontend:**
- React 18 (CDN - development build!)
- Tailwind CSS (CDN - JIT mode)
- DOMPurify 3.0.5 (XSS protection)
- docx.js 7.8.2 (Word document generation)
- FileSaver.js 2.0.5 (File downloads)

**Backend:**
- Node.js + Express 4.18.2
- SQLite3 5.1.6
- CORS 2.8.5 (wide open!)
- body-parser 1.20.2

**DevOps:**
- Docker + docker-compose
- Volume mounts voor hot-reload
- Nginx potentieel (Dockerfile aanwezig maar niet gebruikt)

### 2.3 Bestandsstructuur

```
ContractGenerator/
├── standalone_contract_generator_v3_flow.html  ⚠️ MONOLITH (2736 lines)
├── server.js                                   ⚠️ All API logic here
├── flows.db                                    ⚠️ SQLite in repo
├── beheer/
│   ├── flow-beheer.html                       ⚠️ Duplicated React setup
│   └── clausule-beheer.html                   ⚠️ Duplicated React setup
├── flows/                                      ✓ JSON data
├── clausules/                                  ✓ JSON data
├── afbeeldingen/                              ✓ Assets
├── archief/                                    ✓ Old files
├── docs/                                       ✓ Documentation
└── scripts/                                    ✓ Utility scripts
```

---

## 3. Sterke Punten ✅

### 3.1 Functionaliteit
- **Volledig werkend systeem** - alle features operationeel
- **Flow engine** - flexibele conditional logic
- **Word export** - client-side generatie werkt goed
- **Admin interfaces** - complete CRUD voor flows en clausules
- **i-Sociaaldomein branding** - consistente look & feel

### 3.2 Deployment
- **Docker setup** - reproduceerbare omgeving
- **Volume mounts** - snelle development workflow
- **Health checks** - monitoring aanwezig

### 3.3 Data Management
- **JSON als source of truth** - flows/clausules in VCS
- **Import functionaliteit** - eenvoudig data synchroniseren
- **SQLite** - zero-configuration database

---

## 4. Kritieke Aandachtspunten 🚨

### 4.1 SECURITY - HOOG RISICO

#### 4.1.1 XSS (Cross-Site Scripting) Vulnerabilities
**Status:** ⚠️ **HOOG RISICO**

**Probleem:**
```javascript
// standalone_contract_generator_v3_flow.html:~1500
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(clausule.tekst) }}
```
- DOMPurify is aanwezig (goed), MAAR:
- User input wordt opgeslagen in database zonder sanitization
- Admin interfaces hebben GEEN input sanitization
- Clausule tekst komt uit JSON files die handmatig bewerkt kunnen worden
- Risk scenario: Malicious HTML/JS in clausule → opgeslagen in DB → rendered voor alle users

**Impact:** Hoog - mogelijk account takeover, data theft, malware distribution

#### 4.1.2 CORS - WIDE OPEN
**Status:** ⚠️ **MEDIUM RISICO**

```javascript
// server.js:11
app.use(cors()); // Allows ALL origins!
```
- Elke website kan API calls maken
- Geen authenticatie vereist voor data modificatie
- CSRF attacks mogelijk

**Impact:** Medium - ongeautoriseerde data modificatie

#### 4.1.3 SQL Injection - PROTECTED maar ONVOLLEDIG
**Status:** ✅ **LAAG RISICO** (maar niet perfect)

```javascript
// server.js:195 - GOED: Prepared statements
db.get('SELECT * FROM flows WHERE flow_id = ?', [flowId], ...)

// server.js:299-312 - KWETSBAAR: Dynamic query building
let query = 'SELECT * FROM clausules';
if (categorie || actief !== undefined) {
    const conditions = [];
    if (categorie) {
        conditions.push('categorie = ?'); // OK
        params.push(categorie);
    }
}
```
- Meeste queries gebruiken prepared statements (goed)
- Maar: dynamic query construction is foutgevoelig
- Geen input validation op API niveau

#### 4.1.4 Geen Authenticatie/Autorisatie
**Status:** 🚨 **KRITIEK**

- GEEN login systeem
- GEEN role-based access control
- Iedereen met URL toegang kan:
  - Flows aanpassen
  - Clausules verwijderen
  - Data exporteren
  - Admin interfaces gebruiken

**Impact:** Kritiek - complete data compromise mogelijk

#### 4.1.5 React Development Build in Production
**Status:** ⚠️ **MEDIUM RISICO**

```html
<!-- Using development builds from CDN -->
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
```
- Development build bevat warning messages
- Langzamer dan production build
- Geeft meer informatie over app structuur (security through obscurity verlies)

### 4.2 ARCHITECTUUR - TECHNISCHE SCHULD

#### 4.2.1 Monolithische Frontend
**Status:** 🔴 **HOOG**

**Problemen:**
- **2736 regels** in één HTML bestand
- Alle React components embedded
- Geen component reusability
- Geen code splitting
- Moeilijk te testen
- Merge conflicts bij multiple developers

**Maintenance impact:**
- Elk feature duurt 2-3x langer
- Bug fix in één component kan andere componenten breken
- Onmogelijk om unit tests te schrijven

#### 4.2.2 Code Duplicatie
**Status:** 🔴 **HOOG**

**3 identieke React setups:**
1. `standalone_contract_generator_v3_flow.html`
2. `beheer/flow-beheer.html`
3. `beheer/clausule-beheer.html`

Elke heeft:
- Eigen CDN imports
- Duplicated styling
- Duplicated utility functions
- Eigen versie van "header component"

**Gevolg:** Een CSS fix moet 3x worden toegepast

#### 4.2.3 Geen Error Handling
**Status:** 🟡 **MEDIUM**

```javascript
// server.js:516-522 - GEVAARLIJK
setTimeout(() => {
    res.json({
        message: 'Clausules import completed',
        results: results,  // Results kunnen leeg zijn!
        total: results.length
    });
}, 2000);  // Waarom 2 seconden? Race condition!
```

- Async operations met setTimeout (hacky)
- Geen error boundaries in React
- Database errors worden geswallowd
- Geen logging framework

#### 4.2.4 Database als Blob Storage
**Status:** 🟡 **MEDIUM**

```sql
CREATE TABLE flows (
    ...
    flow_data TEXT NOT NULL,  -- Hele flow als JSON string!
    ...
)
```

**Problemen:**
- Geen normalisatie
- Kan niet querien op flow properties
- Geen referential integrity
- Kan niet indexeren
- Backup/restore moeilijk

### 4.3 PERFORMANCE

#### 4.3.1 Geen Caching
**Status:** 🟡 **MEDIUM**

- Elke page load: fetch alle flows + alle clausules
- Geen browser caching headers
- Geen memoization in React
- CDN libraries zonder version pinning (cache busting issues)

#### 4.3.2 N+1 Query Potentieel
**Status:** 🟡 **LAAG** (maar present)

```javascript
// server.js:460-508 - Binnen loop db queries!
Object.keys(clausulesData).forEach(clausuleId => {
    db.get('SELECT id FROM clausules WHERE clausule_id = ?', ...);
});
```

### 4.4 DATA MANAGEMENT

#### 4.4.1 Database In Repository
**Status:** 🔴 **HOOG**

```
flows.db  <-- Should be in .gitignore!
```

**Problemen:**
- Binary file in git
- Merge conflicts onmogelijk
- Database groei = repo groei
- Productie data in development

#### 4.4.2 Geen Migrations
**Status:** 🟡 **MEDIUM**

- Schema changes vereisen manual SQL
- Geen versioning van database schema
- Downgrade onmogelijk
- Geen rollback strategie

#### 4.4.3 Inconsistente Data Sources
**Status:** 🟡 **MEDIUM**

**Twee waarheidsgebieden:**
1. JSON files in `flows/` en `clausules/`
2. SQLite database `flows.db`

Welke is de source of truth?
- Bij startup: JSON → DB (seeding)
- Bij edit via admin: DB is updated, JSON NIET
- Bij deploy: Oude JSON overschrijft nieuwe DB?

### 4.5 DEVELOPER EXPERIENCE

#### 4.5.1 Geen Build Process
- Geen TypeScript
- Geen linting
- Geen formatting (prettier)
- Geen pre-commit hooks
- Geen CI/CD

#### 4.5.2 Geen Testing
- Geen unit tests
- Geen integration tests
- Geen E2E tests
- Manual testing only

#### 4.5.3 Dependencies Management
```json
"dependencies": {
    "express": "^4.18.2",  // Caret ranges = breaking changes mogelijk
    "sqlite3": "^5.1.6",
    ...
}
```
- Geen lock file committed (npm package-lock.json)
- Loose version ranges
- CDN dependencies zonder pinning

---

## 5. VERBETERPLAN - Stapsgewijze Aanpak

### Filosofie
**"Strangler Fig Pattern"** - Geleidelijk vervangen terwijl oude systeem blijft werken.

Elke stap:
1. Kan onafhankelijk getest worden
2. Kan teruggedraaid worden
3. Voegt waarde toe zonder bestaande functionaliteit te breken

---

### FASE 1: SECURITY HARDENING (Week 1-2)
**Prioriteit:** 🚨 KRITIEK
**Rollback risico:** LAAG

#### Stap 1.1: Input Sanitization
**Doel:** Voorkom XSS attacks
**Tijd:** 2 uur
**Test:** XSS payload test suite

**Acties:**
1. Maak `utils/sanitize.js`:
```javascript
const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
        ALLOWED_ATTR: []
    });
};
```

2. Update API endpoints:
```javascript
app.post('/api/clausules', (req, res) => {
    const { clausule_id, titel, categorie, inhoud } = req.body;

    // NIEUW: Sanitize voor opslag
    const sanitizedTitel = sanitizeInput(titel);
    const sanitizedInhoud = sanitizeInput(inhoud);
    ...
});
```

3. Update admin interfaces - voeg sanitization toe aan submit handlers

**Test:**
```bash
curl -X POST http://localhost:8080/api/clausules \
  -H "Content-Type: application/json" \
  -d '{"clausule_id":"TEST","titel":"<script>alert(1)</script>","categorie":"test","inhoud":"test"}'
# Verwacht: titel is "alert(1)" (zonder <script> tags)
```

#### Stap 1.2: CORS Restrictie
**Doel:** Limiteer API toegang
**Tijd:** 30 min
**Test:** Cross-origin request test

**Acties:**
```javascript
// server.js
const cors = require('cors');

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:8080',
        'http://localhost:3001'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

**Test:**
```bash
# Van externe origin - moet falen
curl -H "Origin: https://evil.com" http://localhost:8080/api/flows
```

#### Stap 1.3: React Production Build
**Doel:** Performance + Security
**Tijd:** 1 uur
**Test:** Bundle size check

**Acties:**
```html
<!-- standalone_contract_generator_v3_flow.html -->
<!-- Vervang development builds met production -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
```

#### Stap 1.4: Environment Variables
**Doel:** Configuratie outside code
**Tijd:** 1 uur
**Test:** Multi-environment test

**Acties:**
1. Maak `.env.example`:
```bash
NODE_ENV=production
PORT=3001
DATABASE_PATH=./flows.db
ALLOWED_ORIGINS=http://localhost:8080
LOG_LEVEL=info
```

2. Update `server.js`:
```javascript
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DATABASE_PATH || './flows.db';
```

3. Update `.gitignore`:
```
.env
flows.db
node_modules/
```

**Deliverable na Fase 1:**
- ✅ XSS protectie actief
- ✅ CORS geconfigureerd
- ✅ Production builds
- ✅ Configuratie in env vars
- ✅ Database niet meer in git

**Rollback:** Git revert commits, restart server

---

### FASE 2: CODE ORGANIZATIE (Week 2-3)
**Prioriteit:** 🔴 HOOG
**Rollback risico:** MEDIUM

#### Stap 2.1: Backend Structuur
**Doel:** Scheiding van concerns
**Tijd:** 4 uur
**Test:** All API endpoints blijven werken

**Nieuwe structuur:**
```
backend/
├── server.js                 # Express setup only
├── config/
│   ├── database.js          # DB connection
│   └── cors.js              # CORS config
├── routes/
│   ├── flows.js             # Flow endpoints
│   ├── clausules.js         # Clausule endpoints
│   └── health.js            # Health check
├── controllers/
│   ├── flowController.js    # Business logic
│   └── clausuleController.js
├── models/
│   ├── Flow.js              # Data access layer
│   └── Clausule.js
└── middleware/
    ├── errorHandler.js
    ├── validator.js
    └── sanitizer.js
```

**Implementatie voorbeeld:**
```javascript
// backend/routes/flows.js
const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flowController');

router.get('/', flowController.getAllFlows);
router.get('/:flowId', flowController.getFlowById);
router.post('/:flowId', flowController.saveFlow);
router.delete('/:flowId', flowController.deleteFlow);

module.exports = router;

// backend/server.js (simplified)
const flowsRouter = require('./routes/flows');
app.use('/api/flows', flowsRouter);
```

**Test:**
```bash
# Run existing API tests
npm test  # (na test setup in stap 2.3)
```

#### Stap 2.2: Frontend Component Extractie
**Doel:** Van monolith naar modules
**Tijd:** 8 uur
**Test:** Visual regression test

**Nieuwe structuur:**
```
frontend/
├── public/
│   ├── index.html           # Minimaal HTML shell
│   └── assets/
│       └── images/
├── src/
│   ├── App.jsx              # Main app component
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── FlowEngine.jsx
│   │   ├── ParameterStep.jsx
│   │   ├── ClausuleStep.jsx
│   │   ├── ReviewStep.jsx
│   │   └── WordExporter.jsx
│   ├── hooks/
│   │   ├── useFlowEngine.js
│   │   └── useClausules.js
│   ├── utils/
│   │   ├── sanitize.js
│   │   └── wordGenerator.js
│   └── styles/
│       └── main.css
├── package.json
└── vite.config.js           # Build tool
```

**Implementatie stappen:**
1. Setup Vite: `npm create vite@latest frontend -- --template react`
2. Extract één component per keer (begin met Header)
3. Test na elke extractie
4. Houd oude HTML werkend tijdens migratie

**Test:**
- Visuele check: Screenshot comparison
- Functioneel: Volledige flow doorlopen
- Performance: Lighthouse score

#### Stap 2.3: Testing Framework
**Doel:** Automated testing
**Tijd:** 4 uur
**Test:** Coverage > 60%

**Setup:**
```json
// package.json
"devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "@testing-library/react": "^14.0.0"
}
```

**Test voorbeelden:**
```javascript
// backend/__tests__/flows.test.js
describe('Flow API', () => {
    test('GET /api/flows returns all flows', async () => {
        const res = await request(app).get('/api/flows');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

// frontend/src/__tests__/Header.test.jsx
describe('Header Component', () => {
    test('renders logo', () => {
        render(<Header />);
        expect(screen.getByAlt(/Ketenbureau/i)).toBeInTheDocument();
    });
});
```

**Deliverable na Fase 2:**
- ✅ Backend georganiseerd in layers
- ✅ Frontend component-based
- ✅ Test framework operational
- ✅ CI/CD ready codebase

**Rollback:** Branch checkout, volume remount oude HTML

---

### FASE 3: DATABASE NORMALISATIE (Week 3-4)
**Prioriteit:** 🟡 MEDIUM
**Rollback risico:** MEDIUM-HOOG

#### Stap 3.1: Database Schema Design
**Doel:** Proper normalization
**Tijd:** 2 uur
**Test:** Schema validation

**Nieuw schema:**
```sql
-- Flows table (normalized)
CREATE TABLE flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flow_id TEXT UNIQUE NOT NULL,
    naam TEXT NOT NULL,
    beschrijving TEXT,
    versie TEXT DEFAULT '1.0',
    auteur TEXT DEFAULT 'Systeem',
    actief BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow steps (extracted from JSON)
CREATE TABLE flow_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flow_id TEXT NOT NULL,
    stap_id TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'parameters', 'clausules', 'edit', 'review'
    titel TEXT,
    volgorde INTEGER,
    verplicht BOOLEAN DEFAULT 0,
    FOREIGN KEY (flow_id) REFERENCES flows(flow_id) ON DELETE CASCADE,
    UNIQUE(flow_id, stap_id)
);

-- Questions (extracted from parameters steps)
CREATE TABLE step_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    step_id INTEGER NOT NULL,
    vraag_id TEXT NOT NULL,
    titel TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'text', 'select', 'boolean', etc.
    verplicht BOOLEAN DEFAULT 0,
    groep TEXT,
    volgorde INTEGER,
    FOREIGN KEY (step_id) REFERENCES flow_steps(id) ON DELETE CASCADE
);

-- Question options
CREATE TABLE question_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    waarde TEXT NOT NULL,
    label TEXT NOT NULL,
    volgorde INTEGER,
    FOREIGN KEY (question_id) REFERENCES step_questions(id) ON DELETE CASCADE
);

-- Clausules (blijft grotendeels hetzelfde maar normalized)
CREATE TABLE clausules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clausule_id TEXT UNIQUE NOT NULL,
    titel TEXT NOT NULL,
    categorie TEXT NOT NULL,
    tekst TEXT,
    toelichting TEXT,
    artikelnummer TEXT,
    versie TEXT DEFAULT '1.0',
    auteur TEXT DEFAULT 'Systeem',
    actief BOOLEAN DEFAULT 1,
    verplicht BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexen voor performance
CREATE INDEX idx_flows_actief ON flows(actief);
CREATE INDEX idx_flow_steps_flow_id ON flow_steps(flow_id);
CREATE INDEX idx_clausules_categorie ON clausules(categorie);
CREATE INDEX idx_clausules_actief ON clausules(actief);
```

#### Stap 3.2: Migration Script
**Doel:** Data migreren zonder downtime
**Tijd:** 4 uur
**Test:** Data integrity checks

**Script: `migrations/001_normalize_schema.js`**
```javascript
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

async function migrate() {
    const oldDb = new sqlite3.Database('./flows.db');
    const newDb = new sqlite3.Database('./flows_new.db');

    // 1. Create new schema
    await newDb.exec(fs.readFileSync('./migrations/schema.sql', 'utf8'));

    // 2. Migrate flows
    const flows = await oldDb.all('SELECT * FROM flows');
    for (const flow of flows) {
        const flowData = JSON.parse(flow.flow_data);

        // Insert into new flows table
        await newDb.run(
            'INSERT INTO flows (flow_id, naam, beschrijving, ...) VALUES (?, ?, ?, ...)',
            [flowData.flow_id, flowData.naam, flowData.beschrijving, ...]
        );

        // Extract and insert steps
        for (const stap of flowData.stappen) {
            const stepId = await newDb.run(
                'INSERT INTO flow_steps (flow_id, stap_id, type, ...) VALUES (?, ?, ?, ...)',
                [flowData.flow_id, stap.stap_id, stap.type, ...]
            );

            // Extract and insert questions
            if (stap.vragen) {
                for (const vraag of stap.vragen) {
                    const questionId = await newDb.run(
                        'INSERT INTO step_questions (...) VALUES (...)',
                        [...]
                    );

                    // Insert options
                    if (vraag.opties) {
                        for (const optie of vraag.opties) {
                            await newDb.run('INSERT INTO question_options (...) VALUES (...)', [...]);
                        }
                    }
                }
            }
        }
    }

    // 3. Verify data integrity
    const oldFlowCount = await oldDb.get('SELECT COUNT(*) as count FROM flows');
    const newFlowCount = await newDb.get('SELECT COUNT(*) as count FROM flows');

    if (oldFlowCount.count !== newFlowCount.count) {
        throw new Error('Migration verification failed!');
    }

    console.log('Migration successful!');
}
```

**Uitvoeren:**
```bash
# 1. Backup
cp flows.db flows_backup_$(date +%Y%m%d).db

# 2. Run migration
node migrations/001_normalize_schema.js

# 3. Test new database
npm test

# 4. Swap databases (zero downtime)
mv flows.db flows_old.db
mv flows_new.db flows.db
docker-compose restart
```

**Deliverable na Fase 3:**
- ✅ Normalized database schema
- ✅ Data migrated successfully
- ✅ Queryable fields (niet meer JSON blobs)
- ✅ Foreign key constraints
- ✅ Proper indexing

**Rollback:**
```bash
mv flows.db flows_new.db
mv flows_old.db flows.db
docker-compose restart
```

---

### FASE 4: AUTHENTICATIE & AUTORISATIE (Week 4-5)
**Prioriteit:** 🚨 KRITIEK (maar na andere fixes)
**Rollback risico:** MEDIUM

#### Stap 4.1: Gebruikers Systeem
**Doel:** Beveiliging admin functies
**Tijd:** 6 uur
**Test:** Auth flow tests

**Schema:**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    naam TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',  -- 'admin', 'editor', 'viewer'
    actief BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,  -- UUID
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Implementatie:**
```javascript
// backend/middleware/auth.js
const bcrypt = require('bcrypt');
const uuid = require('uuid');

const requireAuth = async (req, res, next) => {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await db.get(
        'SELECT s.*, u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime("now")',
        [sessionId]
    );

    if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = session;
    next();
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};

module.exports = { requireAuth, requireRole };
```

**API routes update:**
```javascript
const { requireAuth, requireRole } = require('./middleware/auth');

// Publieke routes (read-only)
app.get('/api/flows', getAllFlows);
app.get('/api/clausules', getAllClausules);

// Beschermde routes
app.post('/api/flows/:flowId', requireAuth, requireRole('editor'), saveFlow);
app.delete('/api/flows/:flowId', requireAuth, requireRole('admin'), deleteFlow);
app.get('/api/admin/*', requireAuth, requireRole('admin'), ...);
```

#### Stap 4.2: Login Interface
**Doel:** User-friendly auth
**Tijd:** 4 uur
**Test:** Login flow E2E test

**Component:**
```jsx
// frontend/src/components/Login.jsx
import { useState } from 'react';

export function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) throw new Error('Login failed');

            const { sessionId, user } = await res.json();
            localStorage.setItem('sessionId', sessionId);
            onLogin(user);
        } catch (err) {
            setError('Ongeldige inloggegevens');
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wachtwoord"
                />
                {error && <div className="error">{error}</div>}
                <button type="submit">Inloggen</button>
            </form>
        </div>
    );
}
```

**Deliverable na Fase 4:**
- ✅ User authentication
- ✅ Role-based access control
- ✅ Session management
- ✅ Password hashing (bcrypt)
- ✅ Admin/Editor/Viewer roles

---

### FASE 5: PERFORMANCE & CACHING (Week 5-6)
**Prioriteit:** 🟡 MEDIUM
**Rollback risico:** LAAG

#### Stap 5.1: API Response Caching
**Doel:** Reduce DB load
**Tijd:** 2 uur
**Test:** Load test comparison

**Implementatie:**
```javascript
// backend/middleware/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minuten

const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        res.originalJson = res.json;
        res.json = (data) => {
            cache.set(key, data, duration);
            res.originalJson(data);
        };

        next();
    };
};

// Usage
app.get('/api/flows', cacheMiddleware(300), getAllFlows);
app.get('/api/clausules', cacheMiddleware(600), getAllClausules);
```

#### Stap 5.2: React Optimalisatie
**Doel:** Faster rendering
**Tijd:** 3 uur
**Test:** React DevTools Profiler

**Optimalisaties:**
```jsx
// 1. Memoization
const FlowStep = React.memo(({ step, onNext }) => {
    // Component only re-renders when step or onNext changes
    return <div>...</div>;
});

// 2. useMemo voor expensive calculations
function ClausuleList({ clausules, filters }) {
    const filteredClausules = useMemo(() => {
        return clausules.filter(c =>
            filters.category ? c.categorie === filters.category : true
        );
    }, [clausules, filters]);

    return <div>{filteredClausules.map(...)}</div>;
}

// 3. useCallback voor event handlers
function FlowEngine() {
    const handleNext = useCallback(() => {
        // Handler doesn't recreate on every render
    }, [dependencies]);

    return <Button onClick={handleNext}>Next</Button>;
}

// 4. Lazy loading
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));

function App() {
    return (
        <Suspense fallback={<Loading />}>
            <AdminPanel />
        </Suspense>
    );
}
```

#### Stap 5.3: Bundle Optimization
**Doel:** Smaller bundle size
**Tijd:** 2 uur
**Test:** Bundle analyzer

**Vite config:**
```javascript
// vite.config.js
export default {
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor': ['react', 'react-dom'],
                    'docx': ['docx', 'file-saver'],
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    }
};
```

**Deliverable na Fase 5:**
- ✅ API caching (5-10x faster)
- ✅ React optimization (2-3x faster renders)
- ✅ Smaller bundle size (~40% reduction)
- ✅ Lighthouse score > 90

---

### FASE 6: MONITORING & LOGGING (Week 6)
**Prioriteit:** 🟡 MEDIUM
**Rollback risico:** LAAG

#### Stap 6.1: Structured Logging
**Doel:** Debuggable production
**Tijd:** 2 uur
**Test:** Log parsing test

**Setup:**
```javascript
// backend/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

module.exports = logger;

// Usage
logger.info('Flow accessed', { flowId, userId, timestamp });
logger.error('Database error', { error: err.message, stack: err.stack });
```

#### Stap 6.2: Error Tracking
**Doel:** Know when things break
**Tijd:** 2 uur
**Test:** Error triggering test

**Setup:**
```javascript
// backend/middleware/errorHandler.js
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        user: req.user?.id
    });

    // Don't leak stack traces in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(err.statusCode || 500).json({
        error: err.message || 'Internal Server Error',
        ...(isDev && { stack: err.stack })
    });
};

module.exports = errorHandler;

// server.js
app.use(errorHandler); // Last middleware
```

**React Error Boundary:**
```jsx
// frontend/src/components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log to backend
        fetch('/api/errors', {
            method: 'POST',
            body: JSON.stringify({ error: error.toString(), errorInfo })
        });
    }

    render() {
        if (this.state.hasError) {
            return <ErrorPage error={this.state.error} />;
        }
        return this.props.children;
    }
}
```

#### Stap 6.3: Health Monitoring
**Doel:** Know when service is degraded
**Tijd:** 2 uur
**Test:** Health endpoint checks

**Enhanced health check:**
```javascript
// backend/routes/health.js
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {}
    };

    // Database check
    try {
        await db.get('SELECT 1');
        health.checks.database = 'OK';
    } catch (err) {
        health.checks.database = 'FAIL';
        health.status = 'DEGRADED';
    }

    // Disk space check
    const diskSpace = await checkDiskSpace('/');
    health.checks.disk = diskSpace.free > 1000000000 ? 'OK' : 'LOW';

    // Memory check
    const memUsage = process.memoryUsage();
    health.checks.memory = {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    };

    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
});
```

**Deliverable na Fase 6:**
- ✅ Structured logging
- ✅ Error tracking
- ✅ Health monitoring
- ✅ Production-ready observability

---

## 6. PRIORITEIT MATRIX

```
┌─────────────────────────────────────────────────────────┐
│                    URGENTIE vs IMPACT                   │
│                                                          │
│  Hoog │  Fase 1: Security    │  Fase 4: Auth          │
│       │  (Week 1-2)          │  (Week 4-5)            │
│       │  - Input sanitization│  - User system         │
│       │  - CORS              │  - RBAC                │
│       │  - Prod builds       │                        │
│       │                      │                        │
│  ─────┼──────────────────────┼────────────────────────┤
│       │  Fase 2: Code Org    │  Fase 6: Monitoring    │
│  Med  │  (Week 2-3)          │  (Week 6)              │
│       │  - Backend struct    │  - Logging             │
│       │  - Component split   │  - Error tracking      │
│       │  - Testing           │                        │
│       │                      │                        │
│  ─────┼──────────────────────┼────────────────────────┤
│       │  Fase 3: Database    │  Fase 5: Performance   │
│  Laag │  (Week 3-4)          │  (Week 5-6)            │
│       │  - Normalization     │  - Caching             │
│       │  - Migrations        │  - React optimization  │
│       │                      │  - Bundle size         │
└─────────────────────────────────────────────────────────┘
         Laag                  Impact                  Hoog
```

**Aanbevolen volgorde:**
1. **Fase 1** (Security) - KRITIEK, doe eerst
2. **Fase 4** (Auth) - KRITIEK, maar vereist Fase 1
3. **Fase 2** (Code Org) - Nodig voor maintainability
4. **Fase 3** (Database) - Optioneel maar waardevol
5. **Fase 5** (Performance) - Optimalisatie na stabiliteit
6. **Fase 6** (Monitoring) - Nice to have

---

## 7. RISICO ANALYSE

### 7.1 Risico's tijdens Implementatie

| Risico | Kans | Impact | Mitigatie |
|--------|------|--------|-----------|
| Data verlies tijdens migratie | Medium | Hoog | - Uitgebreide backups<br>- Test migratie op copy<br>- Rollback procedure |
| Downtime tijdens deployment | Laag | Medium | - Blue-green deployment<br>- Database migration offline<br>- Volume swaps |
| Breaking changes in frontend | Medium | Hoog | - Component-by-component migratie<br>- Keep old HTML parallel<br>- Feature flags |
| Auth lock-out | Laag | Hoog | - Admin bypass via env var<br>- Password reset flow<br>- Default admin account |
| Performance degradation | Laag | Medium | - Load testing na elke fase<br>- Rollback procedure<br>- Caching strategie |

### 7.2 Rollback Procedures

**Per Fase:**
```bash
# Fase 1-2 (Code changes)
git revert <commit-hash>
docker-compose restart

# Fase 3 (Database)
mv flows.db flows_new.db
mv flows_backup.db flows.db
docker-compose restart

# Fase 4 (Auth)
# Disable auth via env var
echo "DISABLE_AUTH=true" >> .env
docker-compose restart

# Fase 5-6 (Performance/Monitoring)
git revert <commit-hash>
docker-compose restart
```

---

## 8. SUCCESS METRICS

### 8.1 Security
- ✅ Alle OWASP Top 10 risico's gemitigeerd
- ✅ Zero XSS vulnerabilities in penetration test
- ✅ CORS configured voor alleen trusted origins
- ✅ All API endpoints protected met auth

### 8.2 Code Quality
- ✅ Test coverage > 70%
- ✅ Lighthouse score > 90
- ✅ Bundle size < 500KB (gzipped)
- ✅ Max component size < 200 lines

### 8.3 Performance
- ✅ API response tijd < 200ms (p95)
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Database query tijd < 50ms (p95)

### 8.4 Developer Experience
- ✅ Test suite runs < 30s
- ✅ Hot reload < 2s
- ✅ Build time < 60s
- ✅ Zero linting errors

---

## 9. ALTERNATIEVE ARCHITECTUUR

### 9.1 Microservices Approach (Toekomst)

Als de applicatie verder groeit:

```
┌───────────────────────────────────────────────┐
│  Frontend (React SPA)                         │
│  - Vercel / Netlify hosted                    │
└───────────────────────────────────────────────┘
                    ↓ HTTPS
┌───────────────────────────────────────────────┐
│  API Gateway (Kong / Nginx)                   │
│  - Rate limiting                              │
│  - Authentication                             │
│  - Request routing                            │
└───────────────────────────────────────────────┘
        ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Flow Service │ │ Clause       │ │ Export       │
│              │ │ Service      │ │ Service      │
│ - Node.js    │ │ - Node.js    │ │ - Python     │
│ - PostgreSQL │ │ - PostgreSQL │ │ - Celery     │
└──────────────┘ └──────────────┘ └──────────────┘
        ↓               ↓               ↓
┌───────────────────────────────────────────────┐
│  Message Queue (RabbitMQ / Redis)            │
└───────────────────────────────────────────────┘
```

**Wanneer overwegen:**
- \> 10,000 gebruikers
- Multiple teams werken aan systeem
- Verschillende scaling requirements per service
- Internationale deployment

### 9.2 Serverless Approach

**Voor low-traffic scenarios:**

```
Frontend (S3 + CloudFront)
    ↓
API Gateway
    ↓
Lambda Functions
    ↓
DynamoDB / Aurora Serverless
```

**Voordelen:**
- Zero operational overhead
- Pay-per-use
- Auto-scaling
- High availability

**Nadelen:**
- Vendor lock-in
- Cold start latency
- Debugging complexity

---

## 10. CONCLUSIE

### Huidige Status
De Contract Generator is een **werkend maar kwetsbaar** systeem met significante technische schuld. Het grootste risico is **security** - het systeem heeft geen authenticatie en beperkte input validation.

### Aanbeveling
**Start met Fase 1 (Security Hardening)** - dit is KRITIEK en kan binnen 1-2 dagen gerealiseerd worden. De andere fases kunnen gefaseerd worden ingepland afhankelijk van resource beschikbaarheid.

### Lange Termijn Visie
Met de voorgestelde verbeteringen wordt de applicatie:
- ✅ **Veilig** - Beschermd tegen common attacks
- ✅ **Maintainable** - Code is georganiseerd en getest
- ✅ **Scalable** - Kan groeien naar 1000+ users
- ✅ **Observable** - Monitoring en logging aanwezig

### Total Effort Estimate
- **Minimum (Security only):** 1-2 weken
- **Complete overhaul:** 6-8 weken
- **Met microservices:** 12-16 weken

---

**Document versie:** 1.0
**Laatste update:** 2025-11-07
**Review datum:** 2025-12-01
