'use client';

import { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Download, 
  Power, 
  PowerOff, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Tenant } from '@/types/admin';
import { bulkUpdateTenantStatus, exportTenants } from '@/services/admin/tenants/tenantService';

interface BulkOperationsBarProps {
  tenants: Tenant[];
  selectedTenants: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRefresh: () => void;
  currentFilters?: any; // Current search/filter state
}

export default function BulkOperationsBar({ 
  tenants, 
  selectedTenants, 
  onSelectionChange, 
  onRefresh,
  currentFilters
}: BulkOperationsBarProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'activate' | 'deactivate' | 'export';
    format?: 'csv' | 'excel' | 'pdf';
  } | null>(null);

  const allSelected = selectedTenants.length === tenants.length && tenants.length > 0;
  const someSelected = selectedTenants.length > 0 && selectedTenants.length < tenants.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tenants.map(t => t.id));
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    if (selectedTenants.includes(tenantId)) {
      onSelectionChange(selectedTenants.filter(id => id !== tenantId));
    } else {
      onSelectionChange([...selectedTenants, tenantId]);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'export', format?: 'csv' | 'excel' | 'pdf') => {
    if (selectedTenants.length === 0) {
      toast.error('لطفاً حداقل یک مستأجر را انتخاب کنید');
      return;
    }

    if (action === 'export') {
      setPendingAction({ type: 'export', format });
      setShowConfirm(true);
    } else {
      setPendingAction({ type: action });
      setShowConfirm(true);
    }
  };

  const confirmAction = async () => {
    if (!pendingAction || selectedTenants.length === 0) return;

    try {
      setLoading(true);

      if (pendingAction.type === 'export' && pendingAction.format) {
        // Pass current filters and selected tenants to export function
        await exportTenants(pendingAction.format, currentFilters, selectedTenants);
        toast.success(`صادرات ${selectedTenants.length} مستأجر با موفقیت انجام شد`);
      } else if (pendingAction.type === 'activate' || pendingAction.type === 'deactivate') {
        const isActive = pendingAction.type === 'activate';
        await bulkUpdateTenantStatus(selectedTenants, isActive);
        
        const actionText = isActive ? 'فعال' : 'غیرفعال';
        toast.success(`${selectedTenants.length} مستأجر با موفقیت ${actionText} شد`);
        
        // Refresh data and clear selection
        onRefresh();
        onSelectionChange([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'خطا در انجام عملیات گروهی');
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setPendingAction(null);
    }
  };

  const cancelAction = () => {
    setShowConfirm(false);
    setPendingAction(null);
  };

  if (tenants.length === 0) return null;

  return (
    <>
      {/* Bulk Operations Bar */}
      <div className={`bg-admin-primary text-white p-4 rounded-admin transition-all duration-300 ${
        selectedTenants.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full absolute'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center">
              <button
                onClick={handleSelectAll}
                className="flex items-center text-white hover:text-admin-bg transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="h-5 w-5 ml-2" />
                ) : (
                  <Square className="h-5 w-5 ml-2" />
                )}
                {allSelected ? 'حذف انتخاب همه' : 'انتخاب همه'}
              </button>
            </div>
            
            <div className="text-sm">
              {selectedTenants.length} مستأجر انتخاب شده
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Bulk Actions */}
            <button
              onClick={() => handleBulkAction('activate')}
              disabled={loading}
              className="flex items-center px-3 py-2 bg-admin-success hover:bg-admin-success-dark text-white rounded-admin text-sm transition-colors disabled:opacity-50"
            >
              <Power className="h-4 w-4 ml-2" />
              فعال‌سازی گروهی
            </button>

            <button
              onClick={() => handleBulkAction('deactivate')}
              disabled={loading}
              className="flex items-center px-3 py-2 bg-admin-warning hover:bg-admin-warning-dark text-white rounded-admin text-sm transition-colors disabled:opacity-50"
            >
              <PowerOff className="h-4 w-4 ml-2" />
              غیرفعال‌سازی گروهی
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button
                disabled={loading}
                className="flex items-center px-3 py-2 bg-admin-info hover:bg-admin-info-dark text-white rounded-admin text-sm transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4 ml-2" />
                صادرات
                <svg className="h-4 w-4 mr-2 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Export Options Dropdown */}
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-admin-border rounded-admin shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => handleBulkAction('export', 'csv')}
                    className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                  >
                    صادرات CSV
                  </button>
                  <button
                    onClick={() => handleBulkAction('export', 'excel')}
                    className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                  >
                    صادرات Excel
                  </button>
                  <button
                    onClick={() => handleBulkAction('export', 'pdf')}
                    className="w-full text-right px-4 py-2 text-sm text-admin-text hover:bg-admin-bg transition-colors"
                  >
                    صادرات PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Clear Selection */}
            <button
              onClick={() => onSelectionChange([])}
              className="text-white hover:text-admin-bg transition-colors"
              title="حذف انتخاب"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-admin shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                {pendingAction.type === 'export' ? (
                  <Download className="h-6 w-6 text-admin-info ml-2" />
                ) : pendingAction.type === 'activate' ? (
                  <CheckCircle className="h-6 w-6 text-admin-success ml-2" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-admin-warning ml-2" />
                )}
                
                <h3 className="text-lg font-bold text-admin-text">
                  {pendingAction.type === 'export' && 'تأیید صادرات'}
                  {pendingAction.type === 'activate' && 'تأیید فعال‌سازی گروهی'}
                  {pendingAction.type === 'deactivate' && 'تأیید غیرفعال‌سازی گروهی'}
                </h3>
              </div>

              <p className="text-admin-text mb-6">
                {pendingAction.type === 'export' && `آیا می‌خواهید ${selectedTenants.length} مستأجر انتخاب شده را به فرمت ${pendingAction.format?.toUpperCase()} صادر کنید؟`}
                {pendingAction.type === 'activate' && `آیا می‌خواهید ${selectedTenants.length} مستأجر انتخاب شده را فعال کنید؟`}
                {pendingAction.type === 'deactivate' && `آیا می‌خواهید ${selectedTenants.length} مستأجر انتخاب شده را غیرفعال کنید؟`}
              </p>

              <div className="flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  onClick={cancelAction}
                  className="btn-admin-secondary"
                  disabled={loading}
                >
                  انصراف
                </button>
                <button
                  onClick={confirmAction}
                  className={`btn-admin-primary flex items-center ${
                    pendingAction.type === 'deactivate' ? 'bg-admin-warning hover:bg-admin-warning-dark' : ''
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      در حال انجام...
                    </>
                  ) : (
                    <>
                      {pendingAction.type === 'export' && <Download className="h-4 w-4 ml-2" />}
                      {pendingAction.type === 'activate' && <CheckCircle className="h-4 w-4 ml-2" />}
                      {pendingAction.type === 'deactivate' && <AlertTriangle className="h-4 w-4 ml-2" />}
                      تأیید
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
