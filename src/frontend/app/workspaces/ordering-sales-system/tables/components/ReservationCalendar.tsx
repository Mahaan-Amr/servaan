'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaDownload, 
  FaPrint, 
  FaEye, 
  FaEyeSlash,
  FaTrash,
  FaExclamationTriangle,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { TableService } from '@/services/orderingService';
import { TableReservation, Table } from '@/types/ordering';
import { formatDate } from '@/utils/dateUtils';
import toast from 'react-hot-toast';

interface ReservationCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: Table;
  onReservationCreated?: () => void;
}

interface CalendarView {
  type: 'month' | 'week' | 'day';
  label: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  time: string;
  isAvailable: boolean;
  reservations: TableReservation[];
}

interface DayData {
  date: Date;
  dayOfWeek: string;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  reservations: TableReservation[];
  timeSlots: TimeSlot[];
}

interface CalendarData {
  currentDate: Date;
  viewType: 'month' | 'week' | 'day';
  days: DayData[];
  selectedDate?: Date;
  selectedTimeSlot?: TimeSlot;
}

export const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  isOpen,
  onClose,
  onReservationCreated
}) => {
  // State management
  const [calendarData, setCalendarData] = useState<CalendarData>({
    currentDate: new Date(),
    viewType: 'month',
    days: []
  });
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showConflicts, setShowConflicts] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<TableReservation | null>(null);
  const [isQuickReservationModalOpen, setIsQuickReservationModalOpen] = useState(false);

  // Calendar view options
  const viewOptions: CalendarView[] = [
    { type: 'month', label: 'ماهانه' },
    { type: 'week', label: 'هفتگی' },
    { type: 'day', label: 'روزانه' }
  ];

  // Time slots configuration
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          hour,
          minute,
          time,
          isAvailable: true,
          reservations: []
        });
      }
    }
    return slots;
  }, []);

  // Load reservations for calendar
  const loadReservations = useCallback(async (startDate: Date) => {
    try {
      setLoading(true);
      const response = await TableService.getReservations({
        date: startDate.toISOString().split('T')[0]
      });
      setReservations(response as TableReservation[]);
    } catch (error: unknown) {
      console.error('Error loading reservations:', error);
      setError('خطا در بارگذاری رزروها');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tables
  const loadTables = useCallback(async () => {
    try {
      const response = await TableService.getTables();
      setTables(response as Table[]);
    } catch (error) {
      console.error('Error loading tables:', error);
      setError('خطا در بارگذاری میزها');
    }
  }, []);

  // Generate calendar data
  const generateCalendarData = useCallback((currentDate: Date, viewType: 'month' | 'week' | 'day'): DayData[] => {
    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (viewType === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayOfWeek = currentDate.toLocaleDateString('fa-IR', { weekday: 'short' });
        const dayNumber = currentDate.getDate();
        const isToday = currentDate.getTime() === today.getTime();
        const isCurrentMonth = currentDate.getMonth() === month;
        
        // Filter reservations for this day
        const dayReservations = reservations.filter(reservation => {
          const reservationDate = new Date(reservation.reservationDate);
          return reservationDate.toDateString() === currentDate.toDateString();
        });

        // Generate time slots for this day
        const dayTimeSlots = timeSlots.map(slot => ({
          ...slot,
          reservations: dayReservations.filter(reservation => {
            const reservationTime = new Date(reservation.reservationDate);
            const reservationHour = reservationTime.getHours();
            const reservationMinute = reservationTime.getMinutes();
            return reservationHour === slot.hour && Math.abs(reservationMinute - slot.minute) <= 30;
          })
        }));

        days.push({
          date: currentDate,
          dayOfWeek,
          dayNumber,
          isToday,
          isCurrentMonth,
          reservations: dayReservations,
          timeSlots: dayTimeSlots
        });
      }
    } else if (viewType === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        
        const dayOfWeek = currentDate.toLocaleDateString('fa-IR', { weekday: 'short' });
        const dayNumber = currentDate.getDate();
        const isToday = currentDate.getTime() === today.getTime();
        const isCurrentMonth = true;
        
        const dayReservations = reservations.filter(reservation => {
          const reservationDate = new Date(reservation.reservationDate);
          return reservationDate.toDateString() === currentDate.toDateString();
        });

        const dayTimeSlots = timeSlots.map(slot => ({
          ...slot,
          reservations: dayReservations.filter(reservation => {
            const reservationTime = new Date(reservation.reservationDate);
            const reservationHour = reservationTime.getHours();
            const reservationMinute = reservationTime.getMinutes();
            return reservationHour === slot.hour && Math.abs(reservationMinute - slot.minute) <= 30;
          })
        }));

        days.push({
          date: currentDate,
          dayOfWeek,
          dayNumber,
          isToday,
          isCurrentMonth,
          reservations: dayReservations,
          timeSlots: dayTimeSlots
        });
      }
    } else { // day view
      const dayDate = new Date(currentDate);
      const dayOfWeek = dayDate.toLocaleDateString('fa-IR', { weekday: 'short' });
      const dayNumber = dayDate.getDate();
      const isToday = dayDate.getTime() === today.getTime();
      const isCurrentMonth = true;
      
      const dayReservations = reservations.filter(reservation => {
        const reservationDate = new Date(reservation.reservationDate);
        return reservationDate.toDateString() === dayDate.toDateString();
      });

      const dayTimeSlots = timeSlots.map(slot => ({
        ...slot,
        reservations: dayReservations.filter(reservation => {
          const reservationTime = new Date(reservation.reservationDate);
          const reservationHour = reservationTime.getHours();
          const reservationMinute = reservationTime.getMinutes();
          return reservationHour === slot.hour && Math.abs(reservationMinute - slot.minute) <= 30;
        })
      }));

      days.push({
        date: dayDate,
        dayOfWeek,
        dayNumber,
        isToday,
        isCurrentMonth,
        reservations: dayReservations,
        timeSlots: dayTimeSlots
      });
    }

    return days;
  }, [reservations, timeSlots]);

  // Navigate calendar
  const navigateCalendar = useCallback((direction: 'prev' | 'next') => {
    setCalendarData(prev => {
      const newDate = new Date(prev.currentDate);
      
      if (prev.viewType === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else if (prev.viewType === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else { // day
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      }
      
      return {
        ...prev,
        currentDate: newDate,
        days: generateCalendarData(newDate, prev.viewType)
      };
    });
  }, [generateCalendarData]);

  // Change view type
  const changeViewType = useCallback((viewType: 'month' | 'week' | 'day') => {
    setCalendarData(prev => ({
      ...prev,
      viewType,
      days: generateCalendarData(prev.currentDate, viewType)
    }));
  }, [generateCalendarData]);

  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    setCalendarData(prev => ({
      ...prev,
      selectedDate: date
    }));
  }, []);

  // Handle time slot selection
  const handleTimeSlotSelect = useCallback((timeSlot: TimeSlot) => {
    setCalendarData(prev => ({
      ...prev,
      selectedTimeSlot: timeSlot
    }));
    setIsQuickReservationModalOpen(true);
  }, []);

  // Handle reservation selection
  const handleReservationSelect = useCallback((reservation: TableReservation) => {
    setSelectedReservation(reservation);
  }, []);

  // Quick reservation creation
  const handleQuickReservation = useCallback(async (reservationData: {
    tableId: string;
    customerName: string;
    customerPhone: string;
    guestCount: number;
    notes?: string;
  }) => {
    if (!calendarData.selectedDate || !calendarData.selectedTimeSlot) return;

    try {
      const reservationDate = new Date(calendarData.selectedDate);
      reservationDate.setHours(calendarData.selectedTimeSlot.hour, calendarData.selectedTimeSlot.minute);

      await TableService.createReservation({
        ...reservationData,
        reservationDate: reservationDate.toISOString(),
        duration: 120
      });

      toast.success('رزرو با موفقیت ایجاد شد');
      setIsQuickReservationModalOpen(false);
      onReservationCreated?.();
      
      // Reload reservations
      const startDate = new Date(calendarData.currentDate);
      startDate.setDate(startDate.getDate() - 7);
      await loadReservations(startDate);
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('خطا در ایجاد رزرو');
    }
  }, [calendarData.selectedDate, calendarData.selectedTimeSlot, calendarData.currentDate, onReservationCreated, loadReservations]);

  // Export calendar data
  const exportCalendar = useCallback(() => {
    const data = {
      viewType: calendarData.viewType,
      currentDate: calendarData.currentDate,
      reservations: reservations.map(r => ({
        id: r.id,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        guestCount: r.guestCount,
        reservationDate: r.reservationDate,
        duration: r.duration,
        status: r.status,
        notes: r.notes
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservations-${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [calendarData, reservations]);

  // Print calendar
  const printCalendar = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>تقویم رزروها - ${formatDate(calendarData.currentDate)}</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; }
              .calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
              .day { border: 1px solid #ccc; padding: 10px; min-height: 100px; }
              .day-header { font-weight: bold; text-align: center; margin-bottom: 5px; }
              .reservation { background: #e3f2fd; padding: 2px 4px; margin: 1px 0; font-size: 12px; }
              .today { background: #fff3e0; }
            </style>
          </head>
          <body>
            <h1>تقویم رزروها</h1>
            <div class="calendar">
              ${calendarData.days.map(day => `
                <div class="day ${day.isToday ? 'today' : ''}">
                  <div class="day-header">${day.dayOfWeek} ${day.dayNumber}</div>
                  ${day.reservations.map(reservation => `
                    <div class="reservation">
                      ${reservation.customerName} - ${formatDate(new Date(reservation.reservationDate))}
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [calendarData]);

  // Initialize component
  useEffect(() => {
    if (isOpen) {
      loadTables();
      const startDate = new Date(calendarData.currentDate);
      startDate.setDate(startDate.getDate() - 7);
      loadReservations(startDate);
    }
  }, [isOpen, calendarData.currentDate, loadTables, loadReservations]);

  // Update calendar data when reservations change
  useEffect(() => {
    setCalendarData(prev => ({
      ...prev,
      days: generateCalendarData(prev.currentDate, prev.viewType)
    }));
  }, [reservations, generateCalendarData]);

  if (!isOpen) return null;

  return (
    <Modal
      title="تقویم رزروها"
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        {/* Calendar Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => navigateCalendar('prev')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
            >
              <FaChevronLeft />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {calendarData.currentDate.toLocaleDateString('fa-IR', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </h2>
            
            <button
              onClick={() => navigateCalendar('next')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
            >
              <FaChevronRight />
            </button>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* View Type Selector */}
            <div className="flex border border-gray-300 rounded-lg dark:border-gray-600">
              {viewOptions.map((view) => (
                <button
                  key={view.type}
                  onClick={() => changeViewType(view.type)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    calendarData.viewType === view.type
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className={`p-2 rounded-lg transition-colors ${
                showConflicts 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
              title={showConflicts ? 'مخفی کردن تعارضات' : 'نمایش تعارضات'}
            >
              {showConflicts ? <FaEye /> : <FaEyeSlash />}
            </button>

            <button
              onClick={exportCalendar}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:hover:bg-blue-900/20"
              title="خروجی"
            >
              <FaDownload />
            </button>

            <button
              onClick={printCalendar}
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg dark:hover:bg-purple-900/20"
              title="چاپ"
            >
              <FaPrint />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
          </div>
        ) : (
          <div className="calendar-grid">
            {calendarData.viewType === 'month' && (
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(day => (
                  <div key={day} className="p-2 text-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {calendarData.days.map((day, index) => (
                  <div
                    key={index}
                    className={`p-2 border border-gray-200 dark:border-gray-700 min-h-[120px] cursor-pointer transition-colors ${
                      day.isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' : ''
                    } ${!day.isCurrentMonth ? 'opacity-50' : ''} hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => handleDateSelect(day.date)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${
                        day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day.dayNumber}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {day.dayOfWeek}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {day.reservations.slice(0, 3).map((reservation) => (
                        <div
                          key={reservation.id}
                          className="text-xs p-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReservationSelect(reservation);
                          }}
                        >
                          {reservation.customerName} - {new Date(reservation.reservationDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ))}
                      {day.reservations.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{day.reservations.length - 3} بیشتر
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {calendarData.viewType === 'week' && (
              <div className="grid grid-cols-8 gap-1">
                {/* Time Header */}
                <div className="p-2 text-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                  ساعت
                </div>
                
                {/* Day Headers */}
                {calendarData.days.map((day) => (
                  <div key={day.date.toISOString()} className="p-2 text-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                    <div>{day.dayOfWeek}</div>
                    <div className="text-sm">{day.dayNumber}</div>
                  </div>
                ))}
                
                {/* Time Slots */}
                {timeSlots.slice(0, 20).map((slot) => (
                  <React.Fragment key={slot.time}>
                    <div className="p-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      {slot.time}
                    </div>
                                         {calendarData.days.map((day) => {
                       const daySlot = day.timeSlots.find(s => s.time === slot.time);
                       const hasReservation = (daySlot?.reservations?.length || 0) > 0;
                       const hasConflict = showConflicts && (daySlot?.reservations?.length || 0) > 1;
                      
                      return (
                        <div
                          key={`${day.date.toISOString()}-${slot.time}`}
                          className={`p-1 min-h-[40px] border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
                            hasReservation ? 'bg-green-100 dark:bg-green-900/20' : ''
                          } ${hasConflict ? 'bg-red-100 dark:bg-red-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-800`}
                          onClick={() => handleTimeSlotSelect(slot)}
                        >
                          {daySlot?.reservations.map((reservation) => (
                            <div
                              key={reservation.id}
                              className="text-xs p-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded mb-1 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReservationSelect(reservation);
                              }}
                            >
                              {reservation.customerName}
                            </div>
                          ))}
                          {hasConflict && (
                            <div className="text-xs text-red-600 dark:text-red-400 flex items-center">
                              <FaExclamationTriangle className="ml-1" />
                              تعارض
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            )}

            {calendarData.viewType === 'day' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {calendarData.days[0]?.date.toLocaleDateString('fa-IR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                                     {timeSlots.map((slot) => {
                     const daySlot = calendarData.days[0]?.timeSlots.find(s => s.time === slot.time);
                     const hasReservation = (daySlot?.reservations?.length || 0) > 0;
                     const hasConflict = showConflicts && (daySlot?.reservations?.length || 0) > 1;
                    
                    return (
                      <div
                        key={slot.time}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          hasReservation ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
                        } ${hasConflict ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-800`}
                        onClick={() => handleTimeSlotSelect(slot)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {slot.time}
                          </span>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                                         {hasReservation && (
                               <span className="text-sm text-green-600 dark:text-green-400">
                                 {daySlot?.reservations?.length || 0} رزرو
                               </span>
                             )}
                             {hasConflict && (
                               <span className="text-sm text-red-600 dark:text-red-400 flex items-center">
                                 <FaExclamationTriangle className="ml-1" />
                                 تعارض
                               </span>
                             )}
                          </div>
                        </div>
                        
                        {daySlot?.reservations.map((reservation) => (
                          <div
                            key={reservation.id}
                            className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReservationSelect(reservation);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {reservation.customerName}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {reservation.guestCount} نفر
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {reservation.customerPhone}
                            </div>
                            {reservation.notes && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {reservation.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Reservation Modal */}
        {isQuickReservationModalOpen && (
          <QuickReservationModal
            isOpen={isQuickReservationModalOpen}
            onClose={() => setIsQuickReservationModalOpen(false)}
            tables={tables}
            selectedDate={calendarData.selectedDate}
            selectedTimeSlot={calendarData.selectedTimeSlot}
            onSubmit={handleQuickReservation}
          />
        )}

        {/* Reservation Details Modal */}
        {selectedReservation && (
          <ReservationDetailsModal
            reservation={selectedReservation}
            onClose={() => setSelectedReservation(null)}
            onUpdate={() => {
              setSelectedReservation(null);
              // Reload reservations
              const startDate = new Date(calendarData.currentDate);
              startDate.setDate(startDate.getDate() - 7);
              loadReservations(startDate);
            }}
          />
        )}
      </div>
    </Modal>
  );
};

// Quick Reservation Modal Component
interface QuickReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  selectedDate?: Date;
  selectedTimeSlot?: TimeSlot;
  onSubmit: (data: {
    tableId: string;
    customerName: string;
    customerPhone: string;
    guestCount: number;
    notes?: string;
  }) => void;
}

const QuickReservationModal: React.FC<QuickReservationModalProps> = ({
  isOpen,
  onClose,
  tables,
  selectedDate,
  selectedTimeSlot,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    tableId: '',
    customerName: '',
    customerPhone: '',
    guestCount: 2,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="رزرو سریع"
      onClose={onClose}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            تاریخ: {selectedDate?.toLocaleDateString('fa-IR')}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            ساعت: {selectedTimeSlot?.time}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              انتخاب میز *
            </label>
            <select
              value={formData.tableId}
              onChange={(e) => setFormData(prev => ({ ...prev, tableId: e.target.value }))}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تعداد مهمان *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.guestCount}
              onChange={(e) => setFormData(prev => ({ ...prev, guestCount: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نام مشتری *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              شماره تلفن *
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            یادداشت
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="توضیحات اضافی..."
          />
        </div>

        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ایجاد رزرو
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Reservation Details Modal Component
interface ReservationDetailsModalProps {
  reservation: TableReservation;
  onClose: () => void;
  onUpdate: () => void;
}

const ReservationDetailsModal: React.FC<ReservationDetailsModalProps> = ({
  reservation,
  onClose,
  onUpdate
}) => {
  const handleStatusChange = async () => {
    try {
      // TODO: Implement updateReservation method in TableService
      toast.success('وضعیت رزرو تغییر کرد');
      onUpdate();
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const handleDelete = async () => {
    if (confirm('آیا از حذف این رزرو اطمینان دارید؟')) {
      try {
        // TODO: Implement cancelReservation method in TableService
        toast.success('رزرو حذف شد');
        onUpdate();
      } catch (error) {
        console.error('Error deleting reservation:', error);
        toast.error('خطا در حذف رزرو');
      }
    }
  };

  return (
    <Modal
      title="جزئیات رزرو"
      onClose={onClose}
      size="medium"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نام مشتری
            </label>
            <p className="text-gray-900 dark:text-white">{reservation.customerName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              شماره تلفن
            </label>
            <p className="text-gray-900 dark:text-white">{reservation.customerPhone}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تعداد مهمان
            </label>
            <p className="text-gray-900 dark:text-white">{reservation.guestCount} نفر</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تاریخ و ساعت
            </label>
            <p className="text-gray-900 dark:text-white">
              {formatDate(new Date(reservation.reservationDate))}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              مدت رزرو
            </label>
            <p className="text-gray-900 dark:text-white">{reservation.duration} دقیقه</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              وضعیت
            </label>
            <span className={`px-2 py-1 text-xs rounded-full ${
              reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
              reservation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              reservation.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {reservation.status === 'CONFIRMED' ? 'تأیید شده' :
               reservation.status === 'CANCELLED' ? 'لغو شده' :
               reservation.status === 'COMPLETED' ? 'تکمیل شده' :
               reservation.status}
            </span>
          </div>
        </div>

        {reservation.notes && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              یادداشت
            </label>
            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {reservation.notes}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => handleStatusChange()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaCheck className="inline ml-2" />
            تکمیل
          </button>
                     <button
             onClick={() => handleStatusChange()}
             className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
           >
            <FaTimes className="inline ml-2" />
            لغو
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <FaTrash className="inline ml-2" />
            حذف
          </button>
        </div>
      </div>
    </Modal>
  );
}; 