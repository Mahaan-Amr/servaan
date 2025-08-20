'use client';

import React from 'react';
import Link from 'next/link';
import { Customer } from '../../../../../types/crm';

interface CustomerCardProps {
  customer: Customer;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  getSegmentBadgeColor: (segment: string) => string;
  getTierBadgeColor: (tier: string) => string;
  formatPhoneNumber: (phone: string) => string;
  formatDate: (dateString: string) => string;
}

export default function CustomerCard({
  customer,
  selected,
  onSelect,
  getSegmentBadgeColor,
  getTierBadgeColor,
  formatPhoneNumber,
  formatDate
}: CustomerCardProps) {
  // Calculate days since last visit
  const getDaysSinceLastVisit = (lastVisitDate?: string): string => {
    if (!lastVisitDate) return 'بدون بازدید';
    
    const lastVisit = new Date(lastVisitDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'دیروز';
    if (diffDays <= 7) return `${diffDays} روز پیش`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} هفته پیش`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} ماه پیش`;
    return `${Math.floor(diffDays / 365)} سال پیش`;
  };

  // Get tier progress percentage
  const getTierProgress = (tierLevel: string, currentPoints: number): number => {
    const tierThresholds = {
      'BRONZE': { min: 0, max: 1000 },
      'SILVER': { min: 1000, max: 5000 },
      'GOLD': { min: 5000, max: 15000 },
      'PLATINUM': { min: 15000, max: 50000 }
    };
    
    const threshold = tierThresholds[tierLevel as keyof typeof tierThresholds];
    if (!threshold) return 0;
    
    const progress = ((currentPoints - threshold.min) / (threshold.max - threshold.min)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Get visit frequency indicator
  const getVisitFrequencyColor = (totalVisits: number, daysSinceLastVisit: number): string => {
    if (daysSinceLastVisit <= 7) return 'text-green-600 dark:text-green-400';
    if (daysSinceLastVisit <= 30) return 'text-yellow-600 dark:text-yellow-400';
    if (daysSinceLastVisit <= 90) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const lastVisitDays = customer.loyalty?.lastVisitDate ? 
    Math.ceil((new Date().getTime() - new Date(customer.loyalty.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)) : 
    999;

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-all duration-200 ${
      selected ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-600 shadow-md' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 rtl:space-x-reverse flex-1">
          {/* Enhanced Selection checkbox */}
          <div className="flex items-center mt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-gray-300 text-pink-600 focus:ring-pink-500 focus:ring-2 transition-all"
            />
          </div>
          
          {/* Enhanced Customer avatar with status indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
              {customer.name.charAt(0)}
            </div>
            {/* Status indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
              customer.status === 'ACTIVE' ? 'bg-green-500' 
              : customer.status === 'INACTIVE' ? 'bg-yellow-500' 
              : 'bg-red-500'
            }`} />
          </div>

          {/* Enhanced Customer info */}
          <div className="flex-1 min-w-0">
            {/* Header with badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {customer.name}
              </h3>
              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getSegmentBadgeColor(customer.segment)}`}>
                {customer.segment}
              </span>
              {customer.loyalty && (
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getTierBadgeColor(customer.loyalty.tierLevel)}`}>
                  {customer.loyalty.tierLevel}
                </span>
              )}
              {customer.allowMarketing && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  تبلیغات
                </span>
              )}
            </div>
            
            {/* Enhanced grid layout with better spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {/* Contact info */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-mono text-sm">{formatPhoneNumber(customer.phone)}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
              </div>

              {/* Enhanced Loyalty info with progress */}
              {customer.loyalty && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">امتیازات فعلی</span>
                    <span className="text-xs text-gray-400">
                      {getTierProgress(customer.loyalty.tierLevel, customer.loyalty.currentPoints).toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {customer.loyalty.currentPoints.toLocaleString('fa-IR')}
                    </div>
                    {/* Tier progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          customer.loyalty.tierLevel === 'PLATINUM' ? 'bg-purple-500' :
                          customer.loyalty.tierLevel === 'GOLD' ? 'bg-yellow-500' :
                          customer.loyalty.tierLevel === 'SILVER' ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${getTierProgress(customer.loyalty.tierLevel, customer.loyalty.currentPoints)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {customer.loyalty.totalVisits.toLocaleString('fa-IR')} بازدید کل
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Visit stats with last visit */}
              <div className="space-y-2">
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium">آمار بازدید</div>
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {customer._count?.visits.toLocaleString('fa-IR') || '0'} بازدید
                  </div>
                  {customer.loyalty?.lastVisitDate && (
                    <div className={`text-xs font-medium ${getVisitFrequencyColor(customer.loyalty.totalVisits, lastVisitDays)}`}>
                      آخرین: {getDaysSinceLastVisit(customer.loyalty.lastVisitDate)}
                    </div>
                  )}
                  {customer.loyalty && customer.loyalty.lifetimeSpent > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      خرید کل: {customer.loyalty.lifetimeSpent.toLocaleString('fa-IR')} تومان
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Dates and additional info */}
              <div className="space-y-2">
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium">اطلاعات تکمیلی</div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-900 dark:text-white">
                    عضویت: {formatDate(customer.createdAt)}
                  </div>
                  {customer.birthday && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      تولد: {formatDate(customer.birthday)}
                    </div>
                  )}
                  {customer._count && customer._count.feedback > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {customer._count.feedback.toLocaleString('fa-IR')} نظر
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action buttons */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0 mt-1">
          <Link
            href={`/workspaces/customer-relationship-management/customers/${customer.id}`}
            className="inline-flex items-center px-3 py-2 text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="مشاهده جزئیات"
          >
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            مشاهده
          </Link>
          
          <Link
            href={`/workspaces/customer-relationship-management/customers/${customer.id}/edit`}
            className="inline-flex items-center px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title="ویرایش اطلاعات"
          >
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            ویرایش
          </Link>
        </div>
      </div>
      
      {/* Enhanced bottom section with notes */}
      {customer.notes && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-start">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {customer.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 