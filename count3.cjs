const fs = require('fs');
const path = require('path');

function countHooks(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      countHooks(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const code = fs.readFileSync(fullPath, 'utf8');
      const lines = code.split('\n');
      let currentFunc = '';
      let hookCounts = {};
      let funcHooks = [];
      for (const line of lines) {
        const funcMatch = line.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9_]+)\s*[=(]/);
        if (funcMatch) {
          if (currentFunc && funcHooks.length > 0) {
            // console.log(currentFunc, funcHooks.length);
            if (funcHooks.filter(h => h.includes('useState')).length === 16) {
              console.log('FOUND 16 useStates in', currentFunc, 'in file', fullPath);
            }
          }
          currentFunc = funcMatch[1];
          funcHooks = [];
        }
        const hookMatch = line.match(/\buse(State|Effect|Memo|Callback|Context|Ref)\b/);
        if (hookMatch && currentFunc) {
          funcHooks.push(hookMatch[0]);
        }
      }
      if (currentFunc && funcHooks.length > 0) {
        if (funcHooks.filter(h => h.includes('useState')).length === 16) {
          console.log('FOUND 16 useStates in', currentFunc, 'in file', fullPath);
        }
      }
    }
  }
}

countHooks('src');
