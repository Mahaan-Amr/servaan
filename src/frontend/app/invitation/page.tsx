'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { AlertBox } from '../../components/ui/AlertBox';
import { Spinner } from '../../components/ui/Spinner';
import { FaPhone, FaUserPlus, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa';
import * as smsService from '../../services/smsService';
import { API_URL } from '../../lib/apiUtils';

interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Component that uses useSearchParams - will be wrapped in Suspense
function InvitationForm() {
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState<'loading' | 'phone-verification' | 'registration' | 'success'>('loading');
  const [invitationData, setInvitationData] = useState<{
    code: string;
    phone: string;
    role: string;
  } | null>(null);
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; formatted?: string; error?: string }>({ isValid: false });

  // Initialize invitation data from URL parameters
  useEffect(() => {
    const code = searchParams.get('code');
    const phone = searchParams.get('phone');
    const role = searchParams.get('role');
    
    if (!code || !phone || !role) {
      setError('لینک دعوت‌نامه نامعتبر است');
      return;
    }
    
    setInvitationData({ code, phone, role });
    
    // Validate phone number
    const validation = smsService.validateIranianPhoneNumber(phone);
    setPhoneValidation(validation);
    
    if (validation.isValid) {
      setStep('phone-verification');
      // Automatically send verification code
      sendVerificationCode(validation.formatted!);
    } else {
      setError('شماره تلفن در لینک دعوت‌نامه معتبر نیست');
    }
  }, [searchParams]);

  const sendVerificationCode = async (phoneNumber: string) => {
    try {
      await smsService.sendVerificationCode({
        phoneNumber,
        purpose: 'invitation_verification'
      });
      setSuccess('کد تایید به شماره شما ارسال شد');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال کد تایید');
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 5) {
      setError('کد تایید باید 5 رقم باشد');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await smsService.verifyCode({
        phoneNumber: phoneValidation.formatted!,
        code: verificationCode
      });
      setStep('registration');
      setSuccess('شماره تلفن تایید شد. لطفاً اطلاعات خود را وارد کنید');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تایید کد');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('تمام فیلدها الزامی است');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیست');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('رمز عبور باید حداقل 6 کاراکتر باشد');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      
      console.log('🚀 Submitting registration...', {
        name: formData.name,
        email: formData.email,
        phoneNumber: phoneValidation.formatted,
        role: invitationData!.role,
        invitationCode: invitationData!.code
      });
      
      // Create user account
      const response = await axios.post(`${API_URL}/auth/register-invitation`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: phoneValidation.formatted,
        role: invitationData!.role,
        invitationCode: invitationData!.code
      });
      
      console.log('✅ Registration successful:', response.data);
      
      // Auto-login the user - registration endpoint already returns token
      const { id, name, email, role, token, tenant } = response.data;
      
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id,
        name,
        email,
        role
      }));
      
      setStep('success');
      setSuccess(`خوش آمدید ${name}! حساب شما با موفقیت ایجاد شد`);
      
      // Clear any previous errors
      setError('');
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard...', { tenant });
        
        // Determine subdomain based on tenant info
        if (tenant?.subdomain && tenant.subdomain !== 'default') {
          const redirectUrl = `http://${tenant.subdomain}.localhost:3002/dashboard`;
          console.log('🌐 Redirecting to tenant subdomain:', redirectUrl);
          window.location.href = redirectUrl;
        } else {
          // For development, redirect to main domain
          const redirectUrl = 'http://localhost:3002/dashboard';
          console.log('🌐 Redirecting to main domain:', redirectUrl);
          window.location.href = redirectUrl;
        }
      }, 2000); // Reduced delay to 2 seconds
      
    } catch (err: unknown) {
      console.error('❌ Registration error:', err);
      
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
      
      // Check if it's actually a success but axios thinks it's an error
      if (axiosError.response?.status === 201) {
        console.log('✅ Registration actually successful despite error');
        // Handle as success
        const responseData = axiosError.response.data as { id: string; name: string; email: string; role: string; token: string; tenant: { subdomain?: string } };
        const { id, name, email, role, token, tenant } = responseData;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          id,
          name,
          email,
          role
        }));
        
        setStep('success');
        setSuccess(`خوش آمدید ${name}! حساب شما با موفقیت ایجاد شد`);
        setError('');
        
        setTimeout(() => {
          if (tenant?.subdomain && tenant.subdomain !== 'default') {
            window.location.href = `http://${tenant.subdomain}.localhost:3002/dashboard`;
          } else {
            window.location.href = 'http://localhost:3002/dashboard';
          }
        }, 2000);
      } else {
        setError(axiosError.response?.data?.message || 'خطا در ایجاد حساب کاربری');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'مدیر سیستم';
      case 'MANAGER': return 'مدیر';
      case 'STAFF': return 'کارمند';
      default: return role;
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
            {step === 'phone-verification' ? (
              <FaPhone className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            ) : step === 'registration' ? (
              <FaUserPlus className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            ) : (
              <FaCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            )}
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'phone-verification' && 'تایید شماره تلفن'}
            {step === 'registration' && 'تکمیل ثبت‌نام'}
            {step === 'success' && 'ثبت‌نام موفق'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'phone-verification' && `کد تایید به شماره ${invitationData?.phone} ارسال شد`}
            {step === 'registration' && `شما به عنوان ${getRoleDisplayName(invitationData?.role || '')} دعوت شده‌اید`}
            {step === 'success' && 'حساب شما با موفقیت ایجاد شد'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          {error && <AlertBox type="error" message={error} />}
          {success && <AlertBox type="success" message={success} />}

          {step === 'phone-verification' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  کد تایید *
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-3 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="12345"
                  maxLength={5}
                  required
                  disabled={loading}
                  dir="ltr"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  کد 5 رقمی ارسال شده به شماره تلفن خود را وارد کنید
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 5}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Spinner size="small" />
                    <span className="mr-2">در حال تایید...</span>
                  </>
                ) : (
                  'تایید شماره تلفن'
                )}
              </button>

              <button
                type="button"
                onClick={() => sendVerificationCode(phoneValidation.formatted!)}
                disabled={loading}
                className="w-full px-6 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors disabled:opacity-50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                ارسال مجدد کد تایید
              </button>
            </form>
          )}

          {step === 'registration' && (
            <form onSubmit={handleRegistrationSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ایمیل *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رمز عبور *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-12"
                    minLength={6}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تکرار رمز عبور *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-12"
                    minLength={6}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  اطلاعات دعوت‌نامه:
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• شماره تلفن: {invitationData?.phone}</li>
                  <li>• نقش: {getRoleDisplayName(invitationData?.role || '')}</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Spinner size="small" />
                    <span className="mr-2">در حال ایجاد حساب...</span>
                  </>
                ) : (
                  'تکمیل ثبت‌نام'
                )}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <FaCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  حساب شما ایجاد شد!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  به زودی به داشبورد منتقل خواهید شد...
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    شما با نقش <strong>{getRoleDisplayName(invitationData?.role || '')}</strong> به سیستم اضافه شدید.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Spinner size="small" />
                <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">در حال انتقال...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function InvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری دعوت‌نامه...</p>
        </div>
      </div>
    }>
      <InvitationForm />
    </Suspense>
  );
} 
