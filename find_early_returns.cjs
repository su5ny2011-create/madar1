const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

let braceDepth = 0;
let inMainApp = false;
let lines = code.split('\n');
let mainAppStart = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('function MainApplication()')) {
    inMainApp = true;
    mainAppStart = i;
  }
  
  if (inMainApp) {
    let oldDepth = braceDepth;
    for (let char of line) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
    }
    
    if (braceDepth === 1 && line.includes('return') && !line.includes('return () =>')) {
      console.log(`Return at depth 1: ${i+1}: ${line}`);
    }
    if (braceDepth === 0 && oldDepth > 0) {
      break;
    }
  }
}
