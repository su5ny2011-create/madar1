/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Language, UserRole } from '../types';
import { translations } from '../translations';
import {
  ShieldAlert,
  UserCheck,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
  Key,
  Shield,
  Edit3,
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  lang: Language;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (id: string, user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManagement({
  users,
  currentUser,
  lang,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}: UserManagementProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // If the logged in user is not an Admin or does not have "canManageUsers" permission, block access immediately
  const hasAccess = currentUser.role === 'admin' || currentUser.permissions.canManageUsers;

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [username, setUsername] = useState('');
  const [fullNameAr, setFullNameAr] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [role, setRole] = useState<UserRole>('technician');
  const [canAddEditMaintenance, setCanAddEditMaintenance] = useState(true);
  const [canAddEditFinance, setCanAddEditFinance] = useState(false);
  const [canAddEditSettings, setCanAddEditSettings] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [isActive, setIsActive] = useState(true);

  if (!hasAccess) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
        <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-black text-red-700 font-arabic">{isRtl ? 'عذراً! وصول غير مصرح به' : 'Access Denied!'}</h3>
        <p className="text-xs text-red-600 mt-2 font-arabic font-medium">{t.accessDenied}</p>
      </div>
    );
  }

  // Preset role-specific typical defaults
  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
      setCanAddEditMaintenance(true);
      setCanAddEditFinance(true);
      setCanAddEditSettings(true);
      setCanManageUsers(true);
    } else if (selectedRole === 'financial') {
      setCanAddEditMaintenance(false);
      setCanAddEditFinance(true);
      setCanAddEditSettings(true);
      setCanManageUsers(false);
    } else {
      // technician
      setCanAddEditMaintenance(true);
      setCanAddEditFinance(false);
      setCanAddEditSettings(true);
      setCanManageUsers(false);
    }
  };

  const handleOpenNewUserForm = () => {
    setUsername('');
    setFullNameAr('');
    setFullNameEn('');
    setRole('technician');
    setCanAddEditMaintenance(true);
    setCanAddEditFinance(false);
    setCanAddEditSettings(true);
    setCanManageUsers(false);
    setIsActive(true);
    setEditingUserId(null);
    setShowForm(true);
  };

  const handleOpenEditUserForm = (user: User) => {
    setUsername(user.username);
    setFullNameAr(user.fullNameAr);
    setFullNameEn(user.fullNameEn);
    setRole(user.role);
    setCanAddEditMaintenance(user.permissions.canAddEditMaintenance);
    setCanAddEditFinance(user.permissions.canAddEditFinance);
    setCanAddEditSettings(user.permissions.canAddEditSettings);
    setCanManageUsers(user.permissions.canManageUsers);
    setIsActive(user.active);
    setEditingUserId(user.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullNameAr.trim() || !fullNameEn.trim()) return;

    const userData = {
      username: username.trim().toLowerCase(),
      fullNameAr: fullNameAr.trim(),
      fullNameEn: fullNameEn.trim(),
      role,
      permissions: {
        canAddEditMaintenance,
        canAddEditFinance,
        canAddEditSettings,
        canManageUsers,
      },
      active: isActive,
    };

    if (editingUserId) {
      onUpdateUser(editingUserId, userData);
    } else {
      onAddUser(userData);
    }

    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    // Cannot delete themselves
    if (id === currentUser.id) {
      alert(isRtl ? 'لا يمكنك حذف حسابك الشخصي الذي تستخدمه لتسجيل الدخول حالياً!' : 'You cannot delete your own account!');
      return;
    }

    if (confirm(t.deleteUserConfirm)) {
      onDeleteUser(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-[#024B83] font-arabic flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#E5941A]" />
            {t.userPermissionsManagement}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-arabic">
            {isRtl
              ? 'إنشاء حسابات الموظفين وتعيين المسميات الوظيفية وتقييد أو تمكين الصلاحيات للمحافظة على سرية البيانات'
              : 'Add computer engineers and accountants, configure main roles, and edit precise security toggles'}
          </p>
        </div>

        <button
          onClick={handleOpenNewUserForm}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#024B83] hover:bg-[#0b4c80] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all font-arabic"
        >
          <UserPlus className="w-4 h-4 text-[#E5941A]" />
          <span>{t.addUser}</span>
        </button>
      </div>

      {/* Slide-over custom styled user creation/editing form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border-2 border-[#024B83]/30 shadow-md">
          <h3 className="text-sm font-bold text-[#024B83] mb-6 border-b border-slate-100 pb-3 font-arabic flex items-center gap-1.5">
            <UserPlus className="w-5 h-5 text-[#E5941A]" />
            {editingUserId ? t.editUser : t.addUser}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Username */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                  {t.username} (كود تسجيل الدخول)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. samer"
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>

              {/* Full Name Arabic */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                  {t.fullNameAr}
                </label>
                <input
                  type="text"
                  required
                  value={fullNameAr}
                  onChange={(e) => setFullNameAr(e.target.value)}
                  placeholder="مثال: رائد القضاه"
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>

              {/* Full Name English */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 font-arabic">
                  {t.fullNameEn}
                </label>
                <input
                  type="text"
                  required
                  value={fullNameEn}
                  onChange={(e) => setFullNameEn(e.target.value)}
                  placeholder="e.g. Raed Al-Qudah"
                  className="block w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Primary Role Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                  {t.role}
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="block w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#024B83]"
                >
                  <option value="admin">{t.admin}</option>
                  <option value="technician">{t.technician}</option>
                  <option value="financial">{t.financial}</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-arabic">
                  {isRtl
                    ? '* اختيار الدور يملأ الصلاحيات الفرعية افتراضياً ويمكن تعديلها أدناه يدوياً'
                    : '* Selecting a role auto-configures typical security switches below'}
                </p>
              </div>

              {/* Active Toggle Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 font-arabic">
                  {t.isActive}
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex-1 justify-center">
                    <input
                      type="radio"
                      name="userActive"
                      checked={isActive}
                      onChange={() => setIsActive(true)}
                      className="text-[#024B83]"
                    />
                    <span className="text-xs font-bold text-[#1C7C43] font-arabic flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" />
                      {isRtl ? 'نشط ومصرح له' : 'Active'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex-1 justify-center">
                    <input
                      type="radio"
                      name="userActive"
                      checked={!isActive}
                      onChange={() => setIsActive(false)}
                      className="text-[#024B83]"
                    />
                    <span className="text-xs font-bold text-red-600 font-arabic flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      {isRtl ? 'معطل / موقوف' : 'Deactivated'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Granular Permissions Checkboxes */}
            <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wide border-b border-slate-100 pb-1.5 mb-2">
                {t.permissions}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                  <input
                    type="checkbox"
                    checked={canAddEditMaintenance}
                    onChange={(e) => setCanAddEditMaintenance(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-[#024B83] focus:ring-[#024B83]"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 font-arabic">{t.canAddEditMaintenance}</p>
                    <p className="text-[10px] text-slate-400">Can insert repairs, parts and client visit details</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                  <input
                    type="checkbox"
                    checked={canAddEditFinance}
                    onChange={(e) => setCanAddEditFinance(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-[#024B83] focus:ring-[#024B83]"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 font-arabic">{t.canAddEditFinance}</p>
                    <p className="text-[10px] text-slate-400">Can input office expenses, set morning cash and audit ledgers</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                  <input
                    type="checkbox"
                    checked={canAddEditSettings}
                    onChange={(e) => setCanAddEditSettings(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-[#024B83] focus:ring-[#024B83]"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 font-arabic">{t.canAddEditSettings}</p>
                    <p className="text-[10px] text-slate-400">Can pre-register clients, price lists and custom directories</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                  <input
                    type="checkbox"
                    checked={canManageUsers}
                    onChange={(e) => setCanManageUsers(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-[#024B83] focus:ring-[#024B83]"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 font-arabic">{t.canManageUsers}</p>
                    <p className="text-[10px] text-slate-400">Can create accounts and adjust permissions of colleagues</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200 transition-colors font-arabic"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#024B83] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer hover:bg-[#0b4c80] transition-colors font-arabic"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users registry table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#024B83] font-arabic uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#1C7C43]" />
            {isRtl ? 'الموظفون والمستخدمون المسجلون' : 'Registered Staff Registry'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-right">
            <thead>
              <tr className="bg-slate-50/20">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                  {t.fullNameAr}
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                  {t.username}
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                  {t.role}
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                  {t.permissions}
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                  {t.status}
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 font-arabic text-center">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {users.map((u) => {
                let roleColor = '';
                let roleLabel = '';

                switch (u.role) {
                  case 'admin':
                    roleColor = 'bg-[#024B83]/10 text-[#024B83] border border-[#024B83]/20';
                    roleLabel = t.admin;
                    break;
                  case 'technician':
                    roleColor = 'bg-[#E5941A]/10 text-[#E5941A] border border-[#E5941A]/20';
                    roleLabel = t.technician;
                    break;
                  case 'financial':
                    roleColor = 'bg-[#1A98D3]/10 text-[#1A98D3] border border-[#1A98D3]/20';
                    roleLabel = t.financial;
                    break;
                }

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 text-center font-bold text-slate-950">
                      <div>{u.fullNameAr}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5 font-medium">{u.fullNameEn}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-[#024B83]">
                      {u.username}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold ${roleColor}`}>
                        {roleLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center max-w-xs whitespace-normal">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {u.permissions.canAddEditMaintenance && (
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                            🛠️ {isRtl ? 'صيانة' : 'Maintenance'}
                          </span>
                        )}
                        {u.permissions.canAddEditFinance && (
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                            💰 {isRtl ? 'مالية' : 'Finance'}
                          </span>
                        )}
                        {u.permissions.canAddEditSettings && (
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                            ⚙️ {isRtl ? 'إدخال' : 'Registry'}
                          </span>
                        )}
                        {u.permissions.canManageUsers && (
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                            🔑 {isRtl ? 'مدير' : 'Access'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-[#1C7C43] font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                          <Unlock className="w-3 h-3" />
                          {isRtl ? 'نشط' : 'Active'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full text-[10px]">
                          <Lock className="w-3 h-3" />
                          {isRtl ? 'معطل' : 'Locked'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => handleOpenEditUserForm(u)}
                          className="p-1.5 text-[#024B83] hover:bg-[#024B83] hover:text-white rounded-lg cursor-pointer transition-colors border border-slate-100"
                          title={t.editUser}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors border border-slate-100"
                            title={isRtl ? 'حذف الموظف' : 'Delete Account'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
