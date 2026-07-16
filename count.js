const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const matches = code.match(/useState/g);
console.log('Total useState keywords:', matches ? matches.length : 0);
