const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.match(/\buse(State|Effect|Memo|Callback|Context|Ref)\b/)) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});
