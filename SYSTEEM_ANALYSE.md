# Systeem Analyse: Clausules en Flows

## 📊 Huidige Situatie

### Waar zitten de Clausules?

De clausules bevinden zich op **DRIE plaatsen**:

```
1. 📁 JSON Bestanden (Source of Truth)
   └── clausules/
       ├── algemeen.json              → CLAUSULE_DEFINITIES, CLAUSULE_TOEPASSELIJK_RECHT
       ├── financieel.json            → CLAUSULE_DECLARATIE, CLAUSULE_BETALING, CLAUSULE_INDEXERING
       ├── dienstverlening.json       → CLAUSULE_KWALITEIT, CLAUSULE_RAPPORTAGE
       ├── looptijd.json              → (clausules over looptijd)
       ├── privacy.json               → (privacy clausules)
       ├── leverancier.json           → (leverancier clausules)
       ├── onderhoud.json             → (onderhoud clausules)
       ├── privacy-uitgebreid.json    → (uitgebreide privacy)
       └── deel3-compleet.json        → CLAUSULE_3_1 t/m CLAUSULE_3_31 ✅

2. 💾 SQLite Database (Runtime Data)
   └── flows.db
       └── tabel: clausules
           ├── clausule_id
           ├── titel
           ├── categorie
           ├── inhoud (JSON string met alle details)
           └── ...

3. 🌐 Via Backend API (Access Layer)
   └── GET /api/clausules
       → Haalt data uit SQLite database
       → Frontend gebruikt deze API om clausules te laden
```

### Waar zitten de Flows?

De flows bevinden zich ook op **DRIE plaatsen**:

```
1. 📁 JSON Bestanden (Source of Truth)
   └── flows/
       ├── basis-flow.json            → Verwijst naar CLAUSULE_3_1 - CLAUSULE_3_31
       ├── privacy-flow.json          → Verwijst naar CLAUSULE_AVG, CLAUSULE_DPO, etc.
       └── financieel-flow.json       → Verwijst naar financiële clausules

2. 💾 SQLite Database (Runtime Data)
   └── flows.db
       └── tabel: flows
           ├── flow_id
           ├── naam
           ├── beschrijving
           ├── flow_data (JSON string met volledige flow definitie)
           └── ...

3. 🌐 Via Backend API (Access Layer)
   └── GET /api/flows
       → Haalt data uit SQLite database
       → Frontend gebruikt deze API om flows te laden
```

---

## 🔗 Hoe Verhouden Ze Zich Tot Elkaar?

### Flow → Clausule Koppeling

Een flow verwijst naar clausules via **IDs** in de `conditionele_clausules` array:

```json
{
  "flow_id": "basis-flow",
  "stappen": [
    {
      "stap_id": "deel3",
      "type": "clausules",
      "conditionele_clausules": [
        "CLAUSULE_3_1",
        "CLAUSULE_3_2",
        "CLAUSULE_3_31"
      ]
    }
  ]
}
```

### Data Flow Diagram

```
Start App
    ↓
Frontend laadt
    ↓
    ├─→ fetch('/api/flows')
    │       ↓
    │   Backend haalt flows uit SQLite
    │       ↓
    │   Frontend toont flow keuze
    │
    └─→ fetch('/api/clausules')
            ↓
        Backend haalt clausules uit SQLite
            ↓
        Frontend toont clausule selectie
            ↓
        Gebruiker beantwoordt vragen
            ↓
        Flow engine bepaalt welke clausules getoond worden
        (gebaseerd op conditionele_clausules + antwoorden)
            ↓
        Gebruiker selecteert/bewerkt clausules
            ↓
        Export naar Word document
```

---

## ⚠️ KRITIEKE PROBLEMEN

### 1. **Inconsistente Clausule IDs**

**Probleem:** Flows verwijzen naar clausule IDs die **niet bestaan** in de meeste JSON files!

**Voorbeeld:**
- `basis-flow.json` verwijst naar: `CLAUSULE_3_1, CLAUSULE_3_2, ..., CLAUSULE_3_31`
- `privacy-flow.json` verwijst naar: `CLAUSULE_AVG, CLAUSULE_DPO, CLAUSULE_DATA_PROCESSING`
- **MAAR:** De meeste clausule JSON files bevatten andere IDs zoals:
  - `CLAUSULE_DEFINITIES`, `CLAUSULE_TOEPASSELIJK_RECHT` (algemeen.json)
  - `CLAUSULE_DECLARATIE`, `CLAUSULE_BETALING` (financieel.json)

**Uitzondering:**
- ✅ `deel3-compleet.json` bevat WEL alle 31 clausules die `basis-flow.json` nodig heeft

**Impact:**
- Als `deel3-compleet.json` niet in de database staat, zal basis-flow **geen clausules tonen**
- privacy-flow en financieel-flow verwijzen naar **niet-bestaande clausules**

### 2. **Database Seeding Issues**

**Probleem:** Clausules worden **NIET automatisch** geladen in de database!

Zie `server.js:87`:
```javascript
// Seed flows only (clausules seeding disabled for now)
```

**Impact:**
- Na `docker-compose up` zijn alleen flows geladen, GEEN clausules
- Je moet handmatig de import API aanroepen: `POST /api/import/clausules`

### 3. **Dubbele Source of Truth**

**Probleem:** Data staat op twee plekken, kan uit sync raken

- JSON bestanden = de "echte" bron
- SQLite database = runtime kopie
- Als je JSON wijzigt, moet je handmatig re-importen

---

## 💡 AANBEVELINGEN

### Optie A: Database als Primaire Bron (AANBEVOLEN)

**Voordelen:**
- ✅ Beheer via admin interface werkt direct
- ✅ Geen sync issues
- ✅ Eenvoudiger deployment

**Wijzigingen:**
1. Schakel clausule seeding in (server.js)
2. Gebruik JSON files alleen als initiële data
3. Maak admin interface leidend voor aanpassingen
4. Export functie: database → JSON (voor backup)

**Implementatie:**
```javascript
// In server.js:87, vervang door:
seedInitialData(); // Voor BOTH flows en clausules
```

### Optie B: JSON als Primaire Bron

**Voordelen:**
- ✅ Versie controle via Git
- ✅ Easy backup
- ✅ Clear audit trail

**Nadelen:**
- ❌ Admin interface wijzigingen gaan verloren bij herstart
- ❌ Moet altijd re-importen na JSON wijziging

**Implementatie:**
1. Database = cache, niet persistente data
2. Altijd laden vanuit JSON bij start
3. Admin interface schrijft terug naar JSON files

### Optie C: Hybride (MIJN AANBEVELING)

**Best of both worlds:**

```
┌─────────────────────────────────┐
│   clausules/ (Git versioned)    │
│   └── Definitieve clausules     │
└──────────────┬──────────────────┘
               │ Initial Seed
               ↓
┌─────────────────────────────────┐
│   SQLite Database                │
│   └── Runtime + Experimenten     │
└──────────────┬──────────────────┘
               │ Admin Changes
               ↓
┌─────────────────────────────────┐
│   beheer/ Admin Interface        │
│   - Test nieuwe clausules        │
│   - Pas bestaande aan            │
│   - Export → JSON (publish)      │
└─────────────────────────────────┘
```

**Workflow:**
1. **Productie clausules** → `clausules/*.json` (Git versioned)
2. **Database** → Productie data + werk-in-uitvoering
3. **Admin interface** → Wijzig database
4. **Export knop** → Schrijf terug naar JSON als finaal
5. **Commit** → JSON changes naar Git

---

## 🔧 Directe Acties Nodig

### 1. Fix de Inconsistente IDs (URGENT)

**Keuze maken:**

**Optie 1:** Hernoem alle clausule bestanden naar thematische namen
```
clausules/
  ├── deel1-bepalingen.json      → Clausules voor Deel 1
  ├── deel2-individueel.json     → Clausules voor Deel 2
  └── deel3-generiek.json        → CLAUSULE_3_1 t/m CLAUSULE_3_31
```

**Optie 2:** Update flow references om bestaande IDs te gebruiken
```json
// privacy-flow verwijst naar:
"conditionele_clausules": [
  "CLAUSULE_DEFINITIES",      // uit algemeen.json
  "CLAUSULE_TOEPASSELIJK_RECHT"  // uit algemeen.json
]
```

### 2. Enable Clausule Seeding

**Wijzig `server.js` regel 87-126** om ook clausules te seeden:

```javascript
function seedInitialData() {
    console.log('Starting seeding process...');

    setTimeout(() => {
        const fs = require('fs');

        // Seed FLOWS
        const flowsDir = path.join(__dirname, 'flows');
        // ... bestaande flow code ...

        // Seed CLAUSULES
        const clausulesDir = path.join(__dirname, 'clausules');
        if (fs.existsSync(clausulesDir)) {
            const files = fs.readdirSync(clausulesDir).filter(file => file.endsWith('.json'));

            files.forEach(file => {
                const clausulesData = JSON.parse(fs.readFileSync(path.join(clausulesDir, file), 'utf8'));

                Object.keys(clausulesData).forEach(clausuleId => {
                    const clausule = clausulesData[clausuleId];

                    db.get('SELECT id FROM clausules WHERE clausule_id = ?', [clausuleId], (err, row) => {
                        if (!row) {
                            db.run(
                                'INSERT INTO clausules (clausule_id, titel, categorie, inhoud, versie, auteur) VALUES (?, ?, ?, ?, ?, ?)',
                                [
                                    clausuleId,
                                    clausule.titel,
                                    clausule.categorie,
                                    JSON.stringify(clausule),
                                    clausule.versie || '1.0',
                                    clausule.auteur || 'Systeem'
                                ],
                                (err) => {
                                    if (!err) console.log(`Seeded clausule: ${clausule.titel}`);
                                }
                            );
                        }
                    });
                });
            });
        }

        console.log('Seeding process completed');
    }, 1000);
}
```

### 3. Maak ID Mapping Duidelijk

**Creëer een overzichtsbestand:**

```json
// clausules/README.json
{
  "description": "Clausule ID mapping en organisatie",
  "mapping": {
    "Deel 1 - Bepalingen": {
      "source_file": "deel1-bepalingen.json",
      "clausule_ids": ["CLAUSULE_1_1", "CLAUSULE_1_2"]
    },
    "Deel 3 - Generieke bepalingen": {
      "source_file": "deel3-compleet.json",
      "clausule_ids": ["CLAUSULE_3_1", "...", "CLAUSULE_3_31"],
      "used_by_flows": ["basis-flow"]
    },
    "Algemene clausules": {
      "source_file": "algemeen.json",
      "clausule_ids": ["CLAUSULE_DEFINITIES", "CLAUSULE_TOEPASSELIJK_RECHT"],
      "used_by_flows": ["privacy-flow", "financieel-flow"]
    }
  }
}
```

---

## 📋 Actieplan Stappenplan

1. **Vandaag (Critical):**
   - [ ] Beslis: Database of JSON als primair?
   - [ ] Fix clausule seeding in server.js
   - [ ] Test dat basis-flow werkt met deel3-compleet.json

2. **Deze week:**
   - [ ] Maak ID mapping consistent
   - [ ] Update CLAUDE.md met beslissingen
   - [ ] Test alle flows end-to-end

3. **Later:**
   - [ ] Implementeer export-naar-JSON functie in admin
   - [ ] Voeg validatie toe (flow verwijst naar bestaande clausules)
   - [ ] Documenteer de gekozen architectuur

---

## 🎯 Mijn Aanbeveling

Ik raad aan om te kiezen voor **Optie C (Hybride)**:

1. **JSON files** blijven de bron voor productie clausules
2. **Database** wordt automatisch geladen bij startup (enable seeding)
3. **Admin interface** schrijft naar database
4. **Export functie** om database clausules terug te schrijven naar JSON
5. **Git** voor versiebeheer van JSON files

Dit geeft je:
- ✅ Flexibiliteit om te experimenteren in admin
- ✅ Versiebeheer via Git
- ✅ Clear separation tussen stable (JSON) en experimental (DB)
- ✅ Easy rollback via Git

**Eerste stap:** Enable clausule seeding zoals hierboven beschreven, zodat je systeem überhaupt werkt!
