const fs = require('fs');
const code = fs.readFileSync('src/components/FinancialAffairs.tsx', 'utf8');
const lines = code.split('\n');
let inMain = false;
let hookCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default function FinancialAffairs')) inMain = true;
  if (inMain && lines[i].match(/\buse(State|Effect|Memo|Callback|Context|Ref)\b/)) {
    hookCount++;
    console.log(`${hookCount}: ${i + 1}: ${lines[i].trim()}`);
  }
}
