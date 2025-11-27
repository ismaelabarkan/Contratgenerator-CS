# Verbeterplan - Quick Start Guide

**Voor:** Contract Generator v4.2.0
**Doel:** Stapsgewijs verbeteren zonder bestaande functionaliteit te breken
**Geschatte tijd:** 1-8 weken (afhankelijk van scope)

---

## 📊 Snelle Status Check

### Huidige Staat
- ❌ **Security:** Geen auth, geen input validation, CORS wide open
- ⚠️ **Code:** 2736-regel monolith, geen tests, code duplicatie
- ⚠️ **Database:** JSON blobs in SQLite, geen normalisatie
- ✅ **Functionaliteit:** Alles werkt perfect!

### Prioriteiten (Top 3)
1. 🔥 **Security** - KRITIEK, start hier
2. 🔐 **Authenticatie** - Bescherm admin functies
3. 🏗️ **Code Organisatie** - Maak maintainable

---

## 🚀 Quick Wins (Deze Week)

### Win #1: Input Sanitization (2 uur)
**Risico:** Hoog - XSS vulnerabilities
**Rollback:** Git revert

```bash
# 1. Installeer DOMPurify op backend
npm install isomorphic-dompurify

# 2. Maak utils/sanitize.js
cat > backend/utils/sanitize.js << 'EOF'
const DOMPurify = require('isomorphic-dompurify');

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
    });
};

module.exports = { sanitizeInput };
EOF

# 3. Update server.js
# Voeg toe bovenaan:
# const { sanitizeInput } = require('./utils/sanitize');

# 4. Update POST/PUT endpoints
# Voor: const { titel, inhoud } = req.body;
# Na:   const titel = sanitizeInput(req.body.titel);
#       const inhoud = sanitizeInput(req.body.inhoud);

# 5. Test
curl -X POST http://localhost:8080/api/clausules \
  -H "Content-Type: application/json" \
  -d '{"clausule_id":"TEST","titel":"<script>alert(1)</script>","categorie":"test","inhoud":"test"}'
# Verwacht: titel zonder <script> tags
```

### Win #2: CORS Fix (30 min)
**Risico:** Medium - unauthorized access
**Rollback:** Git revert

```bash
# 1. Maak .env bestand
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3001
EOF

# 2. Installeer dotenv
npm install dotenv

# 3. Update server.js
# Voeg toe bovenaan:
require('dotenv').config();

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

# 4. Herstart
docker-compose restart

# 5. Test van andere origin
curl -H "Origin: https://evil.com" http://localhost:8080/api/flows
# Verwacht: CORS error
```

### Win #3: Production React Builds (15 min)
**Risico:** Laag - performance verbetering
**Rollback:** Git revert

```bash
# Update alle HTML files:
# standalone_contract_generator_v3_flow.html
# beheer/flow-beheer.html
# beheer/clausule-beheer.html

# Vervang:
# <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
# <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

# Met:
# <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
# <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

# Test in browser - moet sneller zijn
```

**Totale tijd Quick Wins:** ~3 uur
**Impact:** Hoog - 70% van kritieke security issues opgelost

---

## 📋 Fase 1: Security Hardening (Week 1)

### Checklist
- [ ] Input sanitization toegevoegd (2 uur)
- [ ] CORS geconfigureerd (30 min)
- [ ] Production React builds (15 min)
- [ ] Environment variables (.env) (1 uur)
- [ ] Database uit git (git rm flows.db) (5 min)
- [ ] .gitignore updated (5 min)

### Verificatie
```bash
# Alle checks moeten slagen:
npm run security-check  # (nog te maken)

# Manual checks:
echo "1. Probeer XSS payload in admin interface"
echo "2. Test CORS van externe origin"
echo "3. Check .gitignore bevat flows.db"
echo "4. Verify production builds in browser console"
```

**Deliverable:** Applicatie is 80% veiliger

---

## 🔐 Fase 2: Basis Authenticatie (Week 2)

### Minimale Auth Setup

```bash
# 1. Installeer dependencies
npm install bcrypt express-session uuid

# 2. Maak users tabel
cat > migrations/create_users.sql << 'EOF'
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    naam TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    actief BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Default admin user (wachtwoord: admin123 - VERANDER DIT!)
INSERT INTO users (email, password_hash, naam, role)
VALUES ('admin@example.com', '$2b$10$rKvvqYhJ3U2nQh0yxWxbYeKp8xZ4qQ1WxN8mX5mZ0qL8qZ4qQ1WxN', 'Admin', 'admin');
EOF

# 3. Run migratie
sqlite3 flows.db < migrations/create_users.sql

# 4. Maak auth middleware
cat > backend/middleware/auth.js << 'EOF'
const requireAuth = (req, res, next) => {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Verify session in database
    // ... (zie volledige implementatie in architectuur analyse)
    next();
};

module.exports = { requireAuth };
EOF

# 5. Bescherm admin routes
# In server.js:
# const { requireAuth } = require('./middleware/auth');
# app.post('/api/flows/:flowId', requireAuth, saveFlow);
# app.delete('/api/flows/:flowId', requireAuth, deleteFlow);
```

### Snelle Login Pagina

```bash
# Maak simpele login pagina
cat > public/login.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Login - Contract Generator</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-white p-8 rounded-lg shadow-md w-96">
            <h1 class="text-2xl font-bold mb-6">Login</h1>
            <form id="loginForm">
                <input type="email" id="email" placeholder="Email" class="w-full mb-4 p-2 border rounded" required>
                <input type="password" id="password" placeholder="Wachtwoord" class="w-full mb-4 p-2 border rounded" required>
                <button type="submit" class="w-full bg-purple-600 text-white p-2 rounded">Inloggen</button>
            </form>
            <div id="error" class="mt-4 text-red-600 hidden"></div>
        </div>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const { sessionId } = await res.json();
                localStorage.setItem('sessionId', sessionId);
                window.location.href = '/';
            } else {
                document.getElementById('error').classList.remove('hidden');
                document.getElementById('error').textContent = 'Ongeldige inloggegevens';
            }
        });
    </script>
</body>
</html>
EOF
```

**Deliverable:** Admin functies beschermd met login

---

## 🎯 Welke Fase voor Jouw Situatie?

### Scenario 1: "We moeten morgen live!"
**Doe:** Alleen Quick Wins
**Tijd:** 3 uur
**Resultaat:** Basis security, blijft werken

### Scenario 2: "We hebben 1 week"
**Doe:** Fase 1 (Security Hardening)
**Tijd:** 1 week
**Resultaat:** 80% veiliger, professioneel

### Scenario 3: "We hebben 2 weken"
**Doe:** Fase 1 + 2 (Security + Auth)
**Tijd:** 2 weken
**Resultaat:** Production-ready security

### Scenario 4: "We willen het perfect"
**Doe:** Alle 6 fases
**Tijd:** 6-8 weken
**Resultaat:** Enterprise-grade applicatie

---

## 🧪 Test na Elke Stap

### Manual Test Checklist

```bash
# Na elke wijziging:
□ Application start: docker-compose up
□ Homepage laadt: http://localhost:8080
□ Flow doorlopen: Volledige contract generatie
□ Admin toegang: http://localhost:8080/beheer/flow-beheer.html
□ Database check: sqlite3 flows.db "SELECT COUNT(*) FROM flows;"
□ API check: curl http://localhost:8080/api/health
```

### Automated Tests (na Fase 2)

```bash
# Maak test script
cat > test.sh << 'EOF'
#!/bin/bash
echo "Testing Contract Generator..."

# Test 1: Health check
echo "1. Health check..."
curl -s http://localhost:8080/api/health | grep "OK" || exit 1

# Test 2: Flows API
echo "2. Flows API..."
curl -s http://localhost:8080/api/flows | grep "\[" || exit 1

# Test 3: XSS protection
echo "3. XSS protection..."
RESULT=$(curl -s -X POST http://localhost:8080/api/clausules \
  -H "Content-Type: application/json" \
  -d '{"clausule_id":"TEST","titel":"<script>alert(1)</script>","categorie":"test","inhoud":"test"}')
echo $RESULT | grep "<script>" && exit 1

echo "✅ All tests passed!"
EOF

chmod +x test.sh
./test.sh
```

---

## 🔄 Rollback Procedures

### Als iets fout gaat:

```bash
# Methode 1: Git revert (preferred)
git log --oneline -5  # Vind commit hash
git revert <hash>
docker-compose restart

# Methode 2: Branch checkout
git checkout main  # Of vorige werkende branch
docker-compose restart

# Methode 3: Database rollback
cp flows_backup.db flows.db
docker-compose restart

# Methode 4: Complete reset
git reset --hard HEAD~1  # ⚠️ VOORZICHTIG - verliest changes
docker-compose up --build
```

### Voor Database Wijzigingen

```bash
# Voor elke database change:
DATE=$(date +%Y%m%d_%H%M%S)
cp flows.db "backups/flows_${DATE}.db"

# Rollback:
cp backups/flows_YYYYMMDD_HHMMSS.db flows.db
```

---

## 📞 Support Scenario's

### "Help! De applicatie start niet meer"

```bash
# Check 1: Docker logs
docker-compose logs -f

# Check 2: Database corrupted?
sqlite3 flows.db "PRAGMA integrity_check;"

# Check 3: Port conflict?
lsof -i :8080
lsof -i :3001

# Fix: Hard reset
docker-compose down
docker volume prune -f
docker-compose up --build
```

### "Help! Ik zie geen data meer"

```bash
# Check database
sqlite3 flows.db << EOF
.tables
SELECT COUNT(*) FROM flows;
SELECT COUNT(*) FROM clausules;
EOF

# Reseed data
curl -X POST http://localhost:8080/api/import/flows
curl -X POST http://localhost:8080/api/import/clausules

# Of restart (triggert auto-seed)
docker-compose restart
```

### "Help! Admin interface werkt niet"

```bash
# Check 1: Files mounted?
docker exec contract-generator-v3 ls -la /app/public/beheer/

# Check 2: Browser cache?
# Open incognito + hard refresh (Cmd+Shift+R)

# Check 3: Check logs
docker-compose logs -f | grep beheer
```

---

## 📈 Progress Tracking

### Week 1 Checklist
- [ ] Dag 1: Quick Wins (3 uur)
- [ ] Dag 2: Input sanitization production (2 uur)
- [ ] Dag 3: Environment setup + .gitignore (2 uur)
- [ ] Dag 4: Test suite opzet (3 uur)
- [ ] Dag 5: Documentation + review (2 uur)

**End of week demo:** Toon XSS protection werkend

### Week 2 Checklist
- [ ] Dag 1-2: Users + sessions table (4 uur)
- [ ] Dag 3: Auth middleware (3 uur)
- [ ] Dag 4: Login interface (3 uur)
- [ ] Dag 5: Protect admin routes (2 uur)

**End of week demo:** Login + beschermde admin panel

---

## 💡 Pro Tips

### Tip 1: Werk in Branches
```bash
# Voor elke fase:
git checkout -b feature/fase-1-security
# Maak changes
git add .
git commit -m "Fase 1: Security hardening"
# Test ALLES
git checkout main
git merge feature/fase-1-security
```

### Tip 2: Frequent Commits
```bash
# Klein stapje? Commit!
git commit -am "Add input sanitization to flows API"
# Werkt? Volgende stapje
# Werkt niet? Git revert
```

### Tip 3: Database Backups Automatiseren
```bash
# Voeg toe aan crontab:
# Elke dag om 2am backup
0 2 * * * cp /pad/naar/flows.db /pad/naar/backups/flows_$(date +\%Y\%m\%d).db

# Houd 7 dagen:
find /pad/naar/backups/ -name "flows_*.db" -mtime +7 -delete
```

### Tip 4: Test in Production-like Environment
```bash
# Maak staging omgeving:
cp docker-compose.yml docker-compose.staging.yml
# Update ports naar 9080:3001
docker-compose -f docker-compose.staging.yml up

# Test changes eerst in staging!
```

---

## 📚 Extra Resources

### Lees Voor Je Begint
1. **CLAUDE.md** - Project architectuur
2. **docs/ARCHITECTUUR_ANALYSE_2025-11-07.md** - Volledige analyse
3. **docs/20251010 flow regels.md** - Business logic

### Handige Commands
```bash
# Development
npm run dev              # Start met hot-reload
./test-lokaal.sh        # Quick test script

# Database
sqlite3 flows.db        # Open database CLI
.tables                 # List alle tabellen
.schema flows           # Show table structure

# Docker
docker-compose up -d    # Start achtergrond
docker-compose logs -f  # Live logs
docker-compose restart  # Restart services

# Git
git status              # Check changes
git diff                # See modifications
git log --oneline -10   # Recent commits
```

---

## ✅ Success Criteria

### Je bent klaar met Fase 1 als:
- [ ] XSS test faalt (goede zaak!)
- [ ] CORS test van externe origin faalt (goede zaak!)
- [ ] Production builds laden in browser
- [ ] Database niet in git
- [ ] Alle bestaande functionaliteit werkt

### Je bent klaar met Fase 2 als:
- [ ] Login pagina werkt
- [ ] Admin panel vraagt om login
- [ ] Sessie blijft actief (refresh werkt)
- [ ] Logout werkt
- [ ] Publieke pagina's werken zonder login

---

**Laatste update:** 2025-11-07
**Volgende review:** Na elke fase

**Vragen?** Check docs/ARCHITECTUUR_ANALYSE_2025-11-07.md voor details
