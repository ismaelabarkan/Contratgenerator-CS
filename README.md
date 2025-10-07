# Contract Generator v3 - Flow Engine

Een moderne, modulaire contract generator met flow functionaliteit voor het genereren van professionele contracten.

## 🚀 Features

- **Flow Engine**: Stap-voor-stap contract generatie met conditionele routes
- **Modulaire Clausules**: Uitbreidbare clausule bibliotheek in JSON formaat
- **Word Export**: Browser-compatibele Word document export (.doc bestanden)
- **Admin Interface**: Flow beheer en configuratie
- **Docker Support**: Lokale testing en deployment

## 📁 Project Structuur

```
ContractGenerator/
├── standalone_contract_generator_v2.html    # Backup versie (v2)
├── standalone_contract_generator_v3_flow.html # Huidige werkende versie (v3)
├── clausules/                               # Clausule bibliotheek
│   ├── algemeen.json
│   ├── financieel.json
│   ├── looptijd.json
│   ├── privacy.json
│   └── ...
├── flows/                                   # Flow configuraties
│   └── basis-flow.json
├── beheer/                                  # Admin interface
│   └── flow-beheer.html
├── Dockerfile                              # Docker configuratie
├── docker-compose.yml                      # Docker Compose setup
└── test-lokaal.sh                         # Lokale test script
```

## 🛠️ Lokale Development

### Docker (Aanbevolen)

```bash
# Start de applicatie
./test-lokaal.sh

# Of handmatig:
docker-compose up -d --build
```

De applicatie is dan beschikbaar op: http://localhost:8080

### Handmatig

Open `standalone_contract_generator_v3_flow.html` in een moderne browser.

## 📋 Gebruik

1. **Flow doorlopen**: Beantwoord vragen in de flow stappen
2. **Clausules selecteren**: Kies relevante clausules voor je contract
3. **Bewerken**: Pas clausule teksten aan indien nodig
4. **Export**: Download als Word document of kopieer naar klembord

## 🔧 Admin Interface

Ga naar `/beheer/flow-beheer.html` voor:
- Flow configuratie bewerken
- Nieuwe flows toevoegen
- Clausule beheer

## 📄 Versies

- **v2**: Backup versie met basis functionaliteit
- **v3**: Huidige versie met flow engine en Word export

## 🐳 Docker

De applicatie draait in een Nginx container met:
- Static file serving
- CORS support
- JSON MIME type handling
- Gzip compression

## 📝 Technologieën

- **Frontend**: React 18, Tailwind CSS
- **Export**: Browser-compatibele Word document generatie
- **Container**: Docker, Nginx
- **Data**: JSON configuratie bestanden

## 🔒 Security

- DOMPurify voor input sanitization
- CORS headers voor veilige cross-origin requests
- Input validatie en error handling

---

**Versie**: 3.0  
**Laatste update**: Oktober 2025
