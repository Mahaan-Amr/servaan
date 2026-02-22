'use client';

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter
} from '@dnd-kit/core';
import {
  useDraggable
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

interface FieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  category: string;
  description?: string;
  table?: string;
  fieldName?: string;
}

interface ReportFieldPaletteProps {
  availableFields: FieldDefinition[];
  onFieldAdd?: (field: FieldDefinition) => void;
  selectedFields?: string[];
  className?: string;
  useSharedContext?: boolean; // If true, don't create own DndContext
}

// Draggable Field Item
function DraggableField({ 
  field, 
  isSelected, 
  onFieldClick 
}: { 
  field: FieldDefinition; 
  isSelected: boolean;
  onFieldClick?: (field: FieldDefinition) => void;
}) {
  // Debug: Log field data to verify label is present
  if (!field.label || field.label.trim() === '') {
    console.warn('Field missing label:', {
      id: field.id,
      label: field.label,
      table: field.table,
      fieldName: field.fieldName,
      type: field.type
    });
  }

  // Ensure we have a display label
  const displayLabel = field.label || (field.table && field.fieldName ? `${field.table}.${field.fieldName}` : field.id) || 'بدون نام';

  // Debug: Log fields to see what we're receiving (limit to first few to avoid spam)
  if (field.id.startsWith('orders_') && (field.id === 'orders_orderNumber' || field.id === 'orders_id' || field.id === 'orders_orderDate')) {
    console.log('DraggableField rendering:', {
      id: field.id,
      label: field.label,
      labelType: typeof field.label,
      labelLength: field.label?.length || 0,
      labelValue: JSON.stringify(field.label),
      table: field.table,
      fieldName: field.fieldName,
      type: field.type,
      displayLabel,
      displayLabelType: typeof displayLabel,
      displayLabelLength: displayLabel?.length || 0,
      displayLabelValue: JSON.stringify(displayLabel)
    });
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `field-${field.id}`,
    data: {
      type: 'field',
      field
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'number':
        return '🔢';
      case 'date':
        return '📅';
      case 'currency':
        return '💰';
      case 'boolean':
        return '✓';
      default:
        return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'number':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'date':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'currency':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'boolean':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Handle click to add field (only if not dragging)
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if user is dragging
    if (isDragging || !onFieldClick) return;
    
    // Prevent default and stop propagation to avoid conflicts with drag
    e.preventDefault();
    e.stopPropagation();
    
    // Add the field
    onFieldClick(field);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`
        p-3 rounded-lg border-2 border-dashed cursor-pointer
        transition-all duration-200 hover:shadow-md hover:border-blue-400
        ${isDragging ? 'opacity-50 shadow-lg cursor-grabbing' : 'opacity-100 cursor-pointer'}
        ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <span className="text-xl flex-shrink-0">{getTypeIcon(field.type)}</span>
        
        {/* Label - must have flex-1 and min-w-0 to allow text truncation */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p 
            className="text-sm font-medium text-gray-900 dark:text-white"
            style={{ 
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              minHeight: '1.25rem',
              lineHeight: '1.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              maxWidth: '100%'
            }}
            title={displayLabel}
          >
            {displayLabel || 'NO LABEL'}
          </p>
          {field.category && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {field.category}
            </p>
          )}
        </div>
        
        {/* Type badge - flex-shrink-0 to prevent it from shrinking */}
        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getTypeColor(field.type)}`}>
          {field.type}
        </span>
      </div>
      {isSelected && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          انتخاب شده
        </div>
      )}
    </div>
  );
}

export const ReportFieldPalette: React.FC<ReportFieldPaletteProps> = ({
  availableFields,
  onFieldAdd,
  selectedFields = [],
  className = '',
  useSharedContext = false
}) => {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'field') {
      const field = active.data.current.field as FieldDefinition;
      onFieldAdd?.(field);
    }
  };

  // Group fields by category
  const fieldsByCategory = React.useMemo(() => {
    const grouped: Record<string, FieldDefinition[]> = {};
    
    // Debug: Log first few fields to verify labels are present
    if (availableFields.length > 0) {
      console.log('ReportFieldPalette - availableFields sample:', availableFields.slice(0, 3).map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        category: f.category,
        table: f.table,
        fieldName: f.fieldName
      })));
    }
    
    availableFields.forEach(field => {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    });
    return grouped;
  }, [availableFields]);

  const paletteContent = (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {Object.entries(fieldsByCategory).map(([category, fields]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10">
            {category}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields.map(field => {
              // Debug: Log field before rendering
              if (field.id === 'orders_orderNumber' || field.id === 'orders_id') {
                console.log('Rendering DraggableField with field:', {
                  id: field.id,
                  label: field.label,
                  displayLabel: field.label || (field.table && field.fieldName ? `${field.table}.${field.fieldName}` : field.id) || 'بدون نام',
                  type: field.type,
                  hasLabel: !!field.label,
                  labelLength: field.label?.length || 0
                });
              }
              return (
                <DraggableField
                  key={field.id}
                  field={field}
                  isSelected={selectedFields.includes(field.id)}
                  onFieldClick={onFieldAdd}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          فیلدهای موجود
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {availableFields.length} فیلد
        </span>
      </div>

      {useSharedContext ? (
        paletteContent
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {paletteContent}
        </DndContext>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 فیلدها را بکشید و در ناحیه گزارش رها کنید
        </p>
      </div>
    </div>
  );
};

