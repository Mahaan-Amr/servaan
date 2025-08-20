'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PublicRelationsPage() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Upcoming features preview
  const upcomingFeatures = [
    {
      id: 1,
      title: 'مدیریت کمپین‌های هوشمند',
      description: 'ایجاد و مدیریت کمپین‌های تبلیغاتی با ابزارهای پیشرفته و هوش مصنوعی',
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      color: 'from-orange-500 to-red-500',
      priority: 'بالا'
    },
    {
      id: 2,
      title: 'مدیریت شبکه‌های اجتماعی',
      description: 'پست خودکار، تحلیل عملکرد و مدیریت محتوا در تمام پلتفرم‌های اجتماعی',
      icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16',
      color: 'from-blue-500 to-purple-500',
      priority: 'بالا'
    },
    {
      id: 3,
      title: 'سیستم بازخورد هوشمند',
      description: 'جمع‌آوری و تحلیل نظرات مشتریان با پردازش زبان طبیعی',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      color: 'from-green-500 to-teal-500',
      priority: 'متوسط'
    },
    {
      id: 4,
      title: 'داشبورد تحلیل عملکرد',
      description: 'آمار و تحلیل کامل کمپین‌ها، نرخ تعامل و بازدهی سرمایه‌گذاری',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'from-purple-500 to-pink-500',
      priority: 'متوسط'
    },
    {
      id: 5,
      title: 'مدیریت رویدادها',
      description: 'برنامه‌ریزی و مدیریت رویدادها، وبینارها و کنفرانس‌های آنلاین',
      icon: 'M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H10a2 2 0 01-2-2zM8 7V3a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H10a2 2 0 01-2-2z',
      color: 'from-yellow-500 to-orange-500',
      priority: 'پایین'
    },
    {
      id: 6,
      title: 'مدیریت بحران',
      description: 'ابزارهای مدیریت بحران و ارتباطات اضطراری برای حفظ شهرت برند',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      color: 'from-red-500 to-pink-500',
      priority: 'بالا'
    }
  ];

  const handleNotificationSubscribe = () => {
    if (email && email.includes('@')) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'بالا':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'متوسط':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'پایین':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Coming Soon Hero */}
      <div className="text-center py-12">
        <div className="relative">
          {/* Floating Animation Background */}
          <div className="absolute inset-0 -z-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-20 animate-bounce`}
                style={{
                  left: `${20 + (i * 10)}%`,
                  top: `${10 + (i * 5)}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${2 + (i * 0.1)}s`
                }}
              ></div>
            ))}
          </div>

          {/* Main Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-4 h-4 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            فضای کاری روابط عمومی
          </h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Public Relations Workspace
          </h2>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center space-x-3 space-x-reverse bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 px-6 py-3 rounded-full border border-orange-300 dark:border-orange-600 mb-8">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-orange-800 dark:text-orange-300 font-medium">
              به‌زودی در دسترس - فاز 4
            </span>
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            مدیریت کامل روابط عمومی، کمپین‌های تبلیغاتی و ارتباط با مشتریان با ابزارهای پیشرفته و هوش مصنوعی
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          زمان‌بندی توسعه
        </h3>
        <div className="flex items-center justify-center space-x-8 space-x-reverse">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">طراحی UI/UX</span>
            <span className="text-xs text-gray-500">تکمیل شده</span>
          </div>
          <div className="w-16 h-0.5 bg-green-300"></div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">توسعه Backend</span>
            <span className="text-xs text-orange-600">در حال انجام</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500">تست و راه‌اندازی</span>
            <span className="text-xs text-gray-400">تابستان 1403</span>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          ویژگی‌های در حال توسعه
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingFeatures.map((feature) => (
            <div
              key={feature.id}
              className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                <div className={`w-full h-full bg-gradient-to-br ${feature.color} rounded-full`}></div>
              </div>

              {/* Priority Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityBadgeColor(feature.priority)}`}>
                  {feature.priority}
                </span>
              </div>

              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 transition-colors">
                {feature.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Coming Soon Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg px-3 py-2 text-center">
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    در حال توسعه...
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Subscription */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-8 border border-orange-200 dark:border-orange-700">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 17l-2-1m1-4l-2-1m2-4l-2-1m1-4v2m0 0H6a2 2 0 00-2 2v10a2 2 0 002 2h4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            اولین نفر باشید که با خبر می‌شود!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            به محض آماده شدن فضای کاری روابط عمومی، اولین نفری باشید که از راه‌اندازی آن مطلع می‌شوید
          </p>

          {!isSubscribed ? (
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="آدرس ایمیل شما"
                className="flex-1 px-4 py-3 rounded-lg border border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                dir="ltr"
              />
              <button
                onClick={handleNotificationSubscribe}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200"
              >
                عضویت در خبرنامه
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3 space-x-reverse text-green-600 dark:text-green-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">با تشکر! شما در لیست خبرنامه قرار گرفتید.</span>
            </div>
          )}
        </div>
      </div>

      {/* Back to Workspaces */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 space-x-reverse text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>بازگشت به فضاهای کاری</span>
        </Link>
      </div>
    </div>
  );
} 