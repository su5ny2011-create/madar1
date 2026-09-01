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
    let oldDepth = braceDepth;
    for (let char of line) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
    }
    
    if (braceDepth > 1 && line.match(/\buse(State|Effect|Memo|Callback|Context|Ref)\b/)) {
      console.log(`Potential conditional hook at line ${i+1}: ${line.trim()}`);
    }
    
    if (braceDepth === 0 && oldDepth > 0) {
      break;
    }
  }
}
