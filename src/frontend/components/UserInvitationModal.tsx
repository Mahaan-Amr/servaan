import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';
import { AlertBox } from './ui/AlertBox';
import { User } from '../types';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import * as smsService from '../services/smsService';
import axios from 'axios';
import { FaUserPlus, FaSms, FaCheck, FaPhone } from 'react-icons/fa';

interface UserInvitationModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  editingUser?: User | null;
}

interface InvitationFormData {
  phoneNumber: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
}

export const UserInvitationModal: React.FC<UserInvitationModalProps> = ({
  isOpen,
  onClose,
  editingUser = null
}) => {
  const { tenant } = useTenant();
  const { isAdmin, isManager } = useAuth();
  
  // For editing existing users
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'STAFF'
  });

  // For inviting new users
  const [invitationData, setInvitationData] = useState<InvitationFormData>({
    phoneNumber: '',
    role: 'STAFF'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; formatted?: string; error?: string }>({ isValid: false });
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        // Editing existing user
        setUserFormData({
          name: editingUser.name || '',
          email: editingUser.email || '',
          password: '',
          phoneNumber: editingUser.phoneNumber || '',
          role: editingUser.role || 'STAFF'
        });
      } else {
        // Inviting new user
        setInvitationData({
          phoneNumber: '',
          role: 'STAFF'
        });
      }
      setError('');
      setSuccess('');
      setStep('form');
      setPhoneValidation({ isValid: false });
    }
  }, [isOpen, editingUser]);

  // Real-time phone number validation for invitations
  useEffect(() => {
    if (!editingUser && invitationData.phoneNumber) {
      const validation = smsService.validateIranianPhoneNumber(invitationData.phoneNumber);
      setPhoneValidation(validation);
    } else if (!editingUser) {
      setPhoneValidation({ isValid: false });
    }
  }, [invitationData.phoneNumber, editingUser]);

  const handleInvitationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvitationData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInvitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'شماره تلفن معتبر نیست');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate invitation link
      const invitationCode = Math.random().toString(36).substring(2, 15);
      const invitationLink = `${window.location.origin}/invitation?code=${invitationCode}&phone=${encodeURIComponent(phoneValidation.formatted!)}&role=${invitationData.role}`;
      
      // Always send SMS - we've configured the backend to handle development vs production mode
      // The backend will decide whether to send real SMS or simulate based on its own config
      
      // Send SMS invitation (real SMS enabled or production mode)
      await smsService.sendBusinessInvitation({
        phoneNumber: phoneValidation.formatted!,
        businessName: tenant?.displayName || 'شرکت',
        invitationLink,
        role: invitationData.role,
        forceRealSMS: true // Force real SMS to be sent
      });

      setSuccess('دعوت‌نامه با موفقیت ارسال شد');
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال دعوت‌نامه');
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userFormData.name || !userFormData.email) {
      setError('نام و ایمیل الزامی است');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Prepare user data
      const submitData = { ...userFormData };
      if (!submitData.password) {
        delete (submitData as { password?: string }).password;
      }

      await axios.put(`${apiUrl}/users/${editingUser!.id}`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('کاربر با موفقیت بروزرسانی شد');
      
      // Close after a brief delay
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'خطا در بروزرسانی کاربر');
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

  if (!isOpen) return null;

  return (
    <Modal
      title={editingUser ? 'ویرایش کاربر' : 'دعوت کاربر جدید'}
      onClose={() => onClose()}
      size="medium"
    >
      <div className="space-y-6">
        {step === 'form' && (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                {editingUser ? (
                  <FaUserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                ) : (
                  <FaSms className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {editingUser ? 'ویرایش اطلاعات کاربر' : 'ارسال دعوت‌نامه'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {editingUser 
                  ? 'اطلاعات کاربر را ویرایش کنید'
                  : 'شماره تلفن و نقش کاربر جدید را وارد کنید'
                }
              </p>
            </div>

            {error && <AlertBox type="error" message={error} />}
            {success && <AlertBox type="success" message={success} />}

            {editingUser ? (
              // Edit existing user form
              <form onSubmit={handleUserUpdateSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userFormData.name}
                    onChange={handleUserInputChange}
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
                    value={userFormData.email}
                    onChange={handleUserInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رمز عبور (در صورت تغییر پر شود)
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={userFormData.password}
                    onChange={handleUserInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره تلفن همراه
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={userFormData.phoneNumber}
                    onChange={handleUserInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="09051305165"
                    dir="ltr"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نقش کاربر *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={userFormData.role}
                    onChange={handleUserInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={loading}
                  >
                    {isAdmin() && <option value="ADMIN">مدیر سیستم</option>}
                    {(isAdmin() || isManager()) && <option value="MANAGER">مدیر</option>}
                    <option value="STAFF">کارمند</option>
                  </select>
                </div>

                <div className="flex justify-between space-x-3 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => onClose()}
                    disabled={loading}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Spinner size="small" />
                        <span className="mr-2">در حال بروزرسانی...</span>
                      </>
                    ) : (
                      'بروزرسانی کاربر'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Invite new user form
              <form onSubmit={handleInvitationSubmit} className="space-y-4">
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره تلفن همراه *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={invitationData.phoneNumber}
                      onChange={handleInvitationInputChange}
                      className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        invitationData.phoneNumber && phoneValidation.isValid 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : invitationData.phoneNumber && !phoneValidation.isValid 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                          : 'border-gray-300'
                      }`}
                      placeholder="09051305165"
                      required
                      dir="ltr"
                      disabled={loading}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      {invitationData.phoneNumber && phoneValidation.isValid ? (
                        <FaCheck className="w-5 h-5 text-green-500" />
                      ) : (
                        <FaPhone className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {invitationData.phoneNumber && phoneValidation.error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {phoneValidation.error}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    مثال: 09051305165 یا +989051305165
                  </p>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نقش کاربر *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={invitationData.role}
                    onChange={handleInvitationInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={loading}
                  >
                    {isAdmin() && <option value="ADMIN">مدیر سیستم</option>}
                    {(isAdmin() || isManager()) && <option value="MANAGER">مدیر</option>}
                    <option value="STAFF">کارمند</option>
                  </select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    نحوه کار دعوت‌نامه:
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• پیامک حاوی لینک ثبت‌نام به شماره ارسال می‌شود</li>
                    <li>• کاربر روی لینک کلیک کرده و اطلاعات خود را وارد می‌کند</li>
                    <li>• نقش {getRoleDisplayName(invitationData.role)} به کاربر اختصاص داده می‌شود</li>
                  </ul>
                </div>

                <div className="flex justify-between space-x-3 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => onClose()}
                    disabled={loading}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !phoneValidation.isValid}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Spinner size="small" />
                        <span className="mr-2">در حال ارسال...</span>
                      </>
                    ) : (
                      <>
                        <FaSms className="w-4 h-4 ml-2" />
                        <span>ارسال دعوت‌نامه</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <FaCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                دعوت‌نامه ارسال شد!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                پیامک حاوی لینک ثبت‌نام به شماره {phoneValidation.formatted} ارسال شد
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  کاربر پس از کلیک روی لینک و تکمیل اطلاعات، با نقش <strong>{getRoleDisplayName(invitationData.role)}</strong> به سیستم اضافه خواهد شد.
                </p>
              </div>
            </div>

            <button
              onClick={() => onClose(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              بستن
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}; 