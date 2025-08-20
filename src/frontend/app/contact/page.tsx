'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  MessageSquare, 
  Users, 
  Headphones,
  Calendar,
  Globe,
  Star,
  ArrowRight
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
    contactMethod: 'email',
    urgency: 'normal'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: '',
        contactMethod: 'email',
        urgency: 'normal'
      });
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
                  تماس با ما
                </span>
                <br />
                <span className="text-gray-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl">
                  آماده کمک به شما هستیم
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                تیم پشتیبانی ما ۲۴/۷ آماده پاسخگویی به سوالات شما است
              </p>
              
              {/* Quick Contact Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                {[
                  { 
                    icon: Phone, 
                    title: 'تماس تلفنی', 
                    subtitle: '۰۲۱-۱۲۳۴۵۶۷۸', 
                    color: 'from-cyan-400 to-blue-500', 
                    neonColor: 'border-cyan-400/50' 
                  },
                  { 
                    icon: Mail, 
                    title: 'ایمیل', 
                    subtitle: 'support@servaan.ir', 
                    color: 'from-purple-400 to-pink-500', 
                    neonColor: 'border-purple-400/50' 
                  },
                  { 
                    icon: MessageSquare, 
                    title: 'چت آنلاین', 
                    subtitle: 'پاسخ فوری', 
                    color: 'from-emerald-400 to-teal-500', 
                    neonColor: 'border-emerald-400/50' 
                  }
                ].map((contact, index) => (
                  <div key={index} className="group relative">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${contact.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000`}></div>
                    <div className={`relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border ${contact.neonColor} p-6 shadow-xl transform transition-all duration-300 hover:scale-105 text-center`}>
                      <contact.icon className="w-8 h-8 mx-auto mb-4 text-gray-900 dark:text-white" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{contact.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{contact.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  پیام خود را ارسال کنید
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  فرم زیر را پر کنید تا به زودی با شما تماس بگیریم
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                      placeholder="نام شما"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      ایمیل *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      شماره تماس
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      نام رستوران/شرکت
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                      placeholder="نام کسب‌وکار شما"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    موضوع *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="sales">فروش و مشاوره</option>
                    <option value="support">پشتیبانی فنی</option>
                    <option value="billing">مسائل مالی</option>
                    <option value="feature">درخواست ویژگی جدید</option>
                    <option value="other">سایر موارد</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    پیام شما *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                    placeholder="پیام خود را اینجا بنویسید..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      روش ارتباط ترجیحی
                    </label>
                    <select
                      name="contactMethod"
                      value={formData.contactMethod}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                    >
                      <option value="email">ایمیل</option>
                      <option value="phone">تماس تلفنی</option>
                      <option value="sms">پیامک</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      اولویت
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                    >
                      <option value="low">کم</option>
                      <option value="normal">عادی</option>
                      <option value="high">بالا</option>
                      <option value="urgent">فوری</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-8 py-4 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      ارسال پیام
                    </>
                  )}
                </button>

                {submitStatus === 'success' && (
                  <div className="bg-gradient-to-r from-emerald-400/10 to-teal-400/10 border border-emerald-400/30 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">پیام شما با موفقیت ارسال شد!</span>
                  </div>
                )}
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Office Information */}
              <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">اطلاعات تماس</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 p-3 rounded-xl">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">آدرس دفتر</h4>
                      <p className="text-gray-600 dark:text-gray-300">تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۲۳۴</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-3 rounded-xl">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">تلفن</h4>
                      <p className="text-gray-600 dark:text-gray-300">۰۲۱-۱۲۳۴۵۶۷۸</p>
                      <p className="text-gray-600 dark:text-gray-300">۰۹۱۲۳۴۵۶۷۸۹ (واتساپ)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 p-3 rounded-xl">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">ایمیل</h4>
                      <p className="text-gray-600 dark:text-gray-300">support@servaan.ir</p>
                      <p className="text-gray-600 dark:text-gray-300">sales@servaan.ir</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-3 rounded-xl">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">ساعات کاری</h4>
                      <p className="text-gray-600 dark:text-gray-300">شنبه تا چهارشنبه: ۸:۰۰ - ۱۷:۰۰</p>
                      <p className="text-gray-600 dark:text-gray-300">پنج‌شنبه: ۸:۰۰ - ۱۳:۰۰</p>
                      <p className="text-gray-600 dark:text-gray-300">پشتیبانی آنلاین: ۲۴/۷</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Options */}
              <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">گزینه‌های پشتیبانی</h3>
                
                <div className="space-y-4">
                  {[
                    { icon: Headphones, title: 'پشتیبانی فنی', desc: 'مشکلات نرم‌افزاری و فنی', response: '۲۴ ساعته' },
                    { icon: Users, title: 'مشاوره فروش', desc: 'اطلاعات محصولات و قیمت‌ها', response: 'فوری' },
                    { icon: Calendar, title: 'نصب و راه‌اندازی', desc: 'هماهنگی برای نصب سیستم', response: '۴۸ ساعت' },
                    { icon: Globe, title: 'آموزش آنلاین', desc: 'جلسات آموزشی رایگان', response: 'هفتگی' }
                  ].map((support, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/5 dark:bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                      <support.icon className="w-6 h-6 text-cyan-400" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{support.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{support.desc}</p>
                      </div>
                      <span className="text-sm text-emerald-400 font-medium">{support.response}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Quick Links */}
              <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">سوالات متداول</h3>
                
                <div className="space-y-3">
                  {[
                    'چگونه حساب کاربری ایجاد کنم؟',
                    'آیا دوره آزمایشی رایگان است؟',
                    'چگونه اطلاعات را بکاپ کنم؟',
                    'آیا سیستم آفلاین کار می‌کند؟',
                    'چگونه تیکت پشتیبانی ثبت کنم؟'
                  ].map((faq, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 dark:bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer group">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{faq}</span>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  ))}
                </div>
                
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 mt-6 bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300"
                >
                  <MessageSquare className="w-4 h-4" />
                  مشاهده همه سوالات
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