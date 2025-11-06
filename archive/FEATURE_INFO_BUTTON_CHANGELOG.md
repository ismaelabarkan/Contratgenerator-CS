# Feature: Info Button per Vraag - Changelog

## Versie 1.0 - Implementatie voltooid

### Wat is er gedaan?

Geïmplementeerd: Per vraag in een flow kan je nu bepalen of een info-knop (ℹ️) zichtbaar is.

### Wijzigingen

#### 1. Flow Bestanden - `flows/` directory

**flows/basis-flow.json**
- Alle vragen hebben nu het `info_button` veld (standaard: `false`)
- 2 voorbeelden ingesteld op `true`:
  1. `inkoopmethode` - Uitleg aanbesteding vs toelating
  2. `uitvoeringsvariant` - Uitleg 3 uitvoeringsvarianten

**flows/financieel-flow.json**
- Alle vragen hebben het `info_button` veld (standaard: `false`)

**flows/privacy-flow.json**
- Alle vragen hebben het `info_button` veld (standaard: `false`)

#### 2. Frontend - `standalone_contract_generator_v3_flow.html`

**Wijzigingen op lijn 836-854**
- Info-knop render: Nu voorwaardelijk op basis van `vraag.info_button !== false`
- Toelichting render: Nu voorwaardelijk op basis van `vraag.info_button !== false`

**Logica**
```javascript
// Knop wordt alleen getoond als info_button !== false
{vraag.info_button !== false && (
  <button onClick={() => toggleInfo(`QUESTION_${vraag.vraag_id}`)}>
    ℹ️
  </button>
)}

// Toelichting wordt alleen getoond als info_button !== false EN showInfo true
{vraag.info_button !== false && showInfo[`QUESTION_${vraag.vraag_id}`] && (
  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
    <p className="text-sm text-blue-800">
      <strong>Toelichting:</strong> {vraag.toelichting}
    </p>
  </div>
)}
```

#### 3. Documentatie

**CLAUDE.md**
- Nieuwe sectie "Info Button Feature" toegevoegd
- Richtlijnen voor gebruikers

**INFO_BUTTON_FEATURE.md** (NIEUW)
- Uitgebreide gids voor het gebruiken van info-knoppen
- Voorbeelden en best practices
- Troubleshooting

**INFO_BUTTON_SUMMARY.txt** (NIEUW)
- Korte samenvatting van implementatie

**FEATURE_INFO_BUTTON_CHANGELOG.md** (NIEUW)
- Dit document

### Gebruikersgebruik

#### Info-knop toevoegen aan een vraag:

```json
{
  "vraag_id": "mijn_vraag",
  "titel": "Vraagstelling",
  "type": "text",
  "verplicht": true,
  "info_button": true,
  "toelichting": "Dit is de uitleg die getoond wordt"
}
```

#### Info-knop verbergen (standaard):

```json
{
  "vraag_id": "mijn_vraag",
  "titel": "Vraagstelling",
  "type": "text",
  "info_button": false
}
```

### Features

- ✅ Per vraag configureerbaar
- ✅ Eenvoudige aan/uit
- ✅ Backward compatible
- ✅ DOMPurify sanitizes toelichting tekst
- ✅ Accessible (ARIA labels)
- ✅ Responsive design

### Testresultaten

- ✅ Alle JSON bestanden valide
- ✅ Frontend render checks aanwezig
- ✅ 2 werkende voorbeelden in basis-flow
- ✅ Geen breaking changes

### Bekende Beperkingen

- Geen video's of afbeeldingen in toelichting (alleen tekst)
- Max toelichting is onbeperkt maar UX best beperkt tot 2-3 zinnen

### Toekomstige Verbeteringen

- [ ] HTML/markdown support in toelichting
- [ ] Meerdere toelichting typen (info, warning, help)
- [ ] Toelichting in andere talen
- [ ] Admin interface voor info-knop beheer

---

**Auteur**: Claude (AI Assistant)  
**Datum**: 6 November 2025  
**Status**: ✅ Gereed voor productie

