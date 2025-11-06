const fs = require('fs');
const path = '/Users/gstevens/ContractGenerator/flows/basis-flow.json';
let text = fs.readFileSync(path, 'utf8');
const replacement = `"inkoop": {
          "label": "Inkoop en Aanbesteding",
          "info_button": true,
          "toelichting": "De contractstandaard is van toepassing op de volgende inkoopprocedures\n• Europese aanbesteding (AW 2012):\n- SAS-procedure met EMVI-criterium\n- SAS-procedure zonder EMVI-criterium\n• Toelatingsprocedure (voormalig ‘open house’)\nSAS = sociale en andere specifieke diensten\nEMVI = economisch meest voordelige inschrijving"
        },`;
text = text.replace(/"inkoop":\s*\{[\s\S]*?\},/m, replacement);
fs.writeFileSync(path, text);
console.log('Fixed inkoop block');
