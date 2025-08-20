'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { TableService } from '../../../../../services/orderingService';
import { TableStatus } from '../../../../../types/ordering';

interface TableWithPosition {
  id: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  status: TableStatus;
  section?: string;
  floor: number;
  positionX?: number;
  positionY?: number;
  isActive: boolean;
  currentOrder?: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
  };
}

interface LayoutData {
  [floor: number]: {
    [section: string]: TableWithPosition[];
  };
}

interface TableLayoutDesignerProps {
  onTableClick?: (table: TableWithPosition) => void;
  onTableStatusChange?: (tableId: string, newStatus: TableStatus) => void;
  showStatusIndicators?: boolean;
  showCapacity?: boolean;
  showOrders?: boolean;
}

export default function TableLayoutDesigner({
  onTableClick,
  onTableStatusChange,
  showStatusIndicators = true,
  showCapacity = true,
  showOrders = true
}: TableLayoutDesignerProps) {
  // State management
  const [layoutData, setLayoutData] = useState<LayoutData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string>('Main');
  const [editMode, setEditMode] = useState(false);
  const [draggedTable, setDraggedTable] = useState<TableWithPosition | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load layout data
  const loadLayoutData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await TableService.getTableLayout() as {
        success: boolean;
        data: LayoutData;
        message?: string;
      };

      if (response.success) {
        setLayoutData(response.data);
        
        // Set initial floor and section
        const floors = Object.keys(response.data).map(Number).sort((a, b) => a - b);
        if (floors.length > 0) {
          setSelectedFloor(floors[0]);
          const sections = Object.keys(response.data[floors[0]] || {});
          if (sections.length > 0) {
            setSelectedSection(sections[0]);
          }
        }
      } else {
        throw new Error(response.message || 'خطا در دریافت اطلاعات نقشه میزها');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات نقشه میزها';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadLayoutData();
  }, [loadLayoutData]);

  // Get available floors and sections
  const floors = Object.keys(layoutData).map(Number).sort((a, b) => a - b);
  const sections = selectedFloor ? Object.keys(layoutData[selectedFloor] || {}) : [];

  // Get current tables
  const currentTables = selectedFloor && selectedSection 
    ? layoutData[selectedFloor]?.[selectedSection] || []
    : [];

  // Handle table drag start
  const handleTableDragStart = (e: React.DragEvent, table: TableWithPosition) => {
    if (!editMode) return;
    
    setDraggedTable(table);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', table.id);
  };

  // Handle table drag end
  const handleTableDragEnd = async (e: React.DragEvent, table: TableWithPosition) => {
    if (!editMode || !draggedTable) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const newX = (e.clientX - canvasRect.left - dragOffset.x) / scale;
    const newY = (e.clientY - canvasRect.top - dragOffset.y) / scale;

    try {
      await TableService.updateTable(table.id, {
        positionX: Math.max(0, newX),
        positionY: Math.max(0, newY)
      });

      toast.success('موقعیت میز با موفقیت تغییر کرد');
      loadLayoutData(); // Reload to get updated positions
    } catch {
      toast.error('خطا در تغییر موقعیت میز');
    }

    setDraggedTable(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Handle canvas drag start
  const handleCanvasDragStart = (e: React.MouseEvent) => {
    if (editMode) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Handle canvas drag move
  const handleCanvasDragMove = (e: React.MouseEvent) => {
    if (!isDragging || editMode) return;
    
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  // Handle canvas drag end
  const handleCanvasDragEnd = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  // Get status color
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500';
      case 'OCCUPIED':
        return 'bg-red-500';
      case 'RESERVED':
        return 'bg-blue-500';
      case 'CLEANING':
        return 'bg-yellow-500';
      case 'OUT_OF_ORDER':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Get status text
  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'آزاد';
      case 'OCCUPIED':
        return 'مشغول';
      case 'RESERVED':
        return 'رزرو شده';
      case 'CLEANING':
        return 'در حال تمیزکاری';
      case 'OUT_OF_ORDER':
        return 'خارج از سرویس';
      default:
        return status;
    }
  };

  // Handle table click
  const handleTableClick = (table: TableWithPosition) => {
    if (onTableClick) {
      onTableClick(table);
    }
  };

  // Handle table status change
  const handleStatusChange = async (tableId: string, newStatus: TableStatus) => {
    try {
      await TableService.changeTableStatus(tableId, newStatus);
      toast.success('وضعیت میز با موفقیت تغییر کرد');
      loadLayoutData(); // Reload data
      
      if (onTableStatusChange) {
        onTableStatusChange(tableId, newStatus);
      }
    } catch {
      toast.error('خطا در تغییر وضعیت میز');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطا در بارگذاری</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={loadLayoutData}
          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Floor Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              طبقه
            </label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
            >
              {floors.map(floor => (
                <option key={floor} value={floor}>طبقه {floor}</option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              بخش
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
            >
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Edit Mode Toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              editMode
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {editMode ? 'خروج از حالت ویرایش' : 'حالت ویرایش'}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setScale(prev => Math.max(0.5, prev * 0.9))}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(prev => Math.min(2, prev * 1.1))}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Reset View */}
          <button
            onClick={() => {
              setScale(1);
              setPan({ x: 0, y: 0 });
            }}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
          >
            بازنشانی
          </button>
        </div>
      </div>

      {/* Layout Canvas */}
      <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
        <div
          ref={canvasRef}
          className="relative w-full h-[600px] cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasDragStart}
          onMouseMove={handleCanvasDragMove}
          onMouseUp={handleCanvasDragEnd}
          onMouseLeave={handleCanvasDragEnd}
          onWheel={handleWheel}
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>

          {/* Tables */}
          {currentTables.map((table) => (
            <div
              key={table.id}
              draggable={editMode}
              onDragStart={(e) => handleTableDragStart(e, table)}
              onDragEnd={(e) => handleTableDragEnd(e, table)}
              onClick={() => handleTableClick(table)}
              className={`absolute cursor-pointer transition-all duration-200 hover:scale-105 ${
                editMode ? 'cursor-move' : ''
              }`}
              style={{
                left: table.positionX || 50,
                top: table.positionY || 50,
                width: Math.max(60, table.capacity * 10),
                height: Math.max(60, table.capacity * 10)
              }}
            >
              {/* Table Element */}
              <div className={`relative w-full h-full rounded-lg border-2 shadow-lg ${
                table.status === 'AVAILABLE' ? 'bg-green-100 border-green-300' :
                table.status === 'OCCUPIED' ? 'bg-red-100 border-red-300' :
                table.status === 'RESERVED' ? 'bg-blue-100 border-blue-300' :
                table.status === 'CLEANING' ? 'bg-yellow-100 border-yellow-300' :
                'bg-gray-100 border-gray-300'
              } hover:shadow-xl transition-all duration-200`}>
                
                {/* Status Indicator */}
                {showStatusIndicators && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(table.status)}`}></div>
                )}

                {/* Table Content */}
                <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    میز {table.tableNumber}
                  </div>
                  
                  {table.tableName && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {table.tableName}
                    </div>
                  )}
                  
                  {showCapacity && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {table.capacity} نفر
                    </div>
                  )}

                  {/* Current Order Indicator */}
                  {showOrders && table.currentOrder && (
                    <div className="absolute -bottom-1 -left-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full">
                      سفارش
                    </div>
                  )}
                </div>

                {/* Quick Status Change Menu (in edit mode) */}
                {editMode && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-10 min-w-[120px]">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تغییر وضعیت:
                    </div>
                    {Object.values(TableStatus).map((status) => (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(table.id, status);
                        }}
                        className={`block w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          table.status === status ? 'bg-amber-100 dark:bg-amber-900' : ''
                        }`}
                      >
                        {getStatusText(status)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {currentTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  هیچ میزی در این بخش یافت نشد
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  برای اضافه کردن میز جدید، از بخش مدیریت میزها استفاده کنید.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {editMode && (
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div className="font-medium mb-1">راهنمای ویرایش:</div>
              <div>• میزها را بکشید تا موقعیت آنها را تغییر دهید</div>
              <div>• روی میز کلیک کنید تا وضعیت آن را تغییر دهید</div>
              <div>• از دکمه‌های + و - برای بزرگنمایی استفاده کنید</div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">راهنمای رنگ‌ها:</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.values(TableStatus).map((status) => (
            <div key={status} className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{getStatusText(status)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 