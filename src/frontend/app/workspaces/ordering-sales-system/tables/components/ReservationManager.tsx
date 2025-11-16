'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaClock, FaUsers, FaPhone, FaTrash, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { TableService, CreateReservationRequest } from '@/services/orderingService';
import { TableReservation, Table } from '@/types/ordering';
import { formatDate, toInputDateFormat } from '@/utils/dateUtils';
import { FarsiDatePicker } from '@/components/ui/FarsiDatePicker';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import toast from 'react-hot-toast';
import { ReservationCalendar } from './ReservationCalendar';

interface ReservationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: Table;
  onReservationCreated?: () => void;
}

interface ReservationFormData {
  tableId: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationDate: string;
  reservationTime: string;
  duration: number;
  notes: string;
}

export const ReservationManager: React.FC<ReservationManagerProps> = ({
  isOpen,
  onClose,
  selectedTable,
  onReservationCreated
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'calendar' | 'form' | 'list'>('calendar');
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ReservationFormData>({
    tableId: '',
    customerName: '',
    customerPhone: '',
    guestCount: 2,
    reservationDate: '',
    reservationTime: '',
    duration: 120,
    notes: ''
  });

  // Initialize form with selected table
  const initializeForm = useCallback(() => {
    if (selectedTable) {
      setFormData(prev => ({
        ...prev,
        tableId: selectedTable.id,
        reservationDate: toInputDateFormat(new Date()),
        reservationTime: '18:00'
      }));
    }
  }, [selectedTable]);

  // Load reservations
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await TableService.getReservations({
        date: new Date().toISOString().split('T')[0]
      });
      setReservations(response as TableReservation[]);
    } catch (error: unknown) {
      console.error('Error loading reservations:', error);
      setError('خطا در بارگذاری رزروها');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize component
  useEffect(() => {
    if (isOpen) {
      loadTables();
      loadReservations();
      initializeForm();
    }
  }, [isOpen, selectedTable, initializeForm, loadReservations]);

  // Load tables
  const loadTables = async () => {
    try {
      const response = await TableService.getTables();
      setTables(response as Table[]);
    } catch (error) {
      console.error('Error loading tables:', error);
      setError('خطا در بارگذاری میزها');
    }
  };

  // Handle form field changes
  const handleFormChange = (field: keyof ReservationFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.tableId) {
      setError('لطفاً میز را انتخاب کنید');
      return false;
    }
    if (!formData.customerName.trim()) {
      setError('لطفاً نام مشتری را وارد کنید');
      return false;
    }
    if (!formData.customerPhone.trim()) {
      setError('لطفاً شماره تلفن را وارد کنید');
      return false;
    }
    if (formData.guestCount < 1) {
      setError('تعداد مهمان باید حداقل ۱ نفر باشد');
      return false;
    }
    if (!formData.reservationDate) {
      setError('لطفاً تاریخ رزرو را انتخاب کنید');
      return false;
    }
    if (!formData.reservationTime) {
      setError('لطفاً ساعت رزرو را انتخاب کنید');
      return false;
    }

    // Check for conflicts
    const reservationDateTime = new Date(`${formData.reservationDate}T${formData.reservationTime}`);
    const conflictingReservation = reservations.find(reservation => {
      if (reservation.tableId === formData.tableId && reservation.status !== 'CANCELLED') {
        const existingDateTime = new Date(reservation.reservationDate);
        const timeDiff = Math.abs(reservationDateTime.getTime() - existingDateTime.getTime());
        return timeDiff < (formData.duration + reservation.duration) * 60 * 1000;
      }
      return false;
    });

    if (conflictingReservation) {
      setError('این میز در زمان انتخاب شده رزرو شده است');
      return false;
    }

    setError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const reservationDateTime = new Date(`${formData.reservationDate}T${formData.reservationTime}`);
      
      const reservationData: CreateReservationRequest = {
        tableId: formData.tableId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        guestCount: formData.guestCount,
        reservationDate: reservationDateTime.toISOString(),
        duration: formData.duration,
        notes: formData.notes
      };

      await TableService.createReservation(reservationData);
      
      toast.success('رزرو با موفقیت ایجاد شد');
      resetForm();
      loadReservations();
      onReservationCreated?.();
    } catch (error: unknown) {
      console.error('Error creating reservation:', error);
      setError('خطا در ایجاد رزرو');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      tableId: selectedTable?.id || '',
      customerName: '',
      customerPhone: '',
      guestCount: 2,
      reservationDate: toInputDateFormat(new Date()),
      reservationTime: '18:00',
      duration: 120,
      notes: ''
    });
    setError('');
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'تأیید شده', color: 'bg-green-100 text-green-800' };
      case 'CANCELLED':
        return { label: 'لغو شده', color: 'bg-red-100 text-red-800' };
      case 'COMPLETED':
        return { label: 'تکمیل شده', color: 'bg-blue-100 text-blue-800' };
      case 'NO_SHOW':
        return { label: 'حضور نیافت', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="مدیریت رزرو میز"
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'calendar'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaCalendarAlt className="inline ml-2" />
            تقویم
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'form'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaPlus className="inline ml-2" />
            رزرو جدید
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FaClock className="inline ml-2" />
            لیست رزروها
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                تقویم رزروها
              </h3>
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaCalendarAlt className="inline ml-2" />
                باز کردن تقویم کامل
              </button>
            </div>

            <div className="text-center py-8">
              <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                برای مشاهده تقویم کامل رزروها، روی دکمه بالا کلیک کنید
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                تقویم شامل نمایش ماهانه، هفتگی و روزانه با قابلیت رزرو سریع است
              </p>
            </div>
          </div>
        )}

        {/* Reservation Form */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Table Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  انتخاب میز *
                </label>
                <select
                  value={formData.tableId}
                  onChange={(e) => handleFormChange('tableId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">انتخاب کنید</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      میز {table.tableNumber} - {table.capacity} نفر
                    </option>
                  ))}
                </select>
              </div>

              {/* Guest Count */}
              <div>
                <FormattedNumberInput
                  label="تعداد مهمان *"
                  value={formData.guestCount}
                  onChange={(value: string) => handleFormChange('guestCount', parseInt(value) || 1)}
                  placeholder="تعداد مهمان"
                  min={1}
                  max={20}
                  allowDecimals={false}
                  required
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام مشتری *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleFormChange('customerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره تلفن *
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Reservation Date */}
              <div>
                <FarsiDatePicker
                  label="تاریخ رزرو *"
                  value={formData.reservationDate}
                  onChange={(value: string) => handleFormChange('reservationDate', value)}
                  placeholder="تاریخ رزرو را انتخاب کنید"
                />
              </div>

              {/* Reservation Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ساعت رزرو *
                </label>
                <input
                  type="time"
                  value={formData.reservationTime}
                  onChange={(e) => handleFormChange('reservationTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مدت رزرو (دقیقه)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleFormChange('duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value={60}>۱ ساعت</option>
                  <option value={90}>۱.۵ ساعت</option>
                  <option value={120}>۲ ساعت</option>
                  <option value={150}>۲.۵ ساعت</option>
                  <option value={180}>۳ ساعت</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                یادداشت
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="توضیحات اضافی..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 rtl:space-x-reverse">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'در حال ایجاد...' : 'ایجاد رزرو'}
              </button>
            </div>
          </form>
        )}

        {/* Reservation List */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                لیست رزروها
              </h3>
              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaPlus className="inline ml-2" />
                رزرو جدید
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8">
                <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">هیچ رزروی یافت نشد</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {reservations.map((reservation) => {
                  const statusInfo = getStatusInfo(reservation.status);
                  const table = tables.find(t => t.id === reservation.tableId);
                  
                  return (
                    <div
                      key={reservation.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {reservation.customerName}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <FaPhone className="ml-2" />
                              {reservation.customerPhone}
                            </div>
                            <div className="flex items-center">
                              <FaUsers className="ml-2" />
                              {reservation.guestCount} نفر
                            </div>
                            <div className="flex items-center">
                              <FaCalendarAlt className="ml-2" />
                              {formatDate(reservation.reservationDate)}
                            </div>
                            <div className="flex items-center">
                              <FaClock className="ml-2" />
                              {reservation.duration} دقیقه
                            </div>
                          </div>
                          
                          {table && (
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              میز {table.tableNumber} - {table.capacity} نفر
                            </div>
                          )}
                          
                          {reservation.notes && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              {reservation.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => {
                              // Handle status change - placeholder for now
                              toast.success('وضعیت رزرو تغییر کرد');
                            }}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg dark:hover:bg-green-900/20"
                            title="تکمیل"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => {
                              // Handle cancellation - placeholder for now
                              toast.success('رزرو لغو شد');
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg dark:hover:bg-red-900/20"
                            title="لغو"
                          >
                            <FaTimes />
                          </button>
                          <button
                            onClick={() => {
                              // Handle deletion - placeholder for now
                              if (confirm('آیا از حذف این رزرو اطمینان دارید؟')) {
                                toast.success('رزرو حذف شد');
                              }
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reservation Calendar Modal */}
      {isCalendarOpen && (
        <ReservationCalendar
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          selectedTable={selectedTable}
          onReservationCreated={() => {
            loadReservations();
            onReservationCreated?.();
          }}
        />
      )}
    </Modal>
  );
}; 