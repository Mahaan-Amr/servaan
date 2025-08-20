import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';
import { AlertBox } from './ui/AlertBox';
import { PhoneVerificationModal } from './PhoneVerificationModal';
import * as smsService from '../services/smsService';
import { useTenant } from '../contexts/TenantContext';
import { FaPaperPlane, FaUserPlus, FaCheck } from 'react-icons/fa';

interface SMSInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitationSent?: (phoneNumber: string, inviteCode: string) => void;
}

export const SMSInvitationModal: React.FC<SMSInvitationModalProps> = ({
  isOpen,
  onClose,
  onInvitationSent
}) => {
  const { tenant } = useTenant();
  const [step, setStep] = useState<'form' | 'verification' | 'success'>('form');
  const [formData, setFormData] = useState({
    recipientName: '',
    phoneNumber: '',
    businessName: tenant?.displayName || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setFormData({
        recipientName: '',
        phoneNumber: '',
        businessName: tenant?.displayName || ''
      });
      setError('');
      setSuccess('');
      setInviteCode('');
      setVerifiedPhone('');
    }
  }, [isOpen, tenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneVerification = () => {
    setShowPhoneVerification(true);
  };

  const handleVerificationComplete = (phoneNumber: string) => {
    setVerifiedPhone(phoneNumber);
    setFormData(prev => ({ ...prev, phoneNumber }));
    setShowPhoneVerification(false);
    setSuccess('شماره تلفن تایید شد');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phoneNumber) {
      setError('لطفاً شماره تلفن را وارد کنید');
      return;
    }

    if (!formData.businessName) {
      setError('نام کسب‌وکار الزامی است');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await smsService.sendBusinessInvitation({
        phoneNumber: formData.phoneNumber,
        recipientName: formData.recipientName || 'کاربر گرامی',
        businessName: formData.businessName
      });

      setInviteCode(result.inviteCode || '');
      setSuccess(result.message);
      setStep('success');

      if (onInvitationSent) {
        onInvitationSent(formData.phoneNumber, result.inviteCode || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال دعوت‌نامه');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnother = () => {
    setStep('form');
    setFormData({
      recipientName: '',
      phoneNumber: '',
      businessName: tenant?.displayName || ''
    });
    setError('');
    setSuccess('');
    setInviteCode('');
    setVerifiedPhone('');
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal title="دعوت از کارمند جدید" onClose={onClose} size="medium">
        <div className="space-y-6">
          {step === 'form' && (
            <>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <FaUserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  دعوت‌نامه‌ای برای پیوستن به تیم ارسال کنید
                </p>
              </div>

              {error && <AlertBox type="error" message={error} />}
              {success && <AlertBox type="success" message={success} />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="recipientName" className="form-label">
                    نام دریافت‌کننده (اختیاری)
                  </label>
                  <input
                    type="text"
                    id="recipientName"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="نام و نام خانوادگی"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="form-label">
                    شماره تلفن همراه *
                  </label>
                  <div className="flex space-x-2 space-x-reverse">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`form-input flex-1 ${
                        verifiedPhone === formData.phoneNumber 
                          ? 'border-green-500 focus:border-green-500' 
                          : ''
                      }`}
                      placeholder="09051305165"
                      required
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handlePhoneVerification}
                      className="btn btn-outline whitespace-nowrap"
                    >
                      {verifiedPhone === formData.phoneNumber ? (
                        <>
                          <FaCheck className="w-4 h-4 ml-1 text-green-500" />
                          تایید شده
                        </>
                      ) : (
                        'تایید شماره'
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    مثال: 09051305165 یا +989051305165
                  </p>
                </div>

                <div>
                  <label htmlFor="businessName" className="form-label">
                    نام کسب‌وکار *
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="نام کافه، رستوران یا مغازه"
                    required
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    پیام ارسالی:
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    سلام {formData.recipientName || '[نام]'}! شما به عنوان کارمند جدید 
                    در {formData.businessName || '[نام کسب‌وکار]'} دعوت شده‌اید. 
                    کد دعوت: [کد-تولیدی]. برای پیوستن به تیم از این لینک استفاده کنید.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-outline"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.phoneNumber || !formData.businessName}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <Spinner size="small" />
                    ) : (
                      <>
                        <FaPaperPlane className="w-4 h-4 ml-1" />
                        ارسال دعوت‌نامه
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <FaCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  دعوت‌نامه ارسال شد!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  دعوت‌نامه با موفقیت به شماره {formData.phoneNumber} ارسال شد
                </p>
              </div>

              {inviteCode && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    کد دعوت:
                  </p>
                  <div className="font-mono text-lg font-bold text-center p-2 bg-white dark:bg-gray-700 rounded border">
                    {inviteCode}
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-3 space-x-reverse">
                <button
                  onClick={onClose}
                  className="btn btn-outline"
                >
                  بستن
                </button>
                <button
                  onClick={handleSendAnother}
                  className="btn btn-primary"
                >
                  ارسال دعوت دیگر
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onVerificationComplete={handleVerificationComplete}
        purpose="invitation"
        title="تایید شماره تلفن برای دعوت"

      />
    </>
  );
}; 