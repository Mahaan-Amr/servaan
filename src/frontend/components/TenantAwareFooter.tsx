'use client';

import { useTenant } from '../contexts/TenantContext';

export function TenantAwareFooter() {
  const { tenant } = useTenant();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:justify-between lg:items-center">
          <div className="text-center lg:text-right">
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
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
          </div>
          <div className="flex flex-wrap justify-center lg:justify-end gap-2 sm:gap-3 lg:gap-4">
            <a href="#" className="text-gray-500 hover:text-primary-500 text-xs sm:text-sm">
              پشتیبانی
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-500 text-xs sm:text-sm">
              راهنما
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-500 text-xs sm:text-sm">
              حریم خصوصی
            </a>
            {tenant && (
              <a href={`mailto:${tenant.ownerEmail}`} className="text-gray-500 hover:text-primary-500 text-xs sm:text-sm">
                تماس با مدیر
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
} 
