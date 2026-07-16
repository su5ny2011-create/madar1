const fs = require('fs');
let code = fs.readFileSync('src/components/MaintenanceManager.tsx', 'utf8');
code = code.replace("import {", "import {\n  Trash2,");
code = code.replace("canEdit: boolean;", "canEdit: boolean;\n  onDeleteRequest?: (id: string) => void;");
code = code.replace("onBulkUpdateRequests,", "onBulkUpdateRequests,\n  onDeleteRequest,");
code = code.replace("export default function MaintenanceManager({", "export default function MaintenanceManager({\n  onDeleteRequest,");
fs.writeFileSync('src/components/MaintenanceManager.tsx', code);
