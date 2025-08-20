 'use client';

import React from 'react';
import { TableStatus } from '../../../../../types/ordering';
import { FaUsers, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

interface TableData {
  id: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  status: TableStatus;
  section?: string;
  floor: number;
  currentOrder?: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
  } | null;
  nextReservation?: {
    id: string;
    customerName: string;
    reservationDate: string;
    guestCount: number;
  } | null;
  isOccupied?: boolean;
  occupancyDuration?: number | null;
}

interface MobileTableCardProps {
  table: TableData;
  onStatusChange: (tableId: string, newStatus: TableStatus) => void;
  onTableClick: (table: TableData) => void;
}

export default function MobileTableCard({ table, onStatusChange, onTableClick }: MobileTableCardProps) {
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case TableStatus.OCCUPIED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case TableStatus.RESERVED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case TableStatus.CLEANING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case TableStatus.OUT_OF_ORDER:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return 'آزاد';
      case TableStatus.OCCUPIED:
        return 'مشغول';
      case TableStatus.RESERVED:
        return 'رزرو شده';
      case TableStatus.CLEANING:
        return 'در حال تمیزکاری';
      case TableStatus.OUT_OF_ORDER:
        return 'خارج از سرویس';
      default:
        return status;
    }
  };

  const getQuickActions = () => {
    const actions = [];

    if (table.status === TableStatus.AVAILABLE) {
      actions.push(
        <button
          key="occupy"
          onClick={() => onStatusChange(table.id, TableStatus.OCCUPIED)}
          className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex-1"
        >
          اشغال
        </button>,
        <button
          key="reserve"
          onClick={() => onStatusChange(table.id, TableStatus.RESERVED)}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-1"
        >
          رزرو
        </button>
      );
    } else if (table.status === TableStatus.OCCUPIED) {
      actions.push(
        <button
          key="cleaning"
          onClick={() => onStatusChange(table.id, TableStatus.CLEANING)}
          className="px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors flex-1"
        >
          تمیزکاری
        </button>
      );
    } else if (table.status === TableStatus.CLEANING) {
      actions.push(
        <button
          key="available"
          onClick={() => onStatusChange(table.id, TableStatus.AVAILABLE)}
          className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex-1"
        >
          آزاد کردن
        </button>
      );
    }

    if (table.status !== TableStatus.OUT_OF_ORDER) {
      actions.push(
        <button
          key="out-of-order"
          onClick={() => onStatusChange(table.id, TableStatus.OUT_OF_ORDER)}
          className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors flex-1"
        >
          خارج از سرویس
        </button>
      );
    } else {
      actions.push(
        <button
          key="activate"
          onClick={() => onStatusChange(table.id, TableStatus.AVAILABLE)}
          className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex-1"
        >
          فعال کردن
        </button>
      );
    }

    return actions;
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3 touch-manipulation"
      onClick={() => onTableClick(table)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {table.tableNumber}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              میز {table.tableNumber}
            </h3>
            {table.tableName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{table.tableName}</p>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
          {getStatusText(table.status)}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
          <FaUsers className="text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">ظرفیت:</span>
          <span className="font-medium text-gray-900 dark:text-white">{table.capacity} نفر</span>
        </div>
        
        {table.section && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
            <FaMapMarkerAlt className="text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">بخش:</span>
            <span className="font-medium text-gray-900 dark:text-white">{table.section}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
          <FaMapMarkerAlt className="text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">طبقه:</span>
          <span className="font-medium text-gray-900 dark:text-white">{table.floor}</span>
        </div>

        {table.currentOrder && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                سفارش فعلی
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {table.currentOrder.orderNumber}
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {table.currentOrder.customerName}
            </p>
            {table.occupancyDuration && (
              <div className="flex items-center space-x-1 rtl:space-x-reverse mt-1">
                <FaClock className="text-blue-500 text-xs" />
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {table.occupancyDuration} دقیقه
                </span>
              </div>
            )}
          </div>
        )}

        {table.nextReservation && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                رزرو بعدی
              </span>
              <span className="text-sm text-green-600 dark:text-green-400">
                {table.nextReservation.guestCount} نفر
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {table.nextReservation.customerName}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {new Date(table.nextReservation.reservationDate).toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 rtl:space-x-reverse">
        {getQuickActions()}
      </div>
    </div>
  );
}