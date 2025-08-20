# قواعد UI/UX سِروان - طراحی شیشه‌ای نئونی

## 🌟 **فلسفه طراحی جدید**

سیستم طراحی سِروان بر اساس **Glass Morphism** و **Neon Colors** ایجاد شده است تا تجربه‌ای مدرن، حرفه‌ای و بصری جذاب ارائه دهد.

## 🎨 **پالت رنگی نئونی**

### **رنگ‌های اصلی:**
| نقش | رنگ | کد CSS | استفاده |
|-----|-----|--------|----------|
| **سایان نئونی** | Neon Cyan | `#06B6D4` | دکمه‌های اصلی، لینک‌ها، تأکیدات |
| **بنفش نئونی** | Neon Purple | `#8B5CF6` | دکمه‌های ثانویه، برجسته‌سازی |
| **صورتی نئونی** | Neon Pink | `#EC4899` | هشدارها، نشانگرهای فعال |
| **طلایی نئونی** | Neon Amber | `#F59E0B` | تأکیدات، نشانگرهای مهم |
| **سبز نئونی** | Neon Emerald | `#10B981` | موفقیت، تأیید، مثبت |

### **رنگ‌های پس‌زمینه:**
| نقش | رنگ | کد CSS | استفاده |
|-----|-----|--------|----------|
| **پس‌زمینه روشن** | Light Slate | `#F8FAFC` | زمینه اصلی حالت روشن |
| **پس‌زمینه تیره** | Dark Slate | `#0F172A` | زمینه اصلی حالت تاریک |
| **شیشه روشن** | Glass Light | `rgba(255,255,255,0.1)` | کارت‌های شفاف روشن |
| **شیشه تیره** | Glass Dark | `rgba(255,255,255,0.05)` | کارت‌های شفاف تیره |

## 🔮 **Glass Morphism - اثر شیشه‌ای**

### **کامپوننت‌های شیشه‌ای:**
```css
/* کارت شیشه‌ای استاندارد */
.glass-card {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* کارت شیشه‌ای حالت تاریک */
.glass-card-dark {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### **افکت‌های نئونی:**
```css
/* درخشش نئونی */
.neon-glow {
  box-shadow: 0 0 20px currentColor;
  opacity: 0.3;
}

/* گرادیان نئونی */
.neon-gradient {
  background: linear-gradient(135deg, #06B6D4, #8B5CF6, #EC4899);
}

/* متن نئونی */
.neon-text {
  background: linear-gradient(135deg, #06B6D4, #8B5CF6, #EC4899);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## 🎭 **حالت روشن و تاریک**

### **حالت روشن:**
- **پس‌زمینه اصلی**: `bg-gray-50` (#F8FAFC)
- **پس‌زمینه گرادیان**: `from-slate-900 via-purple-900/20 to-slate-900`
- **کارت‌های شیشه‌ای**: `bg-white/10` با `backdrop-blur-xl`
- **متن اصلی**: `text-gray-900`
- **متن ثانویه**: `text-gray-700`

### **حالت تاریک:**
- **پس‌زمینه اصلی**: `bg-gray-900` (#0F172A)
- **پس‌زمینه گرادیان**: `from-slate-950 via-purple-950/30 to-slate-950`
- **کارت‌های شیشه‌ای**: `bg-white/5` با `backdrop-blur-xl`
- **متن اصلی**: `text-white`
- **متن ثانویه**: `text-gray-300`

## ✨ **المان‌های تعاملی**

### **ذرات شناور:**
```jsx
{/* پس‌زمینه متحرک */}
<div className="absolute inset-0 overflow-hidden pointer-events-none">
  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
  <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40" 
       style={{animationDelay: '300ms'}}></div>
  <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse opacity-50" 
       style={{animationDelay: '700ms'}}></div>
</div>
```

### **انیمیشن‌های هاور:**
```css
/* تبدیل اندازه */
.hover-scale {
  transition: transform 0.3s ease;
}
.hover-scale:hover {
  transform: scale(1.05);
}

/* درخشش انیمیشن */
.hover-glow:hover {
  box-shadow: 0 0 30px currentColor;
}
```

## 🎯 **کامپوننت‌های کلیدی**

### **دکمه‌های اصلی:**
```jsx
{/* دکمه نئونی اصلی */}
<button className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-8 py-4 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
  متن دکمه
</button>

{/* دکمه شیشه‌ای */}
<button className="backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg">
  متن دکمه
</button>
```

### **کارت‌های محتوا:**
```jsx
{/* کارت شیشه‌ای با افکت نئونی */}
<div className="group relative">
  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
  <div className="relative backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 p-8 shadow-xl transform transition-all duration-300 hover:scale-105">
    محتوای کارت
  </div>
</div>
```

### **فرم‌های ورودی:**
```jsx
{/* ورودی شیشه‌ای */}
<input
  type="text"
  className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 border border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
  placeholder="متن راهنما"
/>
```

## 🔤 **تایپوگرافی**

### **سلسله‌مراتب متن:**
- **H1**: `text-4xl sm:text-5xl lg:text-6xl font-bold` (64px)
- **H2**: `text-3xl sm:text-4xl font-bold` (48px)
- **H3**: `text-2xl font-bold` (32px)
- **H4**: `text-xl font-bold` (24px)
- **متن عادی**: `text-base` (16px)
- **متن کوچک**: `text-sm` (14px)

### **رنگ‌های متن:**
- **تیتر نئونی**: `bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text`
- **متن اصلی**: `text-gray-900 dark:text-white`
- **متن ثانویه**: `text-gray-700 dark:text-gray-300`
- **متن کم‌اهمیت**: `text-gray-600 dark:text-gray-400`

## 📱 **پاسخگویی (Responsive)**

### **نقاط شکست:**
- **موبایل**: `sm:` (640px+)
- **تبلت**: `md:` (768px+)
- **دسکتاپ**: `lg:` (1024px+)
- **دسکتاپ بزرگ**: `xl:` (1280px+)

### **شبکه‌های responsive:**
```jsx
{/* شبکه تطبیقی */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
  {/* کارت‌ها */}
</div>
```

## 🌍 **RTL و فارسی‌سازی**

### **تنظیمات RTL:**
- **جهت**: `direction: rtl` در بدنه صفحه
- **متن**: `text-right` به جای `text-left`
- **margin/padding**: `mr-4` به جای `ml-4`

### **فونت‌های فارسی:**
- **اصلی**: IRANSans (وزن‌های Regular، Medium، Bold)
- **مکان**: `public/fonts/`
- **بارگذاری**: CSS global در `globals.css`

## 🎨 **مثال‌های ویژوال**

### **صفحه فرود:**
```
┌─────────────────────────── صفحه فرود ────────────────────────────┐
│                                                                  │
│  [پس‌زمینه گرادیان با ذرات شناور]                                   │
│                                                                  │
│  ┌────────────── کارت شیشه‌ای اصلی ──────────────┐                 │
│  │                                                │                 │
│  │    🏢 لوگو سِروان                               │                 │
│  │                                                │                 │
│  │    سیستم مدیریت هوشمند رستوران                │                 │
│  │    [متن با افکت نئونی]                          │                 │
│  │                                                │                 │
│  │    [دکمه شروع نئونی]  [دکمه نمایش ویژگی‌ها]     │                 │
│  │                                                │                 │
│  │    500+ رستوران | 14 روز رایگان | 24/7 پشتیبانی │                 │
│  │    [نشانگرهای اعتماد با درخشش نئونی]            │                 │
│  │                                                │                 │
│  └────────────────────────────────────────────────┘                 │
│                                                                  │
│  [کارت‌های ویژگی‌ها با افکت شیشه‌ای]                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 🔮 **آینده طراحی**

### **ویژگی‌های آینده:**
- **انیمیشن‌های پیچیده‌تر** با Framer Motion
- **تم‌های متنوع** برای seasons مختلف
- **Interactive particles** با کنترل کاربر
- **3D effects** برای کارت‌های مهم

### **بهینه‌سازی:**
- **Performance optimization** برای backdrop-filter
- **Accessibility improvements** برای کم‌بینایان
- **Animation controls** برای کاربران حساس به حرکت

---

## ✨ **خلاصه استایل‌گاید**

سیستم طراحی سِروان ترکیبی از **Glass Morphism مدرن** و **Neon Colors جذاب** است که:

- 🎨 **بصری جذاب** - افکت‌های شیشه‌ای و نئونی
- 🌙 **Dark/Light Mode** - پشتیبانی کامل از دو حالت
- 📱 **Responsive** - طراحی تطبیقی برای همه دستگاه‌ها
- 🌍 **RTL Ready** - آماده برای فارسی و راست‌به‌چپ
- ⚡ **Performance** - بهینه‌سازی شده برای سرعت
- ♿ **Accessible** - قابل دسترس برای همه کاربران

**نتیجه**: یک سیستم طراحی حرفه‌ای، مدرن و منحصربفرد که تجربه کاربری بی‌نظیر ارائه می‌دهد. 