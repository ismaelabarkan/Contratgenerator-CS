# Info Button Feature - Documentatie

## Overzicht

Met deze feature kun je per vraag in een flow bepalen of een info-knop (ℹ️) getoond moet worden. Gebruikers kunnen dan op deze knop klikken om extra toelichting te zien.

## Gebruik in Flow JSON

### Basis structuur

Voeg het `info_button` veld toe aan elke vraag in je flow:

```json
{
  "vraag_id": "mijn_vraag",
  "titel": "Wat is uw naam?",
  "type": "text",
  "verplicht": true,
  "info_button": true,
  "toelichting": "Voer hier de volledige naam in"
}
```

### Opties

- **`"info_button": true`** - Toont de ℹ️ knop. Gebruikers kunnen klikken voor toelichting
- **`"info_button": false`** - Verbergt de info-knop (standaard)
- **`"info_button"` weggelaten** - Wordt behandeld als `false` (geen knop)

### Toelichting tekst

De tekst die getoond wordt onder de info-knop komt uit het `toelichting` veld:

```json
{
  "vraag_id": "exemplo",
  "titel": "Vraag",
  "type": "text",
  "info_button": true,
  "toelichting": "Dit is de uitleg die getoond wordt als de gebruiker op de info-knop klikt"
}
```

**Belangrijk**: Voeg altijd een `toelichting` veld toe als je `info_button: true` zet!

## Voorbeelden

### Voorbeeld 1: Eenvoudige tekstvraag met info

```json
{
  "vraag_id": "opdrachtgever_naam",
  "titel": "Naam gemeente / regio (Opdrachtgever)",
  "type": "text",
  "verplicht": false,
  "info_button": true,
  "toelichting": "Dit moet de officiële naam van de gemeente zijn, zoals geregistreerd in het gemeentebestuur"
}
```

### Voorbeeld 2: Select-vraag met info (wie koopt in)

```json
{
  "vraag_id": "inkoopmethode",
  "titel": "Hoe koopt Opdrachtgever de jeugdhulp in?",
  "type": "select",
  "verplicht": true,
  "info_button": true,
  "toelichting": "Bij aanbesteding vindt een openbare procedure plaats. Bij toelating kunnen alleen erkende aanbieders deelnemen.",
  "opties": [
    {
      "waarde": "aanbestedingsprocedure",
      "label": "Via een aanbestedingsprocedure"
    },
    {
      "waarde": "toelatingsprocedure",
      "label": "Via een toelatingsprocedure"
    }
  ]
}
```

### Voorbeeld 3: Boolean vraag zonder info

```json
{
  "vraag_id": "bibob",
  "titel": "BIBOB?",
  "type": "boolean",
  "verplicht": true,
  "info_button": false
}
```

## In de praktijk

### Huidige flow status

De `basis-flow.json` heeft momenteel 2 vragen met info-knop:
1. `inkoopmethode` - Uitleg over aanbesteding vs toelating
2. `uitvoeringsvariant` - Uitleg over de drie uitvoeringsvarianten

Je kunt deze gebruiken als template.

### Info-knop toevoegen

1. Open het flow JSON bestand (bijv. `flows/basis-flow.json`)
2. Zoek de vraag waaraan je een info-knop wilt toevoegen
3. Voeg deze velden toe:
   - `"info_button": true`
   - `"toelichting": "Jouw uitlegtext hier"`

### Info-knop verwijderen

1. Zet `"info_button"` op `false` of verwijder het veld helemaal
2. Je kunt het `toelichting` veld eventueel behouden voor latere gebruik

## Frontend implementatie

De frontend (`standalone_contract_generator_v3_flow.html`) controleert automatisch:

```javascript
{vraag.info_button !== false && (
  <button onClick={() => toggleInfo(`QUESTION_${vraag.vraag_id}`)}>
    ℹ️
  </button>
)}
```

Dit betekent:
- Als `info_button: true` → knop wordt getoond ✅
- Als `info_button: false` → knop wordt niet getoond ❌
- Als `info_button` niet aanwezig → knop wordt niet getoond ❌

## Best practices

### Wanneer info-knop gebruiken?

✅ **Wel gebruiken voor:**
- Complexe vragen die uitleg nodig hebben
- Juridische termen die uitleg behoeven
- Vragen waar gebruikers veel fouten maken
- Keuzevragen met moeilijk uit elkaar te houden opties

❌ **NIET gebruiken voor:**
- Eenvoudige vragen zoals naam, adres
- Vragen die zelf al duidelijk zijn
- Verplichte vragen die gebruikers toch moeten invullen

### Tips voor toelichting tekst

1. **Kort en duidelijk**: Maximaal 2-3 zinnen
2. **Gebruikersvriendelijk**: Vermijd juridische jargon als mogelijk
3. **Actionabel**: Help gebruiker het juiste antwoord te kiezen
4. **Nederlands**: Schrijf in begrijpelijk Nederlands

### Voorbeeld goede toelichting

```json
"toelichting": "Bij aanbesteding krijgen alle belangstelling aanbieders de kans mee te doen. Toelating betekent dat alleen geselecteerde aanbieders kunnen participeren."
```

### Voorbeeld slechte toelichting

```json
"toelichting": "Kies iets"
```

## Alle flow bestanden

Het `info_button` veld is automatisch toegevoegd aan:
- `flows/basis-flow.json` - Standaard jeugdhulp overeenkomst
- `flows/financieel-flow.json` - Financiële contracten
- `flows/privacy-flow.json` - Privacy gerichte flows

Al deze bestanden hebben het veld initieel op `false` voor alle vragen, behalve de voorbeelden in `basis-flow.json`.

## Updates

Zodra je wijzigingen in de JSON bestanden aanmaakt:

### Via Docker
```bash
# De wijzigingen worden automatisch geladen
docker-compose up
```

### Handmatig
1. Wijzig het JSON bestand
2. Herlaad de browser pagina (F5)
3. Controleer dat de info-knop wel of niet getoond wordt

## Troubleshooting

### Info-knop wordt niet getoond

- Controleer dat `info_button: true` ingesteld is
- Controleer dat je het JSON bestand opgeslagen hebt
- Controleer dat je browser ge-cached versie niet gebruikt (Ctrl+Shift+R)

### Toelichting wordt niet getoond

- Controleer dat je een `toelichting` veld hebt toegevoegd
- Controleer dat de tekst niet leeg is

### JSON is ongeldig

Gebruik een JSON validator:
```bash
node -e "JSON.parse(require('fs').readFileSync('flows/basis-flow.json'))" && echo "OK"
```

## Support

Voor vragen over deze feature, zie `CLAUDE.md` in dit project of raadpleeg de frontend code in `standalone_contract_generator_v3_flow.html`.

