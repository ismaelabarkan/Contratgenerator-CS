const fs = require('fs');
const path = '/Users/gstevens/ContractGenerator/flows/basis-flow.json';
let t = fs.readFileSync(path,'utf8');
const val = "De contractstandaard is van toepassing op de volgende inkoopprocedures\\n• Europese aanbesteding (AW 2012):\\n- SAS-procedure met EMVI-criterium\\n- SAS-procedure zonder EMVI-criterium\\n• Toelatingsprocedure (voormalig ‘open house’)\\nSAS = sociale en andere specifieke diensten\\nEMVI = economisch meest voordelige inschrijving";
const block = `"inkoop": {\n          "label": "Inkoop en Aanbesteding",\n          "info_button": true,\n          "toelichting": "${val}"\n        },`;
t = t.replace(/"inkoop":\s*\{[\s\S]*?\},/m, block);
fs.writeFileSync(path, t);
console.log('Replaced with escaped newlines');
