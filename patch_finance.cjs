const fs = require('fs');
let code = fs.readFileSync('src/components/FinancialAffairs.tsx', 'utf8');

code = code.replaceAll("text-sm md:text-base", "text-xs md:text-sm");
code = code.replaceAll("text-[11px] md:text-xs", "text-[10px] md:text-[11px]");
code = code.replaceAll("text-[10px] md:text-[11px]", "text-[9px] md:text-[10px]");

fs.writeFileSync('src/components/FinancialAffairs.tsx', code);
