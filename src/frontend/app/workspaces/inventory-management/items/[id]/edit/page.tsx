'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ItemEditPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  useEffect(() => {
    // Redirect to the add page with edit mode in the correct workspace path
    router.replace(`/workspaces/inventory-management/items/add?edit=${itemId}`);
  }, [itemId, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">در حال انتقال به صفحه ویرایش...</p>
      </div>
    </div>
  );
};

export default ItemEditPage; 