'use client';

import { useState } from 'react';
import { 
  FaUsers, 
  FaPlus, 
  FaSms,
  FaCheck,
  FaClock,
  FaTimes
} from 'react-icons/fa';
import { SMSInvitationModal } from '../../../../components/SMSInvitationModal';
import { AlertBox } from '../../../../components/ui/AlertBox';

interface Invitation {
  id: string;
  recipientName: string;
  phoneNumber: string;
  businessName: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  inviteCode: string;
}

const SMSInvitationsPage = () => {
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([
    {
      id: '1',
      recipientName: 'علی احمدی',
      phoneNumber: '09123456789',
      businessName: 'کافه سِروان',
      sentAt: '1403/09/15 - 14:30',
      status: 'delivered',
      inviteCode: 'INV123456'
    },
    {
      id: '2',
      recipientName: 'مریم محمدی',
      phoneNumber: '09876543210',
      businessName: 'کافه سِروان',
      sentAt: '1403/09/14 - 10:15',
      status: 'sent',
      inviteCode: 'INV789012'
    },
    {
      id: '3',
      recipientName: 'حسین رضایی',
      phoneNumber: '09051305165',
      businessName: 'کافه سِروان',
      sentAt: '1403/09/13 - 16:45',
      status: 'failed',
      inviteCode: 'INV345678'
    }
  ]);
  const [success, setSuccess] = useState('');

  const handleInvitationSent = (phoneNumber: string, inviteCode: string) => {
    const newInvitation: Invitation = {
      id: Date.now().toString(),
      recipientName: 'کاربر جدید',
      phoneNumber,
      businessName: 'کافه سِروان',
      sentAt: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      inviteCode
    };
    
    setInvitations(prev => [newInvitation, ...prev]);
    setSuccess('دعوت‌نامه با موفقیت ارسال شد');
    setShowInvitationModal(false);
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(''), 5000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <FaCheck className="w-4 h-4 text-green-500" />;
      case 'sent':
        return <FaClock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <FaTimes className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <FaClock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FaClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'تحویل شده';
      case 'sent':
        return 'ارسال شده';
      case 'failed':
        return 'ناموفق';
      case 'pending':
        return 'در انتظار';
      default:
        return 'نامشخص';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const stats = {
    total: invitations.length,
    delivered: invitations.filter(i => i.status === 'delivered').length,
    sent: invitations.filter(i => i.status === 'sent').length,
    failed: invitations.filter(i => i.status === 'failed').length,
    pending: invitations.filter(i => i.status === 'pending').length
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <FaUsers className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                مدیریت دعوت‌نامه‌ها
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                ارسال و پیگیری دعوت‌نامه‌های کارمندان جدید
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowInvitationModal(true)}
            className="btn btn-primary"
          >
            <FaPlus className="w-4 h-4 ml-2" />
            دعوت جدید
          </button>
        </div>
      </div>

      {success && <AlertBox type="success" message={success} />}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                کل دعوت‌نامه‌ها
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total.toLocaleString('fa-IR')}
              </p>
            </div>
            <FaSms className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                تحویل شده
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.delivered.toLocaleString('fa-IR')}
              </p>
            </div>
            <FaCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ارسال شده
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.sent.toLocaleString('fa-IR')}
              </p>
            </div>
            <FaClock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                در انتظار
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending.toLocaleString('fa-IR')}
              </p>
            </div>
            <FaClock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ناموفق
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.failed.toLocaleString('fa-IR')}
              </p>
            </div>
            <FaTimes className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Invitations List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            لیست دعوت‌نامه‌ها
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            مدیریت و پیگیری وضعیت دعوت‌نامه‌های ارسالی
          </p>
        </div>

        {invitations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    مخاطب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    شماره تلفن
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    کسب‌وکار
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تاریخ ارسال
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    کد دعوت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {invitation.recipientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white" dir="ltr">
                        {invitation.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {invitation.businessName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {invitation.sentAt}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {getStatusIcon(invitation.status)}
                        <span className="mr-1">{getStatusText(invitation.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 dark:text-white">
                        {invitation.inviteCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {invitation.status === 'failed' && (
                          <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            ارسال مجدد
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                          جزئیات
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FaUsers className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              هنوز دعوت‌نامه‌ای ارسال نشده
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              برای شروع، دعوت‌نامه جدیدی ایجاد کنید
            </p>
            <button
              onClick={() => setShowInvitationModal(true)}
              className="btn btn-primary"
            >
              <FaPlus className="w-4 h-4 ml-2" />
              اولین دعوت‌نامه
            </button>
          </div>
        )}
      </div>

      {/* SMS Invitation Modal */}
      <SMSInvitationModal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        onInvitationSent={handleInvitationSent}
      />
    </div>
  );
};

export default SMSInvitationsPage; 