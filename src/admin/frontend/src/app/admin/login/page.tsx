'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminLoginRequest } from '@/types/admin';
import { Eye, EyeOff, Shield, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/constants/localization';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState<AdminLoginRequest>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, user, loading: authLoading } = useAdminAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error(t('messages.requiredField'));
      return;
    }

    try {
      setLoading(true);
      await login(formData);
      toast.success(t('messages.loginSuccess'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('messages.loginFailed');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-admin-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-admin-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-admin-primary rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-admin-text">
            {t('navigation.dashboard')}
          </h2>
          <p className="mt-2 text-sm text-admin-text-light">
            {t('dashboard.welcome')} به پنل مدیریت پلتفرم سِروان
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-admin-card py-8 px-6 shadow-admin-xl rounded-admin">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-admin-text">
                {t('common.email')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-admin-text-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-admin-input pr-10 text-right"
                  placeholder="admin@servaan.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-admin-text">
                {t('common.password')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-admin-text-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-admin-input pr-10 pl-10 text-right"
                  placeholder="رمز عبور خود را وارد کنید"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-admin-text-muted hover:text-admin-text" />
                  ) : (
                    <Eye className="h-5 w-5 text-admin-text-muted hover:text-admin-text" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-admin-primary flex justify-center items-center py-3 px-4 text-lg font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent ml-2"></div>
                    {t('common.loading')}
                  </>
                ) : (
                  t('common.login')
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-admin">
            <h3 className="text-sm font-medium text-admin-text mb-2">اطلاعات ورود آزمایشی:</h3>
            <div className="text-xs text-admin-text-light space-y-1">
              <div><strong>مدیر کل:</strong> admin@servaan.com / AdminSecure2024!</div>
              <div><strong>مدیر پلتفرم:</strong> platform@servaan.com / PlatformSecure2024!</div>
              <div><strong>پشتیبانی:</strong> support@servaan.com / SupportSecure2024!</div>
              <div><strong>توسعه‌دهنده:</strong> developer@servaan.com / DeveloperSecure2024!</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-admin-text-muted">
            © ۱۴۰۳ سِروان. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </div>
  );
}
