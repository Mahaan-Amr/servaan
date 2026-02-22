'use client';

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragOverlay
} from '@dnd-kit/core';
import {
  useDroppable
} from '@dnd-kit/core';
import {
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  category: string;
  description?: string;
  table?: string;
}

interface ReportCanvasProps {
  fields: FieldDefinition[];
  onFieldsChange: (fields: FieldDefinition[]) => void;
  onFieldRemove?: (fieldId: string) => void;
  onFieldReorder?: (fields: FieldDefinition[]) => void;
  className?: string;
  useSharedContext?: boolean; // If true, don't create own DndContext
}

// Droppable Canvas Area
function DroppableCanvas({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'report-canvas'
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors
        ${isOver 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50'
        }
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
}

// Sortable Field Item in Canvas
function SortableFieldItem({ 
  field, 
  onRemove 
}: { 
  field: FieldDefinition; 
  onRemove?: (fieldId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: field.id,
    data: {
      type: 'canvas-field',
      field
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3
        shadow-sm hover:shadow-md transition-all duration-200
        ${isDragging ? 'shadow-lg z-50' : ''}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Drag Handle */}
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          
          <span className="text-xl">{getTypeIcon(field.type)}</span>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {field.label}
            </p>
            {field.category && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {field.category}
              </p>
            )}
          </div>
          
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(field.type)}`}>
            {field.type}
          </span>
        </div>
        
        {onRemove && (
          <button
            onClick={() => onRemove(field.id)}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-600 transition-colors"
            title="حذف فیلد"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export const ReportCanvas: React.FC<ReportCanvasProps> = ({
  fields,
  onFieldsChange,
  onFieldRemove,
  onFieldReorder,
  className = '',
  useSharedContext = false
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Handle field drop from palette
    if (active.data.current?.type === 'field' && over.id === 'report-canvas') {
      const field = active.data.current.field as FieldDefinition;
      if (!fields.find(f => f.id === field.id)) {
        onFieldsChange([...fields, field]);
      }
      return;
    }

    // Handle reordering within canvas
    if (active.data.current?.type === 'canvas-field' && over.data.current?.type === 'canvas-field') {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newFields = arrayMove(fields, oldIndex, newIndex);
        onFieldsChange(newFields);
        onFieldReorder?.(newFields);
      }
    }
  };

  const handleRemove = (fieldId: string) => {
    const newFields = fields.filter(f => f.id !== fieldId);
    onFieldsChange(newFields);
    onFieldRemove?.(fieldId);
  };

  const canvasContent = (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          ناحیه گزارش
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {fields.length} فیلد
        </span>
      </div>

      <DroppableCanvas>
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              فیلدها را از پالت بکشید و اینجا رها کنید
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              یا از لیست فیلدها انتخاب کنید
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map(field => (
              <SortableFieldItem
                key={field.id}
                field={field}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </DroppableCanvas>
    </div>
  );

  if (useSharedContext) {
    return canvasContent;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {canvasContent}
      <DragOverlay>
        {null}
      </DragOverlay>
    </DndContext>
  );
};

