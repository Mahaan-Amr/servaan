'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Check, X, CreditCard, Shield, Zap, Users, BarChart3, Globe, Crown, Star, Phone, CheckCircle, Clock } from 'lucide-react';

// Types
interface PricingTier {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  period: string;
  periodEn: string;
  originalPrice?: number;
  savings?: number;
  isPopular?: boolean;
  features: {
    users: number;
    items: number;
    customers: number;
    storage: string;
    support: string;
    includes: string[];
    advanced: string[];
  };
  color: string;
  gradient: string;
  neonColor: string;
  glowColor: string;
}

interface CalculatorState {
  users: number;
  items: number;
  customers: number;
  selectedTier: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  customCalculation: {
    timeSavings: number;
    costReduction: number;
    revenueIncrease: number;
    totalROI: number;
  };
}

// Pricing Data with Neon Colors
const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'پایه',
    nameEn: 'Starter',
    price: 2000000,
    period: 'ماهانه',
    periodEn: 'monthly',
    features: {
      users: 5,
      items: 1000,
      customers: 500,
      storage: '1 گیگابایت',
      support: 'پشتیبانی ایمیل',
      includes: [
        'مدیریت موجودی',
        'مدیریت مشتریان',
        'سیستم حسابداری پایه',
        'گزارش‌گیری ساده',
        'اعلان‌های موجودی',
        'پنل کاربری فارسی'
      ],
      advanced: []
    },
    color: 'from-cyan-400 to-blue-500',
    gradient: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    neonColor: 'border-cyan-400/50',
    glowColor: 'shadow-cyan-400/25'
  },
  {
    id: 'business',
    name: 'کسب و کار',
    nameEn: 'Business',
    price: 6000000,
    period: 'فصلی',
    periodEn: 'quarterly',
    originalPrice: 6500000,
    savings: 8,
    isPopular: true,
    features: {
      users: 20,
      items: 5000,
      customers: 2000,
      storage: '10 گیگابایت',
      support: 'پشتیبانی تلفنی',
      includes: [
        'تمام ویژگی‌های پایه',
        'گزارش‌گیری پیشرفته',
        'تحلیل‌های هوش تجاری',
        'مدیریت چندشعبه',
        'پیامک انبوه',
        'یکپارچگی واتساپ'
      ],
      advanced: [
        'داشبورد تحلیلی',
        'پیش‌بینی فروش',
        'تحلیل ABC',
        'گزارش‌های سفارشی'
      ]
    },
    color: 'from-purple-400 to-pink-500',
    gradient: 'bg-gradient-to-r from-purple-400 to-pink-500',
    neonColor: 'border-purple-400/50',
    glowColor: 'shadow-purple-400/25'
  },
  {
    id: 'enterprise',
    name: 'سازمانی',
    nameEn: 'Enterprise',
    price: 12000000,
    period: 'سالانه',
    periodEn: 'yearly',
    originalPrice: 15000000,
    savings: 20,
    features: {
      users: 100,
      items: 50000,
      customers: 10000,
      storage: '100 گیگابایت',
      support: 'پشتیبانی اختصاصی ۲۴/۷',
      includes: [
        'تمام ویژگی‌های کسب و کار',
        'API دسترسی کامل',
        'برندسازی سفارشی',
        'چندزبانه بودن',
        'بکاپ اتوماتیک',
        'امنیت پیشرفته'
      ],
      advanced: [
        'هوش مصنوعی',
        'پیش‌بینی پیشرفته',
        'اتوماسیون کامل',
        'یکپارچگی سیستم‌های خارجی'
      ]
    },
    color: 'from-amber-400 to-orange-500',
    gradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
    neonColor: 'border-amber-400/50',
    glowColor: 'shadow-amber-400/25'
  }
];

const FEATURE_COMPARISON = [
  {
    category: 'امکانات پایه',
    features: [
      { name: 'مدیریت موجودی', starter: true, business: true, enterprise: true },
      { name: 'مدیریت مشتریان', starter: true, business: true, enterprise: true },
      { name: 'سیستم حسابداری', starter: true, business: true, enterprise: true },
      { name: 'گزارش‌گیری', starter: 'ساده', business: 'پیشرفته', enterprise: 'کامل' },
      { name: 'پشتیبانی', starter: 'ایمیل', business: 'تلفن', enterprise: '۲۴/۷' }
    ]
  },
  {
    category: 'امکانات پیشرفته',
    features: [
      { name: 'هوش تجاری', starter: false, business: true, enterprise: true },
      { name: 'تحلیل‌های پیشرفته', starter: false, business: true, enterprise: true },
      { name: 'پیامک انبوه', starter: false, business: true, enterprise: true },
      { name: 'API دسترسی', starter: false, business: 'محدود', enterprise: 'کامل' },
      { name: 'برندسازی سفارشی', starter: false, business: false, enterprise: true }
    ]
  },
  {
    category: 'یکپارچگی‌ها',
    features: [
      { name: 'واتساپ', starter: false, business: true, enterprise: true },
      { name: 'اینستاگرام', starter: false, business: false, enterprise: true },
      { name: 'سیستم‌های خارجی', starter: false, business: false, enterprise: true },
      { name: 'درگاه پرداخت', starter: false, business: true, enterprise: true },
      { name: 'حسابداری خارجی', starter: false, business: false, enterprise: true }
    ]
  }
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [calculatorState, setCalculatorState] = useState<CalculatorState>({
    users: 10,
    items: 2000,
    customers: 1000,
    selectedTier: 'business',
    period: 'monthly',
    customCalculation: {
      timeSavings: 0,
      costReduction: 0,
      revenueIncrease: 0,
      totalROI: 0
    }
  });

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  // Get plan cost
  const getPlanCost = React.useCallback((tierId: string): number => {
    const tier = PRICING_TIERS.find(t => t.id === tierId);
    if (!tier) return 0;
    
    switch (tier.periodEn) {
      case 'monthly': return tier.price;
      case 'quarterly': return tier.price / 3;
      case 'yearly': return tier.price / 12;
      default: return tier.price;
    }
  }, []);

  // Calculate ROI
  const calculateROI = React.useCallback((users: number, items: number, customers: number) => {
    const monthlyTimeSavings = users * 8 * 4; // 8 hours per week per user
    const hourlyCost = 50000; // 50k Toman per hour
    const monthlyTimeCost = monthlyTimeSavings * hourlyCost;
    
    const inventoryEfficiency = Math.min(items * 0.1, 500000); // Max 500k per month
    const customerRetention = Math.min(customers * 5, 1000000); // Max 1M per month
    
    const totalMonthlySavings = monthlyTimeCost + inventoryEfficiency + customerRetention;
    const planCost = getPlanCost(calculatorState.selectedTier);
    const monthlyROI = ((totalMonthlySavings - planCost) / planCost) * 100;
    
    return {
      timeSavings: monthlyTimeCost,
      costReduction: inventoryEfficiency,
      revenueIncrease: customerRetention,
      totalROI: Math.max(monthlyROI, 0)
    };
  }, [calculatorState.selectedTier, getPlanCost]);

  // Update calculator
  useEffect(() => {
    const newROI = calculateROI(calculatorState.users, calculatorState.items, calculatorState.customers);
    setCalculatorState(prev => ({
      ...prev,
      customCalculation: newROI
    }));
  }, [calculatorState.users, calculatorState.items, calculatorState.customers, calculatorState.selectedTier, calculateROI]);

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    if (user) {
      router.push(`/register?plan=${planId}`);
    } else {
      router.push(`/register?plan=${planId}`);
    }
  };

  // Render feature value
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-lg" />
      ) : (
        <X className="w-5 h-5 text-gray-400 dark:text-gray-600" />
      );
    }
    return <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 dark:from-slate-950 dark:via-purple-950/30 dark:to-slate-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.2),transparent_70%)]"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40 animate-delay-300"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse opacity-50 animate-delay-700"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 p-12 shadow-2xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                تعرفه‌های سرووان
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                بهترین پلن را برای رستوران خود انتخاب کنید و از امکانات پیشرفته مدیریت کسب و کار بهره‌مند شوید
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 border border-cyan-400/30 shadow-lg shadow-cyan-400/10">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-700 dark:text-gray-300">۵۰۰+ رستوران</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 border border-purple-400/30 shadow-lg shadow-purple-400/10">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-700 dark:text-gray-300">۱۴ روز رایگان</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 border border-pink-400/30 shadow-lg shadow-pink-400/10">
                  <Phone className="w-5 h-5 text-pink-400" />
                  <span className="text-gray-700 dark:text-gray-300">پشتیبانی ۲۴/۷</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative group ${
                  tier.isPopular ? 'transform scale-105' : ''
                }`}
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${tier.color} rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse`}></div>
                
                {/* Main Card */}
                <div className={`relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border ${tier.neonColor} shadow-2xl ${tier.glowColor} overflow-hidden transform transition-all duration-500 hover:scale-105`}>
                  {tier.isPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white text-center py-3 text-sm font-medium backdrop-blur-sm">
                      <span className="flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4" />
                        🔥 محبوب‌ترین انتخاب
                      </span>
                    </div>
                  )}
                  
                  <div className={`p-8 ${tier.isPopular ? 'pt-16' : 'pt-8'}`}>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className={`text-4xl font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                          {formatCurrency(tier.price)}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <div className="text-sm">تومان</div>
                          <div className="text-sm">{tier.period}</div>
                        </div>
                      </div>
                      
                      {tier.originalPrice && (
                        <div className="text-center mb-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400 line-through mr-2">
                            {formatCurrency(tier.originalPrice)} تومان
                          </span>
                          <span className="text-sm text-emerald-400 font-medium bg-emerald-400/10 px-2 py-1 rounded-full">
                            {tier.savings}% تخفیف
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        { label: 'کاربران', value: `${tier.features.users} نفر`, icon: Users },
                        { label: 'اقلام', value: `${formatCurrency(tier.features.items)} عدد`, icon: BarChart3 },
                        { label: 'مشتریان', value: `${formatCurrency(tier.features.customers)} نفر`, icon: Users },
                        { label: 'فضای ذخیره', value: tier.features.storage, icon: Globe },
                        { label: 'پشتیبانی', value: tier.features.support, icon: Shield }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 dark:bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        امکانات شامل:
                      </h4>
                      <ul className="space-y-2">
                        {tier.features.includes.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {tier.features.advanced.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400" />
                          ویژگی‌های پیشرفته:
                        </h4>
                        <ul className="space-y-2">
                          {tier.features.advanced.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => handlePlanSelect(tier.id)}
                      className={`w-full mt-8 px-6 py-4 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r ${tier.color} text-white shadow-lg ${tier.glowColor} hover:shadow-xl hover:scale-105 transform`}
                    >
                      شروع رایگان ۱۴ روزه
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">محاسبه بازگشت سرمایه</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                ببینید سرووان چقدر در هزینه‌ها و زمان شما صرفه‌جویی می‌کند
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Calculator Input */}
              <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">اطلاعات کسب و کار شما</h3>
                
                <div className="space-y-6">
                  {[
                    { 
                      label: 'تعداد کاربران', 
                      min: 1, 
                      max: 100, 
                      value: calculatorState.users,
                      onChange: (value: number) => setCalculatorState(prev => ({ ...prev, users: value })),
                      unit: 'نفر'
                    },
                    { 
                      label: 'تعداد اقلام', 
                      min: 100, 
                      max: 50000, 
                      step: 100,
                      value: calculatorState.items,
                      onChange: (value: number) => setCalculatorState(prev => ({ ...prev, items: value })),
                      unit: 'عدد'
                    },
                    { 
                      label: 'تعداد مشتریان', 
                      min: 50, 
                      max: 10000, 
                      step: 50,
                      value: calculatorState.customers,
                      onChange: (value: number) => setCalculatorState(prev => ({ ...prev, customers: value })),
                      unit: 'نفر'
                    }
                  ].map((slider, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {slider.label}
                      </label>
                      <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step || 1}
                        value={slider.value}
                        onChange={(e) => slider.onChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/20 dark:bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
                      />
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatCurrency(slider.min)}</span>
                        <span className="font-medium text-cyan-400">
                          {formatCurrency(slider.value)} {slider.unit}
                        </span>
                        <span>{formatCurrency(slider.max)}</span>
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      پلن انتخابی
                    </label>
                    <select
                      value={calculatorState.selectedTier}
                      onChange={(e) => setCalculatorState(prev => ({ ...prev, selectedTier: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-white backdrop-blur-sm"
                    >
                      {PRICING_TIERS.map(tier => (
                        <option key={tier.id} value={tier.id} className="bg-gray-800 text-white">
                          {tier.name} - {formatCurrency(tier.price)} تومان {tier.period}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Calculator Results */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-3xl border border-purple-400/30 p-8 shadow-2xl shadow-purple-400/10">
                <h3 className="text-xl font-bold text-white mb-6">نتایج محاسبه</h3>
                
                <div className="space-y-6">
                  {[
                    {
                      label: 'صرفه‌جویی در زمان',
                      value: calculatorState.customCalculation.timeSavings,
                      icon: Clock,
                      color: 'text-cyan-400',
                      bg: 'bg-cyan-400/10',
                      border: 'border-cyan-400/30'
                    },
                    {
                      label: 'کاهش هزینه‌ها',
                      value: calculatorState.customCalculation.costReduction,
                      icon: BarChart3,
                      color: 'text-purple-400',
                      bg: 'bg-purple-400/10',
                      border: 'border-purple-400/30'
                    },
                    {
                      label: 'افزایش درآمد',
                      value: calculatorState.customCalculation.revenueIncrease,
                      icon: Zap,
                      color: 'text-pink-400',
                      bg: 'bg-pink-400/10',
                      border: 'border-pink-400/30'
                    }
                  ].map((metric, index) => (
                    <div key={index} className={`${metric.bg} backdrop-blur-sm rounded-xl p-4 border ${metric.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">{metric.label}</span>
                        <metric.icon className={`w-4 h-4 ${metric.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(metric.value)} تومان/ماه
                      </div>
                    </div>
                  ))}

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/30 text-center">
                    <div className="text-sm text-gray-300 mb-1">بازگشت سرمایه ماهانه</div>
                    <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
                      {Math.round(calculatorState.customCalculation.totalROI)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">مقایسه امکانات</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">جزئیات کامل امکانات هر پلن</p>
            </div>

            <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/10 dark:bg-white/5 border-b border-white/20 dark:border-white/10">
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">ویژگی</th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">پایه</th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center justify-center gap-2">
                          کسب و کار
                          <Crown className="w-4 h-4 text-purple-400" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">سازمانی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_COMPARISON.map((category, categoryIndex) => (
                      <React.Fragment key={categoryIndex}>
                        <tr className="bg-white/5 dark:bg-white/5 border-b border-white/10 dark:border-white/5">
                          <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white bg-gradient-to-r from-purple-400/10 to-cyan-400/10">
                            {category.category}
                          </td>
                        </tr>
                        {category.features.map((feature, featureIndex) => (
                          <tr key={featureIndex} className="hover:bg-white/5 dark:hover:bg-white/5 border-b border-white/10 dark:border-white/5 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{feature.name}</td>
                            <td className="px-6 py-4 text-center">
                              {renderFeatureValue(feature.starter)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {renderFeatureValue(feature.business)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {renderFeatureValue(feature.enterprise)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">روش‌های پرداخت</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">پرداخت آسان و امن</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: CreditCard, title: 'کارت بانکی', desc: 'پرداخت مستقیم با کارت‌های بانکی ایرانی', color: 'from-blue-400 to-cyan-400' },
                { icon: Globe, title: 'درگاه‌های پرداخت', desc: 'زرین‌پال، بهپردازش، پارسیان و سایر درگاه‌ها', color: 'from-purple-400 to-pink-400' },
                { icon: Shield, title: 'پرداخت امن', desc: 'رمزگذاری SSL و امنیت بانکی', color: 'from-emerald-400 to-teal-400' }
              ].map((method, index) => (
                <div key={index} className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 p-8 text-center shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${method.color} rounded-2xl flex items-center justify-center`}>
                    <method.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{method.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{method.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">سوالات متداول</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">پاسخ سوالات رایج درباره تعرفه‌ها</p>
            </div>

            <div className="space-y-6">
              {[
                { q: 'آیا می‌توانم پلن خود را تغییر دهم؟', a: 'بله، شما می‌توانید در هر زمان پلن خود را ارتقا یا کاهش دهید. تغییرات از دوره بعدی اعمال می‌شود.' },
                { q: 'آیا قرارداد بلندمدت لازم است؟', a: 'خیر، شما می‌توانید در هر زمان اشتراک خود را لغو کنید. هیچ هزینه جریمه‌ای وجود ندارد.' },
                { q: 'آیا دوره آزمایشی رایگان است؟', a: 'بله، تمام پلن‌ها دارای ۱۴ روز دوره آزمایشی رایگان هستند. نیازی به وارد کردن اطلاعات کارت بانکی نیست.' },
                { q: 'آیا پشتیبانی فنی ارائه می‌شود؟', a: 'بله، تمام پلن‌ها دارای پشتیبانی فنی هستند. پلن‌های پیشرفته‌تر پشتیبانی سریع‌تری دارند.' }
              ].map((faq, index) => (
                <div key={index} className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-xl">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">{faq.q}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-3xl border border-purple-400/30 p-12 shadow-2xl shadow-purple-400/10">
              <h2 className="text-3xl font-bold text-white mb-4">آماده شروع هستید؟</h2>
              <p className="text-xl mb-8 text-gray-300">
                همین حالا با ۱۴ روز دوره آزمایشی رایگان شروع کنید
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/register')}
                  className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-8 py-4 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  شروع رایگان
                </button>
                <button
                  onClick={() => router.push('/contact')}
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/30 hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    مشاوره رایگان
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }
        
        .animate-delay-300 {
          animation-delay: 300ms;
        }
        
        .animate-delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
} 