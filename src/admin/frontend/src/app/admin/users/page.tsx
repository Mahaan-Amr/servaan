'use client';

import { useEffect, useState, useCallback } from 'react';
import { withAdminAuth } from '@/contexts/AdminAuthContext';
import { listAdminUsers, createAdminUser, updateAdminUserRole, setAdminUserActive, resetAdminUserPassword, AdminUser, AdminUserRole } from '@/services/admin/users/userService';
import { Plus, Search, Shield, CheckCircle, XCircle, Edit, Lock, Unlock, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'ALL' | AdminUserRole>('ALL');
  const [isActive, setIsActive] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAdminUsers({ page, limit, search, role, isActive });
      setUsers(res.users);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'خطا در بارگذاری کاربران';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, role, isActive]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const email = prompt('ایمیل کاربر جدید را وارد کنید');
    if (!email) return;
    const password = prompt('رمز عبور اولیه را وارد کنید (حداقل 8 کاراکتر)');
    if (!password) return;
    const roleSel = (prompt('نقش کاربر: SUPER_ADMIN | PLATFORM_ADMIN | SUPPORT | DEVELOPER', 'SUPPORT') || 'SUPPORT') as AdminUserRole;
    try {
      await createAdminUser(email, password, roleSel);
      toast.success('کاربر ایجاد شد');
      load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطا در ایجاد کاربر'); }
  };

  const handleToggleActive = async (u: AdminUser) => {
    try {
      await setAdminUserActive(u.id, !u.isActive);
      toast.success(!u.isActive ? 'فعال شد' : 'غیرفعال شد');
      load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطا در تغییر وضعیت'); }
  };

  const [roleModal, setRoleModal] = useState<{ open: boolean; user?: AdminUser; role: AdminUserRole }>(() => ({ open: false, role: 'SUPPORT' }));

  const openRoleModal = (u: AdminUser) => setRoleModal({ open: true, user: u, role: u.role });
  const closeRoleModal = () => setRoleModal({ open: false, user: undefined, role: 'SUPPORT' });
  const submitRoleChange = async () => {
    if (!roleModal.user) return;
    try {
      await updateAdminUserRole(roleModal.user.id, roleModal.role);
      toast.success('نقش کاربر به‌روزرسانی شد');
      closeRoleModal();
      load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطا در تغییر نقش'); }
  };

  const handleResetPassword = async (u: AdminUser) => {
    const newPassword = prompt('رمز عبور جدید را وارد کنید');
    if (!newPassword) return;
    try {
      await resetAdminUserPassword(u.id, newPassword);
      toast.success('رمز عبور بازنشانی شد');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'خطا در بازنشانی رمز عبور'); }
  };

  return (
    <div className="min-h-screen bg-admin-bg" dir="rtl">
      <div className="bg-white border-b border-admin-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-admin-primary rounded-lg flex items-center justify-center mr-3"><Shield className="h-5 w-5 text-white"/></div>
            <div>
              <h1 className="text-2xl font-bold text-admin-text">مدیریت کاربران ادمین</h1>
              <p className="text-admin-text-light">ایجاد، نقش‌ها و وضعیت حساب</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} className="btn-admin-primary flex items-center"><Plus className="h-4 w-4 ml-2"/>کاربر جدید</button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-admin border border-admin-border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-text-muted"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ setPage(1); load(); } }} placeholder="جستجو ایمیل" className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary"/>
            </div>
            <select value={role} onChange={e=>{ setRole(e.target.value as AdminUserRole); setPage(1); }} className="px-3 py-2 border border-admin-border rounded-admin">
              <option value="ALL">همه نقش‌ها</option>
              <option value="SUPER_ADMIN">سوپر ادمین</option>
              <option value="PLATFORM_ADMIN">پلتفرم ادمین</option>
              <option value="SUPPORT">پشتیبانی</option>
              <option value="DEVELOPER">توسعه‌دهنده</option>
            </select>
            <select value={isActive} onChange={e=>{ setIsActive(e.target.value as 'all' | 'true' | 'false'); setPage(1); }} className="px-3 py-2 border border-admin-border rounded-admin">
              <option value="all">همه وضعیت‌ها</option>
              <option value="true">فعال</option>
              <option value="false">غیرفعال</option>
            </select>
            <select value={limit} onChange={e=>{ setLimit(Number(e.target.value)); setPage(1); }} className="px-3 py-2 border border-admin-border rounded-admin">
              <option value={10}>۱۰</option>
              <option value={25}>۲۵</option>
              <option value={50}>۵۰</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-admin border border-admin-border overflow-hidden">
          <table className="min-w-full divide-y divide-admin-border">
            <thead className="bg-admin-bg">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">ایمیل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">نقش</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">آخرین ورود</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-admin-text-muted uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-admin-border">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center">در حال بارگذاری...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-admin-text-muted">کاربری یافت نشد</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-3 text-sm font-mono">{u.email}</td>
                  <td className="px-6 py-3 text-sm">{u.role}</td>
                  <td className="px-6 py-3 text-sm">
                    {u.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-success text-white"><CheckCircle className="h-3 w-3 ml-1"/>فعال</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-danger text-white"><XCircle className="h-3 w-3 ml-1"/>غیرفعال</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('fa-IR') : '—'}</td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <button className="text-admin-warning hover:text-admin-warning-dark" title="تغییر نقش" onClick={() => openRoleModal(u)}><Edit className="h-4 w-4"/></button>
                      <button className={`${u.isActive ? 'text-admin-danger' : 'text-admin-success'} hover:opacity-80`} title={u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'} onClick={() => handleToggleActive(u)}>{u.isActive ? <Lock className="h-4 w-4"/> : <Unlock className="h-4 w-4"/>}</button>
                      <button className="text-admin-primary hover:text-admin-primary-dark" title="بازنشانی رمز" onClick={() => handleResetPassword(u)}><KeyRound className="h-4 w-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-admin-text-muted">نمایش {(page - 1) * limit + 1} تا {Math.min(page * limit, total)} از {total}</div>
            <div className="flex items-center gap-2">
              <button disabled={page===1} onClick={()=>setPage(page-1)} className="px-3 py-2 text-sm font-medium text-admin-text bg-white border border-admin-border rounded-admin hover:bg-admin-bg disabled:opacity-50">قبلی</button>
              <button disabled={page===pages} onClick={()=>setPage(page+1)} className="px-3 py-2 text-sm font-medium text-admin-text bg-white border border-admin-border rounded-admin hover:bg-admin-bg disabled:opacity-50">بعدی</button>
            </div>
          </div>
        )}
      </div>
      {/* Role Modal */}
      {roleModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-admin shadow-xl max-w-sm w-full">
            <div className="p-4 border-b border-admin-border">
              <h3 className="text-lg font-bold text-admin-text">تغییر نقش کاربر</h3>
              <p className="text-sm text-admin-text-light mt-1">{roleModal.user?.email}</p>
            </div>
            <div className="p-4 space-y-3">
              <label className="block text-sm text-admin-text">نقش</label>
              <select value={roleModal.role} onChange={(e)=>setRoleModal(m=>({ ...m, role: e.target.value as AdminUserRole }))} className="w-full px-3 py-2 border border-admin-border rounded-admin">
                <option value="SUPER_ADMIN">سوپر ادمین</option>
                <option value="PLATFORM_ADMIN">پلتفرم ادمین</option>
                <option value="SUPPORT">پشتیبانی</option>
                <option value="DEVELOPER">توسعه‌دهنده</option>
              </select>
            </div>
            <div className="p-4 border-t border-admin-border flex items-center justify-end gap-2">
              <button className="btn-admin-secondary" onClick={closeRoleModal}>انصراف</button>
              <button className="btn-admin-primary" onClick={submitRoleChange}>ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminAuth(AdminUsersPage);


