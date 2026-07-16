const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');
let i = 1;
lines.forEach((line, index) => {
  if (line.match(/use(State|Effect|Memo|Callback|Ref|Context|Reducer)/)) {
    console.log(`${i++}. line ${index + 1}: ${line.trim()}`);
  }
});
