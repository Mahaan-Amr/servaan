import ClientProviders from '@/components/ClientProviders';
import '../styles/globals.css';

export const metadata = {
  title: 'سِروان | پنل مدیریت پلتفرم',
  description: 'پنل مدیریت پلتفرم سِروان برای مدیریت مستأجرین و نظارت بر سیستم',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-vazir">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
