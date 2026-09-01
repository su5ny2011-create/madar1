const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const lines = code.split('\n');
let braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
  }
  if (line.includes('useEffect(() =>') || line.includes('React.useMemo(')) {
    console.log(`Hook at line ${i+1}, depth is ${braceDepth}, line is: ${line.trim()}`);
  }
}
