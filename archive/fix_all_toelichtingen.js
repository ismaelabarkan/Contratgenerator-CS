const fs = require('fs');
const path = '/Users/gstevens/ContractGenerator/flows/basis-flow.json';
let text = fs.readFileSync(path, 'utf8');

// Fix: replace unescaped newlines in toelichting strings
// Pattern: "toelichting": "..." with actual newlines inside
text = text.replace(/"toelichting"\s*:\s*"([^"]*(?:\n[^"]*)*)"/g, (match, content) => {
  // Escape newlines, tabs, and other control chars
  const fixed = content
    .replace(/\\/g, '\\\\')  // escape backslashes first
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');   // escape quotes
  return `"toelichting": "${fixed}"`;
});

// Also fix multiline strings that might span multiple lines in JSON
text = text.replace(/"toelichting"\s*:\s*"([^"]*)\n([^"]*)"/g, (match, part1, part2) => {
  const fixed = (part1 + '\\n' + part2)
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');
  return `"toelichting": "${fixed}"`;
});

fs.writeFileSync(path, text);
console.log('Fixed toelichting strings');
