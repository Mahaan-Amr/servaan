'use client';

import { useEffect, useMemo, useState } from 'react';
import { resetTenantUserPassword, listTenantUsers } from '@/services/admin/tenants/tenantService';
import { toast } from 'react-hot-toast';

export default function TenantUsersResetPassword({ tenantId }: { tenantId: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; email: string; name?: string | null }>>([]);
  const [query, setQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingUsers(true);
        const data = await listTenantUsers(tenantId);
        setUsers(data);
      } catch (e) {
        // ignore toast here; parent page can handle
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [tenantId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => (u.email?.toLowerCase().includes(q)) || (u.name || '').toLowerCase().includes(q));
  }, [users, query]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || password.length < 8) {
      toast.error('ایمیل و رمز عبور معتبر وارد کنید (حداقل ۸ کاراکتر)');
      return;
    }
    try {
      setLoading(true);
      await resetTenantUserPassword(tenantId, email, password);
      toast.success('رمز عبور کاربر با موفقیت بازنشانی شد');
      setEmail('');
      setPassword('');
    } catch (e: any) {
      toast.error(e.message || 'خطا در بازنشانی رمز عبور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-admin border border-admin-border p-4 max-w-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-admin-text mb-1">انتخاب کاربر</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent mb-2"
              placeholder="جستجو بر اساس ایمیل یا نام"
            />
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
            >
              <option value="" disabled>{loadingUsers ? 'در حال بارگذاری...' : 'یک کاربر را انتخاب کنید'}</option>
              {filtered.map(u => (
                <option key={u.id} value={u.email}>
                  {u.email}{u.name ? ` — ${u.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-admin-text mb-1">رمز عبور جدید</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-primary focus:border-transparent"
            placeholder="حداقل ۸ کاراکتر"
            required
            minLength={8}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="submit" className="btn-admin-primary" disabled={loading}>
          {loading ? 'در حال بازنشانی...' : 'بازنشانی رمز عبور'}
        </button>
      </div>
    </form>
  );
}


