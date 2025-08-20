import { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';
import { AlertBox } from './ui/AlertBox';
import * as smsService from '../services/smsService';
import { FaPhone, FaSms, FaCheck, FaArrowRight } from 'react-icons/fa';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (phoneNumber: string, verificationCode: string) => void;
  purpose?: string;
  title?: string;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete,
  purpose = 'registration',
  title = 'تایید شماره تلفن'
}) => {
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; formatted?: string; error?: string }>({ isValid: false });
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState<string>('');

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setVerificationCode('');
      setError('');
      setSuccess('');
      setPhoneValidation({ isValid: false });
      setTimer(0);
      setCanResend(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Timer for resend functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (timer === 0 && step === 'verification') {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer, step]);

  // Focus inputs when step changes
  useEffect(() => {
    if (step === 'phone' && phoneInputRef.current) {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    } else if (step === 'verification' && codeInputRef.current) {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Real-time phone number validation
  useEffect(() => {
    if (phoneNumber) {
      const validation = smsService.validateIranianPhoneNumber(phoneNumber);
      setPhoneValidation(validation);
    } else {
      setPhoneValidation({ isValid: false });
    }
  }, [phoneNumber]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'شماره تلفن معتبر نیست');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await smsService.sendVerificationCode({
        phoneNumber: phoneValidation.formatted!,
        purpose
      });

      setSuccess(result.message);
      setStep('verification');
      setTimer(120); // 2 minutes
      setCanResend(false);
      
      // Show verification code in development
      if (result.verificationCode) {
        console.log('Development verification code:', result.verificationCode);
        setSuccess(`${result.message} (کد: ${result.verificationCode})`);
        setDevelopmentCode(result.verificationCode); // Store for auto-fill
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('کد تایید باید 6 رقم باشد');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('شماره تلفن با موفقیت تایید شد');
      
      // Call the completion handler after a brief delay
      setTimeout(() => {
        onVerificationComplete(phoneValidation.formatted!, verificationCode);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'کد تایید صحیح نیست');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canResend || loading) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await smsService.sendVerificationCode({
        phoneNumber: phoneValidation.formatted!,
        purpose
      });

      setSuccess('کد تایید مجدداً ارسال شد');
      setTimer(120);
      setCanResend(false);
      
      if (result.verificationCode) {
        console.log('Development verification code:', result.verificationCode);
        setSuccess(`کد تایید مجدداً ارسال شد (کد: ${result.verificationCode})`);
        setDevelopmentCode(result.verificationCode); // Store for auto-fill
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال مجدد کد');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStep('phone');
    setVerificationCode('');
    setError('');
    setSuccess('');
  };

  const handleModalClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Development helper function
  const handleAutoFillCode = () => {
    if (developmentCode) {
      setVerificationCode(developmentCode);
      setError('');
    }
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <Modal 
      title={title} 
      onClose={handleModalClose} 
      size="medium" 
      disableClickOutside={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            {step === 'phone' ? (
              <FaPhone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <FaSms className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {step === 'phone' ? 'وارد کردن شماره تلفن' : 'وارد کردن کد تایید'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {step === 'phone' 
              ? 'شماره تلفن همراه خود را وارد کنید'
              : `کد 6 رقمی ارسال شده به ${phoneValidation.formatted} را وارد کنید`
            }
          </p>
        </div>

        {/* Alerts */}
        {error && <AlertBox type="error" message={error} />}
        {success && <AlertBox type="success" message={success} />}

        {/* Phone Input Step */}
        {step === 'phone' && (
          <div className="space-y-6">
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره تلفن همراه
                </label>
                <div className="relative">
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      phoneNumber && phoneValidation.isValid 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : phoneNumber && !phoneValidation.isValid 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300'
                    }`}
                    placeholder="09051305165"
                    required
                    dir="ltr"
                    disabled={loading}
                  />
                  {phoneNumber && phoneValidation.isValid && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <FaCheck className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {phoneNumber && phoneValidation.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {phoneValidation.error}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  مثال: 09051305165 یا +989051305165
                </p>
              </div>

              <div className="flex justify-between space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={loading}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading || !phoneValidation.isValid}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Spinner size="small" />
                      <span className="mr-2">در حال ارسال...</span>
                    </>
                  ) : (
                    <>
                      <span>ارسال کد تایید</span>
                      <FaArrowRight className="w-4 h-4 mr-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Verification Code Step */}
        {step === 'verification' && (
          <div className="space-y-6">
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  کد تایید
                </label>
                <input
                  ref={codeInputRef}
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 text-2xl text-center tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="- - - - - -"
                  maxLength={6}
                  required
                  dir="ltr"
                  disabled={loading}
                />
                
                {/* Development Mode Auto-Fill Button */}
                {process.env.NODE_ENV === 'development' && developmentCode && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleAutoFillCode}
                      className="w-full px-3 py-2 text-sm bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-900/30"
                    >
                      🧪 پر کردن خودکار کد (حالت توسعه)
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm">
                <div>
                  {timer > 0 ? (
                    <span className="text-gray-600 dark:text-gray-400">
                      ارسال مجدد تا {formatTimer(timer)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading || !canResend}
                      className="text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ارسال مجدد کد
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  disabled={loading}
                  className="text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50"
                >
                  تغییر شماره
                </button>
              </div>

              <div className="flex justify-between space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={loading}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Spinner size="small" />
                      <span className="mr-2">در حال تایید...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck className="w-4 h-4 ml-2" />
                      <span>تایید</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}; 