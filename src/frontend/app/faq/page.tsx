'use client';

import Link from 'next/link';
import { ArrowLeft, MessageCircleQuestion } from 'lucide-react';

const faqs = [
  {
    question: 'چگونه حساب کاربری ایجاد کنم؟',
    answer: 'از صفحه ثبت‌نام استفاده کنید و بعد از تایید ایمیل وارد حساب خود شوید.'
  },
  {
    question: 'آیا نسخه آفلاین وجود دارد؟',
    answer: 'بله، فروش و انبار در مسیر بومی و local-first طراحی شده‌اند تا بعد از همگام‌سازی اولیه بدون اینترنت هم کار کنند.'
  },
  {
    question: 'اگر اینترنت قطع شود چه می‌شود؟',
    answer: 'کاربر می‌تواند در محدوده قابلیت‌های آفلاین ادامه دهد و عملیات بعد از اتصال دوباره همگام‌سازی می‌شوند.'
  },
  {
    question: 'چطور پشتیبانی بگیرم؟',
    answer: 'از صفحه تماس با ما پیام بفرستید تا تیم پشتیبانی پاسخ دهد.'
  }
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-400">
          <ArrowLeft className="h-4 w-4" />
          بازگشت
        </Link>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-8 flex items-center gap-3">
            <MessageCircleQuestion className="h-8 w-8 text-cyan-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">سوالات متداول</h1>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</h2>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
