const fs = require('fs');

const checkFile = (file) => {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  let inComponent = false;
  let depth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // basic depth tracking
    for (let char of line) {
      if (char === '{') depth++;
      if (char === '}') depth--;
    }
    
    if (line.match(/^\s*if\s*\(/) && depth === 1) {
      // console.log(`${file}:${i+1} Potential conditional at depth 1: ${line}`);
    }
    
    if (line.match(/\buse(State|Effect|Memo|Callback|Context|Ref)\b/)) {
      if (depth > 1) {
        console.log(`Potential hook violation in ${file}:${i+1} at depth ${depth}: ${line.trim()}`);
      }
    }
  }
}

const glob = require('glob'); // Note: glob might not be available, fallback to manual list
const files = [
  'src/App.tsx',
  'src/components/MaintenanceManager.tsx',
  'src/components/CustomerPortal.tsx',
  'src/components/AppointmentCalendar.tsx',
  'src/components/Dashboard.tsx',
  'src/components/FinancialAffairs.tsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) checkFile(f);
});
