const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const match = code.match(/function MainApplication\(\) \{([\s\S]*?)return/);
if (match) {
  console.log(match[1]);
}
