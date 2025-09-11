'use client';

import { useState, useRef } from 'react';
import { 
  FaBullhorn, 
  FaPlus, 
  FaTrash, 
  FaFileUpload,
  FaEye,
  FaPaperPlane,
  FaUsers,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { AlertBox } from '../../../../components/ui/AlertBox';
import { Spinner } from '../../../../components/ui/Spinner';
import { Modal } from '../../../../components/ui/Modal';
import * as smsService from '../../../../services/smsService';

interface Recipient {
  id: string;
  phoneNumber: string;
  name?: string;
  isValid: boolean;
  error?: string;
}

const BulkSMSPage = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ phoneNumber: '', name: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addRecipient = () => {
    if (!newRecipient.phoneNumber.trim()) return;

    const validation = smsService.validateIranianPhoneNumber(newRecipient.phoneNumber);
    const recipient: Recipient = {
      id: Date.now().toString(),
      phoneNumber: newRecipient.phoneNumber,
      name: newRecipient.name || undefined,
      isValid: validation.isValid,
      error: validation.error
    };

    setRecipients(prev => [...prev, recipient]);
    setNewRecipient({ phoneNumber: '', name: '' });
  };

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());
      
      const newRecipients: Recipient[] = lines.map((line, index) => {
        const parts = line.split(',').map(part => part.trim());
        const phoneNumber = parts[0];
        const name = parts[1] || undefined;
        
        const validation = smsService.validateIranianPhoneNumber(phoneNumber);
        
        return {
          id: `upload-${Date.now()}-${index}`,
          phoneNumber,
          name,
          isValid: validation.isValid,
          error: validation.error
        };
      });

      setRecipients(prev => [...prev, ...newRecipients]);
    };

    reader.readAsText(file);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAllRecipients = () => {
    const updatedRecipients = recipients.map(recipient => {
      const validation = smsService.validateIranianPhoneNumber(recipient.phoneNumber);
      return {
        ...recipient,
        isValid: validation.isValid,
        error: validation.error
      };
    });
    setRecipients(updatedRecipients);
  };

  const getValidRecipients = () => {
    return recipients.filter(r => r.isValid);
  };

  const getInvalidRecipients = () => {
    return recipients.filter(r => !r.isValid);
  };

  const handleSendBulkSMS = async () => {
    const validRecipients = getValidRecipients();
    
    if (validRecipients.length === 0) {
      setError('هیچ شماره معتبری وجود ندارد');
      return;
    }

    if (!message.trim()) {
      setError('متن پیامک الزامی است');
      return;
    }

    if (validRecipients.length > 50) {
      setError('حداکثر ۵۰ شماره در هر درخواست مجاز است');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const phoneNumbers = validRecipients.map(r => r.phoneNumber);
      
      await smsService.sendBulkSMS({
        phoneNumbers,
        message: message.trim()
      });

      setSuccess(`پیامک با موفقیت به ${phoneNumbers.length} شماره ارسال شد`);
      setShowPreview(false);
      
      // Clear form after successful send
      setRecipients([]);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال پیامک‌های گروهی');
    } finally {
      setLoading(false);
    }
  };

  const messageLength = message.length;
  const smsCount = Math.ceil(messageLength / 70); // Persian SMS limit
  const validCount = getValidRecipients().length;
  const invalidCount = getInvalidRecipients().length;
  const totalCost = validCount * smsCount;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <FaBullhorn className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                ارسال گروهی پیامک
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                ارسال پیامک به چندین مخاطب به‌طور همزمان
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <AlertBox type="error" message={error} />}
      {success && <AlertBox type="success" message={success} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recipients Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Recipients */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                مخاطبین
              </h3>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline btn-sm"
                >
                  <FaFileUpload className="w-4 h-4 ml-1" />
                  بارگذاری فایل
                </button>
                <button
                  onClick={validateAllRecipients}
                  className="btn btn-outline btn-sm"
                >
                  <FaCheck className="w-4 h-4 ml-1" />
                  بررسی همه
                </button>
              </div>
            </div>

            {/* Add New Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 sm:mb-4">
              <input
                type="tel"
                placeholder="شماره تلفن (09xxxxxxxx)"
                value={newRecipient.phoneNumber}
                onChange={(e) => setNewRecipient(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="form-input"
                dir="ltr"
              />
              <input
                type="text"
                placeholder="نام (اختیاری)"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                className="form-input"
              />
              <button
                onClick={addRecipient}
                className="btn btn-primary"
                disabled={!newRecipient.phoneNumber.trim()}
              >
                <FaPlus className="w-4 h-4 ml-1" />
                افزودن
              </button>
            </div>

            {/* Recipients List */}
            {recipients.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    لیست مخاطبین ({recipients.length})
                  </span>
                  <button
                    onClick={() => setRecipients([])}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    پاک کردن همه
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        recipient.isValid
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                          : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {recipient.isValid ? (
                            <FaCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <FaTimes className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white" dir="ltr">
                            {recipient.phoneNumber}
                          </span>
                          {recipient.name && (
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              ({recipient.name})
                            </span>
                          )}
                        </div>
                        {recipient.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {recipient.error}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeRecipient(recipient.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recipients.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaUsers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>هنوز مخاطبی اضافه نشده است</p>
                <p className="text-sm">شماره تلفن وارد کنید یا فایل بارگذاری کنید</p>
              </div>
            )}
          </div>

          {/* Message Composition */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              متن پیامک
            </h3>
            
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="متن پیامک خود را اینجا بنویسید..."
              className="form-input min-h-[120px] resize-none"
              maxLength={500}
            />
            
            <div className="flex items-center justify-between mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span>
                {messageLength}/500 کاراکتر
              </span>
              <span>
                {smsCount} پیامک
              </span>
            </div>
          </div>
        </div>

        {/* Summary and Actions */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              خلاصه ارسال
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">کل مخاطبین:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {recipients.length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">معتبر:</span>
                <span className="font-medium text-green-600">
                  {validCount}
                </span>
              </div>
              
              {invalidCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">نامعتبر:</span>
                  <span className="font-medium text-red-600">
                    {invalidCount}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">تعداد پیامک:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {smsCount}
                </span>
              </div>
              
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">کل هزینه:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {totalCost.toLocaleString('fa-IR')} پیامک
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="space-y-3">
              <button
                onClick={() => setShowPreview(true)}
                disabled={validCount === 0 || !message.trim()}
                className="btn btn-outline w-full text-sm"
              >
                <FaEye className="w-4 h-4 ml-2" />
                پیش‌نمایش
              </button>
              
              <button
                onClick={handleSendBulkSMS}
                disabled={validCount === 0 || !message.trim() || loading}
                className="btn btn-primary w-full text-sm"
              >
                {loading ? (
                  <Spinner size="small" />
                ) : (
                  <>
                    <FaPaperPlane className="w-4 h-4 ml-2" />
                    ارسال گروهی
                  </>
                )}
              </button>
            </div>
            
            {validCount > 50 && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  حداکثر ۵۰ شماره در هر درخواست مجاز است
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <Modal
          title="پیش‌نمایش ارسال گروهی"
          onClose={() => setShowPreview(false)}
          size="large"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                متن پیامک:
              </h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {message}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                مخاطبین ({validCount}):
              </h4>
              <div className="max-h-40 overflow-y-auto">
                {getValidRecipients().map((recipient) => (
                  <div key={recipient.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300" dir="ltr">
                      {recipient.phoneNumber}
                    </span>
                    {recipient.name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {recipient.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-outline"
              >
                انصراف
              </button>
              <button
                onClick={handleSendBulkSMS}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <Spinner size="small" />
                ) : (
                  <>
                    <FaPaperPlane className="w-4 h-4 ml-2" />
                    تأیید و ارسال
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BulkSMSPage; 