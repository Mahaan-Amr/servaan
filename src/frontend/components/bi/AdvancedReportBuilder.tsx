'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragOverlay
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { ReportFieldPalette } from './ReportFieldPalette';
import { ReportCanvas } from './ReportCanvas';
import { ReportTypeSelector, ReportType } from './ReportTypeSelector';
import { FormattingOptionsPanel, FieldFormatting } from './FormattingOptionsPanel';
import { CalculationsBuilder, ReportCalculation } from './CalculationsBuilder';
import { FiltersBuilder } from './FiltersBuilder';
import { SortingBuilder, ReportSorting } from './SortingBuilder';
import { GroupingBuilder, ReportGrouping } from './GroupingBuilder';
import { ReportFilter } from '../../services/reportService';

interface FieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  category: string;
  description?: string;
  table?: string;
}

interface AdvancedReportBuilderProps {
  availableFields: FieldDefinition[];
  selectedFields: FieldDefinition[];
  onFieldsChange: (fields: FieldDefinition[]) => void;
  reportName: string;
  reportType: ReportType;
  onReportTypeChange: (type: ReportType) => void;
  formatting: FieldFormatting[];
  onFormattingChange: (formatting: FieldFormatting[]) => void;
  calculations: ReportCalculation[];
  onCalculationsChange: (calculations: ReportCalculation[]) => void;
  filters: ReportFilter[];
  onFiltersChange: (filters: ReportFilter[]) => void;
  sorting: ReportSorting[];
  onSortingChange: (sorting: ReportSorting[]) => void;
  grouping: ReportGrouping[];
  onGroupingChange: (grouping: ReportGrouping[]) => void;
  onSave?: () => void;
  onPreview?: () => void;
  className?: string;
}

type TabType = 'fields' | 'type' | 'formatting' | 'calculations' | 'filters' | 'sorting' | 'grouping' | 'preview';

export const AdvancedReportBuilder: React.FC<AdvancedReportBuilderProps> = ({
  availableFields,
  selectedFields,
  onFieldsChange,
  reportName,
  reportType,
  onReportTypeChange,
  formatting,
  onFormattingChange,
  calculations,
  onCalculationsChange,
  filters,
  onFiltersChange,
  sorting,
  onSortingChange,
  grouping,
  onGroupingChange,
  onSave,
  onPreview,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('fields');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Shared DndContext sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeField = useMemo(() => {
    if (!activeId) return null;
    // Check if it's a field from palette (prefixed with 'field-')
    if (activeId.toString().startsWith('field-')) {
      const fieldId = activeId.toString().replace('field-', '');
      return availableFields.find(f => f.id === fieldId);
    }
    // Otherwise it's a field from canvas
    return selectedFields.find(f => f.id === activeId);
  }, [activeId, availableFields, selectedFields]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle field drop from palette to canvas
    if (active.data.current?.type === 'field' && over.id === 'report-canvas') {
      const field = active.data.current.field as FieldDefinition;
      if (!selectedFields.find(f => f.id === field.id)) {
        onFieldsChange([...selectedFields, field]);
      }
      return;
    }

    // Handle reordering within canvas
    if (active.data.current?.type === 'canvas-field' && over.data.current?.type === 'canvas-field') {
      const oldIndex = selectedFields.findIndex(f => f.id === active.id);
      const newIndex = selectedFields.findIndex(f => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newFields = arrayMove(selectedFields, oldIndex, newIndex);
        onFieldsChange(newFields);
      }
    }
  }, [selectedFields, onFieldsChange]);

  const handleFieldAdd = useCallback((field: FieldDefinition) => {
    if (!selectedFields.find(f => f.id === field.id)) {
      onFieldsChange([...selectedFields, field]);
    }
  }, [selectedFields, onFieldsChange]);

  const handleFieldRemove = useCallback((fieldId: string) => {
    onFieldsChange(selectedFields.filter(f => f.id !== fieldId));
  }, [selectedFields, onFieldsChange]);

  const handleFieldReorder = useCallback((fields: FieldDefinition[]) => {
    onFieldsChange(fields);
  }, [onFieldsChange]);

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'fields', label: 'فیلدها', icon: '📋' },
    { id: 'type', label: 'نوع گزارش', icon: '📊' },
    { id: 'formatting', label: 'فرمت', icon: '🎨' },
    { id: 'calculations', label: 'محاسبات', icon: '🔢' },
    { id: 'filters', label: 'فیلترها', icon: '🔍' },
    { id: 'sorting', label: 'مرتب‌سازی', icon: '↕️' },
    { id: 'grouping', label: 'گروه‌بندی', icon: '📦' },
    { id: 'preview', label: 'پیش‌نمایش', icon: '👁️' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fields Tab */}
      {activeTab === 'fields' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-4">
            <div>
              <ReportFieldPalette
                availableFields={availableFields}
                onFieldAdd={handleFieldAdd}
                selectedFields={selectedFields.map(f => f.id)}
                useSharedContext={true}
              />
            </div>
            <div>
              <ReportCanvas
                fields={selectedFields}
                onFieldsChange={onFieldsChange}
                onFieldRemove={handleFieldRemove}
                onFieldReorder={handleFieldReorder}
                useSharedContext={true}
              />
            </div>
          </div>
          <DragOverlay>
            {activeField ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-500 p-3 shadow-xl opacity-90">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {activeField.label}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Report Type Tab */}
      {activeTab === 'type' && (
        <ReportTypeSelector
          selectedType={reportType}
          onTypeChange={onReportTypeChange}
        />
      )}

      {/* Formatting Tab */}
      {activeTab === 'formatting' && (
        <FormattingOptionsPanel
          fields={selectedFields}
          formatting={formatting}
          onFormattingChange={onFormattingChange}
        />
      )}

      {/* Calculations Tab */}
      {activeTab === 'calculations' && (
        <CalculationsBuilder
          fields={selectedFields}
          calculations={calculations}
          onCalculationsChange={onCalculationsChange}
        />
      )}

      {/* Filters Tab */}
      {activeTab === 'filters' && (
        <FiltersBuilder
          fields={selectedFields}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )}

      {/* Sorting Tab */}
      {activeTab === 'sorting' && (
        <SortingBuilder
          fields={selectedFields}
          sorting={sorting}
          onSortingChange={onSortingChange}
        />
      )}

      {/* Grouping Tab */}
      {activeTab === 'grouping' && (
        <GroupingBuilder
          fields={selectedFields}
          grouping={grouping}
          onGroupingChange={onGroupingChange}
        />
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              پیش‌نمایش گزارش
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reportName || 'گزارش بدون نام'} - {reportType}
            </p>
          </div>

          {selectedFields.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                هیچ فیلدی انتخاب نشده است
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {selectedFields.map((field, index) => (
                        <th
                          key={field.id}
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <span>{index + 1}</span>
                            <span>{field.label}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              field.type === 'text' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              field.type === 'number' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              field.type === 'date' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                              field.type === 'currency' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {field.type}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {[1, 2, 3].map((row) => (
                      <tr key={row} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {selectedFields.map(field => (
                          <td
                            key={field.id}
                            className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300"
                          >
                            <span className="text-gray-400 dark:text-gray-500">
                              {field.type === 'number' || field.type === 'currency' ? '0' :
                               field.type === 'date' ? '1403/01/01' :
                               field.type === 'boolean' ? '✓' :
                               'مقدار نمونه'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">فیلدها</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{selectedFields.length}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">فیلترها</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{filters.length}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">مرتب‌سازی</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{sorting.length}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">محاسبات</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{calculations.length}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={onPreview}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              اجرای پیش‌نمایش
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSave}
          disabled={!reportName.trim() || selectedFields.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ذخیره گزارش
        </button>
      </div>
    </div>
  );
};

