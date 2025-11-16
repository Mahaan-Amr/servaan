'use client';

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { WorkspaceSelector } from '../components/workspace';
import * as authService from '../services/authService';
import Link from 'next/link';
import { Users, Shield, Phone, ArrowRight, Zap, BarChart3, Lock, TrendingUp, Globe } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { user, authLoaded } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();

  // Extract token from URL parameters on mount (for cross-domain redirects)
  useEffect(() => {
    authService.extractTokenFromUrl();
  }, []);

  // Show loading while authentication is being checked
  if (!authLoaded || tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mx-auto"></div>
          <p className="text-gray-700 dark:text-gray-300 text-center mt-4">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Show professional marketing landing page for non-authenticated users
  if (!user) {
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
                {tenant?.logo && (
                  <div className="relative mb-8">
                    <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl blur opacity-25"></div>
                    <Image 
                      src={tenant.logo} 
                      alt={tenant.name || 'Logo'} 
                      width={80}
                      height={80}
                      className="relative mx-auto drop-shadow-lg object-contain"
                      priority
                    />
                  </div>
                )}
                
                {/* Main Headline */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                    {tenant?.displayName || 'سِروان'}
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white text-4xl sm:text-5xl lg:text-6xl">
                    سیستم مدیریت جامع رستوران
                  </span>
                </h1>
                
                {/* Value Proposition */}
                <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                  {tenant?.description || 'تمام ابزارهای مورد نیاز برای مدیریت موثر کسب‌وکار غذایی شما در یک پلتفرم هوشمند و یکپارچه'}
                </p>
                
                {/* Trust Indicators */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <div className="flex items-center gap-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 border border-cyan-400/30 shadow-lg shadow-cyan-400/10">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span className="text-gray-700 dark:text-gray-300">بیش از ۵۰۰ رستوران فعال</span>
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
                
                {/* Tenant Badge - Show only if tenant is available */}
                {tenant && (
                  <div className="mb-8">
                    <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-400/10 to-cyan-400/10 border border-blue-400/30 shadow-lg shadow-blue-400/10">
                      <Globe className="w-4 h-4 ml-2 text-blue-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {tenant.businessType} در {tenant.city}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Universal Login Message */}
                {!tenant && (
                  <div className="mb-8">
                    <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-green-400/10 to-emerald-400/10 border border-green-400/30 shadow-lg shadow-green-400/10">
                      <Globe className="w-4 h-4 ml-2 text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        ورود جهانی - سیستم شما را به تنانت مناسب هدایت می‌کند
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Primary CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Link 
                    href="/register" 
                    className="group relative bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-8 py-4 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-xl"
                  >
                    <span className="relative z-10">شروع رایگان</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <Link 
                    href="/features" 
                    className="group bg-white/10 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-white px-8 py-4 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/30 hover:scale-105 text-xl"
                  >
                    <span className="flex items-center gap-2">
                      مشاهده ویژگی‌ها
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </div>
                
                {/* Secondary CTAs */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link 
                    href="/login" 
                    className="flex items-center justify-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                    ورود به حساب کاربری
                  </Link>
                  <Link 
                    href="/contact" 
                    className="flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    دمو آنلاین
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">چرا سِروان؟</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                بیش از یک سیستم مدیریت ساده، سِروان راه‌حل کاملی برای تحول کسب‌وکار شما
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {[
                {
                  icon: Zap,
                  title: 'سرعت و سادگی',
                  description: 'رابط کاربری شهودی و سریع که حتی کاربران مبتدی هم می‌توانند به راحتی از آن استفاده کنند',
                  color: 'from-cyan-400 to-blue-500',
                  neonColor: 'border-cyan-400/50',
                  glowColor: 'shadow-cyan-400/25'
                },
                {
                  icon: BarChart3,
                  title: 'گزارش‌گیری هوشمند',
                  description: 'تحلیل‌های پیشرفته و گزارش‌های تصویری که به شما کمک می‌کند تصمیمات بهتری بگیرید',
                  color: 'from-purple-400 to-pink-500',
                  neonColor: 'border-purple-400/50',
                  glowColor: 'shadow-purple-400/25'
                },
                {
                  icon: Lock,
                  title: 'امنیت بالا',
                  description: 'سیستم احراز هویت قوی و کنترل دسترسی پیشرفته برای حفاظت از اطلاعات حساس شما',
                  color: 'from-amber-400 to-orange-500',
                  neonColor: 'border-amber-400/50',
                  glowColor: 'shadow-amber-400/25'
                }
              ].map((feature, index) => (
                <div key={index} className="relative group">
                  {/* Glow Effect */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse`}></div>
                  
                  {/* Main Card */}
                  <div className={`relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border ${feature.neonColor} shadow-2xl ${feature.glowColor} p-8 text-center transform transition-all duration-500 hover:scale-105`}>
                    <div className={`bg-gradient-to-r ${feature.color} w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Workspaces Section */}
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">فضاهای کاری</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                محیط‌های تخصصی برای مدیریت بهینه تمام جنبه‌های کسب‌وکار شما
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: '📦',
                  title: 'مدیریت موجودی',
                  description: 'کنترل کامل موجودی، تأمین‌کنندگان، اسکنر QR و بارکد، و مدیریت انبار',
                  color: 'from-blue-400 to-cyan-400',
                  neonColor: 'border-blue-400/30',
                  glowColor: 'shadow-blue-400/10'
                },
                {
                  icon: '📊',
                  title: 'هوش تجاری',
                  description: 'تحلیل‌های پیشرفته، گزارش‌های سفارشی، و پیش‌بینی روندهای فروش',
                  color: 'from-purple-400 to-pink-500',
                  neonColor: 'border-purple-400/30',
                  glowColor: 'shadow-purple-400/10'
                },
                {
                  icon: '💰',
                  title: 'سیستم حسابداری',
                  description: 'دفتر کل، تراز آزمایشی، صورت‌های مالی، و مدیریت جامع مالی',
                  color: 'from-emerald-400 to-teal-500',
                  neonColor: 'border-emerald-400/30',
                  glowColor: 'shadow-emerald-400/10'
                },
                {
                  icon: '🛒',
                  title: 'سیستم سفارش‌گیری و فروش',
                  description: 'سیستم جامع POS، مدیریت سفارشات، پردازش پرداخت و ادغام با انبار',
                  color: 'from-amber-400 to-orange-500',
                  neonColor: 'border-amber-400/30',
                  glowColor: 'shadow-amber-400/10'
                },
                {
                  icon: '📱',
                  title: 'مدیریت پیامک',
                  description: 'ارسال پیامک انبوه، دعوت‌نامه‌ها، کمپین‌های تبلیغاتی، و پیگیری مشتری',
                  color: 'from-amber-400 to-yellow-500',
                  neonColor: 'border-amber-400/30',
                  glowColor: 'shadow-amber-400/10'
                }
              ].map((workspace, index) => (
                <div key={index} className="group relative">
                  {/* Glow Effect */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${workspace.color} rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200`}></div>
                  
                  {/* Main Card */}
                  <div className={`relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border ${workspace.neonColor} shadow-2xl ${workspace.glowColor} p-6 transform transition-all duration-300 hover:scale-105`}>
                    <div className="flex items-center mb-4">
                      <div className="text-3xl ml-3">{workspace.icon}</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{workspace.title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {workspace.description}
                    </p>
                  </div>
                </div>
              ))}
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
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-8 py-4 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    شروع رایگان
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

  // If user is authenticated, show the workspace selector
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 text-gray-900 dark:text-white">
            خوش آمدید، {user.name}!
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300">
            فضای کاری خود را برای شروع انتخاب کنید
          </p>
        </div>
        
        <WorkspaceSelector />
      </div>
    </div>
  );
} 