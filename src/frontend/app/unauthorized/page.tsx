'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function UnauthorizedPage() {
  const { logout } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-dark-brown-light p-8 rounded-lg shadow-md w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold mb-6 text-chili-red">دسترسی غیرمجاز</h1>
        
        <div className="mb-6">
          <svg className="mx-auto w-24 h-24 text-chili-red" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 011-1h4a1 1 0 010 2H8a1 1 0 01-1-1zm1 4a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd"></path>
          </svg>
        </div>
        
        <p className="text-lg mb-6">
          شما مجوز دسترسی به این صفحه را ندارید. لطفاً با مدیر سیستم تماس بگیرید.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/" className="bg-chili-red text-white py-2 px-6 rounded hover:bg-chili-red-dark">
            بازگشت به صفحه اصلی
          </Link>
          
          <button
            onClick={logout}
            className="bg-gray-200 text-gray-800 py-2 px-6 rounded hover:bg-gray-300"
          >
            خروج از سیستم
          </button>
        </div>
      </div>
    </div>
  );
} 