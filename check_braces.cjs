const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const lines = code.split('\n');
let inMainApp = false;
let braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('function MainApplication()')) {
    inMainApp = true;
  }
  
  if (inMainApp) {
    for (let char of line) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
    }
    
    if (i+1 >= 145 && i+1 <= 150) {
      console.log(`Line ${i+1} depth: ${braceDepth} - ${line.trim()}`);
    }
    
    if (braceDepth === 0 && inMainApp) {
      break;
    }
  }
}
