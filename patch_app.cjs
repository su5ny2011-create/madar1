const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const updateRequestBlock = `  const handleUpdateRequest = (id: string, updatedFields: Partial<MaintenanceRequest>) => {`;
const deleteRequestBlock = `  const handleDeleteRequest = (id: string) => {
    const updated = requests.filter((req) => req.id !== id);
    setRequests(updated);
    saveState('almadar_requests', updated);
    fetch('/api/maintenance-requests/' + id, { method: 'DELETE' }).catch(console.error);
  };

  const handleUpdateRequest = (id: string, updatedFields: Partial<MaintenanceRequest>) => {`;

code = code.replace(updateRequestBlock, deleteRequestBlock);

const managerProps = `            onBulkUpdateRequests={handleBulkUpdateRequests}
            canEdit={currentUser.permissions.canAddEditMaintenance}`;
const newManagerProps = `            onBulkUpdateRequests={handleBulkUpdateRequests}
            onDeleteRequest={handleDeleteRequest}
            canEdit={currentUser.permissions.canAddEditMaintenance}`;

code = code.replace(managerProps, newManagerProps);
fs.writeFileSync('src/App.tsx', code);
