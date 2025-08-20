'use client';

import { useState } from 'react';
import { 
  Users, 
  Target, 
  Award, 
  Heart, 
  Shield, 
  Zap, 
  TrendingUp, 
  Globe, 
  Calendar,
  Lightbulb,
  Rocket,
  Coffee
} from 'lucide-react';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('story');
  
  const stats = [
    { icon: Users, value: '500+', label: 'رستوران‌های فعال', color: 'from-cyan-400 to-blue-500' },
    { icon: Award, value: '99%', label: 'رضایت مشتریان', color: 'from-purple-400 to-pink-500' },
    { icon: TrendingUp, value: '2M+', label: 'تراکنش ماهانه', color: 'from-emerald-400 to-teal-500' },
    { icon: Globe, value: '15+', label: 'شهر تحت پوشش', color: 'from-amber-400 to-orange-500' }
  ];

  const timeline = [
    { year: '۱۳۹۸', title: 'شروع ایده', desc: 'ایده اولیه سیستم مدیریت رستوران', icon: Lightbulb },
    { year: '۱۳۹۹', title: 'تیم‌سازی', desc: 'جمع‌آوری تیم حرفه‌ای توسعه', icon: Users },
    { year: '۱۴۰۰', title: 'نسخه آلفا', desc: 'راه‌اندازی اولین نسخه آزمایشی', icon: Rocket },
    { year: '۱۴۰۱', title: 'عرضه به بازار', desc: 'عرضه رسمی محصول به بازار', icon: TrendingUp },
    { year: '۱۴۰۲', title: 'گسترش', desc: 'افزودن ویژگی‌های جدید و توسعه', icon: Globe },
    { year: '۱۴۰۳', title: 'رهبری بازار', desc: 'تبدیل به پیشرو در صنعت', icon: Award }
  ];

  const team = [
    { name: 'علی احمدی', role: 'مدیر عامل', expertise: 'کارآفرینی و استراتژی', image: '/team/ceo.jpg' },
    { name: 'سارا محمدی', role: 'مدیر فنی', expertise: 'معماری نرم‌افزار', image: '/team/cto.jpg' },
    { name: 'محمد رضایی', role: 'مدیر محصول', expertise: 'تجربه کاربری', image: '/team/cpo.jpg' },
    { name: 'فاطمه حسینی', role: 'مدیر فروش', expertise: 'توسعه کسب‌وکار', image: '/team/sales.jpg' }
  ];

  const values = [
    { icon: Heart, title: 'مشتری محوری', desc: 'رضایت مشتریان اولویت اول ما', color: 'from-red-400 to-pink-500' },
    { icon: Shield, title: 'اعتماد', desc: 'حفظ امنیت و حریم خصوصی', color: 'from-cyan-400 to-blue-500' },
    { icon: Zap, title: 'نوآوری', desc: 'همواره در حال بهبود و توسعه', color: 'from-purple-400 to-pink-500' },
    { icon: Target, title: 'کیفیت', desc: 'ارائه بهترین محصول و خدمات', color: 'from-emerald-400 to-teal-500' },
    { icon: Users, title: 'همکاری', desc: 'کار تیمی و همراهی مشتریان', color: 'from-amber-400 to-orange-500' },
    { icon: TrendingUp, title: 'رشد', desc: 'پیشرفت مستمر و یادگیری', color: 'from-indigo-400 to-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 dark:from-slate-950 dark:via-purple-950/30 dark:to-slate-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.2),transparent_70%)]"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40" style={{animationDelay: '300ms'}}></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse opacity-50" style={{animationDelay: '700ms'}}></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-amber-400 rounded-full animate-pulse opacity-30" style={{animationDelay: '1000ms'}}></div>
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse opacity-40" style={{animationDelay: '1500ms'}}></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 p-12 shadow-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                  درباره سروان
                </span>
                <br />
                <span className="text-gray-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl">
                  آینده مدیریت رستوران
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                ما سیستم مدیریت هوشمند رستوران را توسعه دادیم تا کسب‌وکار شما به بهترین شکل ممکن اداره شود
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, index) => (
                  <div key={index} className="group relative">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${stat.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000`}></div>
                    <div className="relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-xl transform transition-all duration-300 hover:scale-105 text-center">
                      <stat.icon className="w-8 h-8 mx-auto mb-3 text-gray-900 dark:text-white" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Tab Navigation */}
          <div className="mb-12">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-2 flex flex-wrap gap-2">
              {[
                { id: 'story', label: 'داستان ما', icon: Coffee },
                { id: 'mission', label: 'مأموریت', icon: Target },
                { id: 'team', label: 'تیم', icon: Users },
                { id: 'timeline', label: 'تاریخچه', icon: Calendar },
                { id: 'values', label: 'ارزش‌ها', icon: Heart }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-400 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {/* Story Tab */}
            {activeTab === 'story' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">داستان شروع</h2>
                  <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                      در سال ۱۳۹۸، زمانی که صاحب یک رستوران کوچک بودیم، با چالش‌های فراوانی در مدیریت روزانه کسب‌وکار مواجه شدیم. 
                      از مدیریت موجودی گرفته تا ردیابی فروش و مشتریان، همه کار دستی انجام می‌شد.
                    </p>
                    <p>
                      این تجربه باعث شد تا بفهمیم که صاحبان رستوران‌ها به یک سیستم جامع و کاربردی نیاز دارند. 
                      سیستمی که بتواند تمام جنبه‌های کسب‌وکار را در یک پلتفرم یکپارچه مدیریت کند.
                    </p>
                    <p>
                      بنابراین تصمیم گرفتیم تا با استفاده از تجربه‌مان در صنعت رستوران‌داری و دانش فنی تیممان، 
                      سیستم مدیریت هوشمند سروان را طراحی و توسعه دهیم.
                    </p>
                  </div>
                </div>
                
                <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">چشم‌انداز امروز</h2>
                  <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                      امروز سروان به عنوان یکی از پیشروان در زمینه سیستم‌های مدیریت رستوران در ایران شناخته می‌شود. 
                      ما با بیش از ۵۰۰ رستوران فعال و میلیون‌ها تراکنش ماهانه، اعتماد صاحبان کسب‌وکار را جلب کرده‌ایم.
                    </p>
                    <p>
                      تیم ما متشکل از بهترین متخصصان حوزه فناوری، طراحی تجربه کاربری و کسب‌وکار است که 
                      روزانه برای بهبود و توسعه محصولات خود تلاش می‌کنند.
                    </p>
                    <p>
                      هدف ما کمک به رونق کسب‌وکار شما و ایجاد تجربه‌ای بهتر برای مشتریان‌تان است.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mission Tab */}
            {activeTab === 'mission' && (
              <div className="space-y-12">
                <div className="text-center">
                  <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-12">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">مأموریت ما</h2>
                    <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto">
                      ما متعهد هستیم تا با ارائه بهترین سیستم مدیریت رستوران، کسب‌وکار شما را به سطح جدیدی از موفقیت برسانیم. 
                      هدف ما کمک به صاحبان رستوران‌ها برای تمرکز بر آنچه که بهترین کار می‌کنند: ارائه غذای عالی و خدمات بی‌نظیر.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { 
                      title: 'ساده‌سازی', 
                      desc: 'پیچیدگی‌های مدیریت کسب‌وکار را حذف کرده و فرآیندها را ساده می‌کنیم', 
                      icon: Zap,
                      color: 'from-cyan-400 to-blue-500' 
                    },
                    { 
                      title: 'بهبود سودآوری', 
                      desc: 'با تحلیل داده‌های دقیق، به افزایش سود و کاهش هزینه‌ها کمک می‌کنیم', 
                      icon: TrendingUp,
                      color: 'from-emerald-400 to-teal-500' 
                    },
                    { 
                      title: 'رضایت مشتری', 
                      desc: 'ابزارهای مدیریت ارتباط با مشتری برای بهبود تجربه آن‌ها ارائه می‌دهیم', 
                      icon: Heart,
                      color: 'from-purple-400 to-pink-500' 
                    }
                  ].map((mission, index) => (
                    <div key={index} className="group relative">
                      <div className={`absolute -inset-1 bg-gradient-to-r ${mission.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000`}></div>
                      <div className="relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-8 shadow-xl transform transition-all duration-300 hover:scale-105 text-center">
                        <mission.icon className="w-12 h-12 mx-auto mb-4 text-gray-900 dark:text-white" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{mission.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{mission.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="space-y-12">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">تیم حرفه‌ای ما</h2>
                  <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                    تیم ما از بهترین متخصصان حوزه فناوری، کسب‌وکار و صنعت رستوران‌داری تشکیل شده است
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {team.map((member, index) => (
                    <div key={index} className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                      <div className="relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-xl transform transition-all duration-300 hover:scale-105 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center">
                          <Users className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{member.name}</h3>
                        <p className="text-cyan-400 font-medium mb-2">{member.role}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{member.expertise}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-8 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">به تیم ما بپیوندید!</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    اگر علاقه‌مند به کار در یک تیم پویا و نوآور هستید، رزومه خود را برای ما ارسال کنید
                  </p>
                  <button className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-8 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg">
                    ارسال رزومه
                  </button>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-12">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">مسیر رشد ما</h2>
                  <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                    از یک ایده ساده تا تبدیل شدن به پیشرو در صنعت مدیریت رستوران
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full"></div>
                  
                  <div className="space-y-12">
                    {timeline.map((item, index) => (
                      <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12' : 'pl-12'}`}>
                          <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-xl transform transition-all duration-300 hover:scale-105">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-gradient-to-r from-cyan-400 to-purple-400 p-3 rounded-xl">
                                <item.icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                <p className="text-cyan-400 font-medium">{item.year}</p>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
                          </div>
                        </div>
                        
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full shadow-lg"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Values Tab */}
            {activeTab === 'values' && (
              <div className="space-y-12">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">ارزش‌های ما</h2>
                  <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                    این اصول راهنمای تمام تصمیمات و فعالیت‌های ما در سروان هستند
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {values.map((value, index) => (
                    <div key={index} className="group relative">
                      <div className={`absolute -inset-1 bg-gradient-to-r ${value.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000`}></div>
                      <div className="relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-8 shadow-xl transform transition-all duration-300 hover:scale-105 text-center">
                        <value.icon className="w-12 h-12 mx-auto mb-4 text-gray-900 dark:text-white" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{value.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              آماده همکاری با ما هستید؟
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              برای کسب اطلاعات بیشتر درباره محصولات و خدمات ما، همین حالا با ما تماس بگیرید
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-8 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg">
                شروع دوره آزمایشی
              </button>
              <button className="backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-gray-900 dark:text-white px-8 py-3 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg">
                تماس با ما
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 