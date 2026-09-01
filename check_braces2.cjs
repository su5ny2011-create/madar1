const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const lines = code.split('\n');
let inMainApp = false;
let braceDepth = 0;

for (let i = 140; i < 155; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
  }
  console.log(`Line ${i+1} depth: ${braceDepth} - ${line.trim()}`);
}
