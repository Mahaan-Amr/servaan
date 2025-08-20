'use client';

import { useTenant } from '../contexts/TenantContext';

export function TenantAwareFooter() {
  const { tenant } = useTenant();

  return (
    <footer className="bg-white dark:bg-gray-800 py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {tenant?.displayName ? (
              <>
                {tenant.displayName} - مدیریت هوشمند کسب‌وکار © {new Date().getFullYear()}
                <br />
                <span className="text-xs text-gray-500">
                  پلن {tenant.plan} • {tenant.city}, {tenant.country}
                </span>
              </>
            ) : (
              <>سِروان - سیستم مدیریت داخلی کافه و رستوران © {new Date().getFullYear()}</>
            )}
          </p>
          <div className="mt-4 md:mt-0 flex space-x-4 rtl:space-x-reverse">
            <a href="#" className="text-gray-500 hover:text-primary-500">
              پشتیبانی
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-500">
              راهنما
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-500">
              حریم خصوصی
            </a>
            {tenant && (
              <a href={`mailto:${tenant.ownerEmail}`} className="text-gray-500 hover:text-primary-500">
                تماس با مدیر
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
} 