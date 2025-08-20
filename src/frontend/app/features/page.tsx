'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PREDEFINED_WORKSPACES } from '../../constants/workspaces';
import { CustomAreaChart } from '../../components/charts/AreaChart';
import { CustomDonutChart } from '../../components/charts/DonutChart';
import { 
  Star, 
  BarChart3, 
  CheckCircle, 
  TrendingUp,
  Play,
  Phone,
  Package,
  Brain,
  Calculator,
  Users,
  MessageSquare,
  Globe
} from 'lucide-react';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('inventory-management');
  const [demoType, setDemoType] = useState('overview');

  // Workspace icon mapping
  const getWorkspaceIcon = (workspaceId: string) => {
    switch (workspaceId) {
      case 'inventory-management':
        return Package;
      case 'business-intelligence':
        return Brain;
      case 'accounting-system':
        return Calculator;
      case 'customer-relationship-management':
        return Users;
      case 'sms-management':
        return MessageSquare;
      case 'public-relations':
        return Globe;
      default:
        return Package;
    }
  };

  // Sample data for interactive demonstrations
  const demoData = {
    sales: [
      { name: 'فروردین', value: 12000000 },
      { name: 'اردیبهشت', value: 15000000 },
      { name: 'خرداد', value: 18000000 },
      { name: 'تیر', value: 22000000 },
      { name: 'مرداد', value: 20000000 },
      { name: 'شهریور', value: 25000000 },
    ],
    inventory: [
      { name: 'موجودی کافی', value: 65, color: '#10B981', count: 65, percentage: 65 },
      { name: 'موجودی کم', value: 25, color: '#F59E0B', count: 25, percentage: 25 },
      { name: 'ناموجود', value: 10, color: '#EF4444', count: 10, percentage: 10 },
    ],
  };

  // ROI calculation data
  const roiCalculations = {
    timesSaved: 8, // hours per week
    costReduction: 15, // percentage
    revenueIncrease: 12, // percentage
    monthlyRevenue: 50000000, // IRR
    staffCost: 8000000, // IRR per month
  };

  const calculateROI = () => {
    const timeCostSaved = (roiCalculations.timesSaved * 4 * 100000); // 100K per hour
    const costReduction = (roiCalculations.staffCost * roiCalculations.costReduction) / 100;
    const revenueIncrease = (roiCalculations.monthlyRevenue * roiCalculations.revenueIncrease) / 100;
    const totalBenefit = timeCostSaved + costReduction + revenueIncrease;
    const systemCost = 2000000; // Monthly cost
    const roi = ((totalBenefit - systemCost) / systemCost) * 100;
    return {
      timeCostSaved,
      costReduction,
      revenueIncrease,
      totalBenefit,
      roi: Math.round(roi),
    };
  };

  const roiResults = calculateROI();

  // Customer testimonials
  const testimonials = [
    {
      name: 'احمد محمدی',
      restaurant: 'رستوران سنتی پارسیان',
      city: 'تهران',
      quote: 'سِروان واقعاً کسب‌وکار ما را متحول کرد. مدیریت موجودی و گزارش‌گیری الان خیلی راحت‌تر شده.',
      rating: 5,
      savings: '۳۰٪ کاهش ضایعات',
      avatar: '👨‍🍳'
    },
    {
      name: 'مریم احمدی',
      restaurant: 'کافه رستوران آرامش',
      city: 'اصفهان',
      quote: 'قبل از سِروان، روزانه ۲ ساعت وقت صرف حسابداری می‌کردم. الان تنها ۳۰ دقیقه!',
      rating: 5,
      savings: '۷۵٪ صرفه‌جویی زمان',
      avatar: '👩‍💼'
    },
    {
      name: 'رضا کریمی',
      restaurant: 'فست‌فود طلایی',
      city: 'شیراز',
      quote: 'سیستم اسکنر بارکد فوق‌العاده است. دیگر اشتباه در ثبت موجودی نداریم.',
      rating: 5,
      savings: '۹۵٪ دقت بیشتر',
      avatar: '🍔'
    }
  ];

  const activeWorkspace = PREDEFINED_WORKSPACES.find(w => w.id === activeTab);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fa-IR').format(amount);
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
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-amber-400 rounded-full animate-pulse opacity-30 animate-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse opacity-40 animate-delay-1500"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 p-12 shadow-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                  ویژگی‌های کامل سِروان
                </span>
                <br />
                <span className="text-gray-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl">
                  همه چیز برای موفقیت شما
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                کاوش کنید که چگونه سِروان می‌تواند کسب‌وکار شما را به سطح بعدی برساند
              </p>
              
              {/* Feature stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                {[
                  { value: '۶+', label: 'فضای کاری تخصصی', color: 'from-cyan-400 to-blue-500', neonColor: 'border-cyan-400/50' },
                  { value: '۵۰+', label: 'ویژگی قدرتمند', color: 'from-purple-400 to-pink-500', neonColor: 'border-purple-400/50' },
                  { value: '۲۴/۷', label: 'پشتیبانی آنلاین', color: 'from-emerald-400 to-teal-500', neonColor: 'border-emerald-400/50' }
                ].map((stat, index) => (
                  <div key={index} className="group relative">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${stat.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000`}></div>
                    <div className={`relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border ${stat.neonColor} p-6 shadow-xl transform transition-all duration-300 hover:scale-105`}>
                      <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                        {stat.value}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Demo Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              نمایش زنده ویژگی‌ها
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              ببینید چگونه سِروان در عمل کار می‌کند
            </p>
          </div>

          {/* Demo Type Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { id: 'overview', label: 'نمای کلی', icon: BarChart3 },
              { id: 'charts', label: 'نمودارها', icon: TrendingUp },
              { id: 'reports', label: 'گزارش‌ها', icon: CheckCircle }
            ].map((demo) => (
              <button
                key={demo.id}
                onClick={() => setDemoType(demo.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  demoType === demo.id
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-400 text-white shadow-lg'
                    : 'bg-white/10 dark:bg-white/5 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white/20 border border-white/30'
                }`}
              >
                <demo.icon className="w-4 h-4" />
                {demo.label}
              </button>
            ))}
          </div>

          {/* Demo Content */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8 mb-16">
            {demoType === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'موجودی لحظه‌ای', value: '۱۲۳', unit: 'آیتم فعال', color: 'from-blue-400 to-cyan-400', neonColor: 'border-blue-400/30' },
                  { title: 'فروش امروز', value: '۲.۵ میلیون', unit: 'تومان', color: 'from-emerald-400 to-teal-500', neonColor: 'border-emerald-400/30' },
                  { title: 'کل مشتریان', value: '۱۸۷', unit: 'مشتری فعال', color: 'from-purple-400 to-pink-500', neonColor: 'border-purple-400/30' }
                ].map((metric, index) => (
                  <div key={index} className="group relative">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${metric.color} rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000`}></div>
                    <div className={`relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border ${metric.neonColor} p-6 shadow-xl`}>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{metric.title}</h3>
                      <div className={`text-3xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent mb-2`}>
                        {metric.value}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{metric.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {demoType === 'charts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">روند فروش ماهانه</h3>
                  <CustomAreaChart 
                    data={demoData.sales}
                    areas={[{ dataKey: 'value', fill: '#06B6D4', stroke: '#0891B2', name: 'فروش' }]}
                    xAxisKey="name"
                    height={300}
                  />
                </div>
                <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">وضعیت موجودی</h3>
                  <CustomDonutChart 
                    data={demoData.inventory}
                  />
                </div>
              </div>
            )}

            {demoType === 'reports' && (
              <div className="space-y-6">
                <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">محاسبه بازگشت سرمایه</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'صرفه‌جویی زمان', value: formatCurrency(roiResults.timeCostSaved), unit: 'تومان/ماه', color: 'text-cyan-400' },
                      { label: 'کاهش هزینه', value: formatCurrency(roiResults.costReduction), unit: 'تومان/ماه', color: 'text-purple-400' },
                      { label: 'افزایش درآمد', value: formatCurrency(roiResults.revenueIncrease), unit: 'تومان/ماه', color: 'text-pink-400' },
                      { label: 'بازگشت سرمایه', value: `${roiResults.roi}%`, unit: 'ماهانه', color: 'text-emerald-400' }
                    ].map((roi, index) => (
                      <div key={index} className="text-center">
                        <div className={`text-2xl font-bold ${roi.color} mb-1`}>{roi.value}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{roi.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{roi.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Workspace Selector */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              انتخاب فضای کاری برای کاوش بیشتر
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {PREDEFINED_WORKSPACES.map((workspace) => {
                const IconComponent = getWorkspaceIcon(workspace.id);
                return (
                  <button
                    key={workspace.id}
                    onClick={() => setActiveTab(workspace.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      activeTab === workspace.id
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg'
                        : 'bg-white/10 dark:bg-white/5 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white/20 border border-white/30'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-sm">{workspace.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Workspace Details */}
          {activeWorkspace && (
            <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8 mb-16">
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  {(() => {
                    const IconComponent = getWorkspaceIcon(activeWorkspace.id);
                    return <IconComponent className="w-16 h-16 text-cyan-400" />;
                  })()}
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{activeWorkspace.title}</h3>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  {activeWorkspace.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeWorkspace.features.map((feature, index) => (
                  <div key={index} className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative backdrop-blur-sm bg-white/5 dark:bg-white/5 rounded-2xl border border-white/10 p-4 text-center transform transition-all duration-300 hover:scale-105">
                      <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-gray-700 dark:text-gray-300">{feature.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Customer Testimonials */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              نظرات مشتریان راضی
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              ببینید مشتریان ما چه می‌گویند
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8 transform transition-all duration-500 hover:scale-105">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-4">{testimonial.avatar}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{testimonial.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{testimonial.restaurant}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{testimonial.city}</p>
                  </div>
                  
                  <div className="flex justify-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  
                  <div className="text-center">
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-400/10 to-teal-400/10 border border-emerald-400/30 text-emerald-400 font-medium">
                      <TrendingUp className="w-4 h-4 ml-2" />
                      {testimonial.savings}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-3xl border border-purple-400/30 p-12 shadow-2xl shadow-purple-400/10">
              <h2 className="text-3xl font-bold text-white mb-4">آماده تجربه سِروان هستید؟</h2>
              <p className="text-xl mb-8 text-gray-300">
                با ۱۴ روز آزمایش رایگان شروع کنید و تفاوت را ببینید
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-8 py-4 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    شروع رایگان
                  </span>
                </Link>
                <Link
                  href="/pricing"
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/30 hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    مشاهده تعرفه‌ها
                  </div>
                </Link>
                <Link
                  href="/contact"
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/30 hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    مشاوره رایگان
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .animate-delay-300 {
          animation-delay: 300ms;
        }
        
        .animate-delay-700 {
          animation-delay: 700ms;
        }
        
        .animate-delay-1000 {
          animation-delay: 1000ms;
        }
        
        .animate-delay-1500 {
          animation-delay: 1500ms;
        }
      `}</style>
    </div>
  );
} 