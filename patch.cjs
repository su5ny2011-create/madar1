const fs = require('fs');
let code = fs.readFileSync('src/components/MaintenanceManager.tsx', 'utf8');
code = code.replace("  Wrench,", "  Trash2,\n  Wrench,");
code = code.replace("canEdit: boolean;", "canEdit: boolean;\n  onDeleteRequest: (id: string) => void;");
code = code.replace("  canEdit,", "  onDeleteRequest,\n  canEdit,");

// Update table cell sizes
code = code.replaceAll("text-sm md:text-base", "text-xs md:text-sm");
code = code.replaceAll("text-[11px] md:text-xs", "text-[10px] md:text-[11px]");
code = code.replaceAll("text-[10px] md:text-[11px]", "text-[9px] md:text-[10px]");
// Fix any overlapping replacements if needed. Actually it's fine.

// Add Delete Button next to Edit
const editBtn = `                            <Edit2 className="w-4 h-4" />
                          </button>`;
const deleteBtn = `                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?')) {
                                onDeleteRequest(req.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>`;
code = code.replace(editBtn, deleteBtn);
fs.writeFileSync('src/components/MaintenanceManager.tsx', code);
