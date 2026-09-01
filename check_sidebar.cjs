const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const match = code.match(/const renderSidebarContents =[\s\S]*?^  \};/m);
if (match) {
  const content = match[0];
  const hooks = content.match(/\buse[A-Z]\w*\(/g);
  console.log("Hooks in renderSidebarContents:", hooks);
} else {
  console.log("Could not find renderSidebarContents");
}
