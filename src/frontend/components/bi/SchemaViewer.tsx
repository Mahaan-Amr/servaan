'use client';

import React, { useState, useEffect } from 'react';
import { biService } from '../../services/biService';

interface SchemaViewerProps {
  workspace?: 'ordering' | 'inventory';
  className?: string;
}

interface SchemaData {
  tables: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      nullable: boolean;
      description?: string;
    }>;
    primaryKey: string;
    indexes: string[];
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    key: string;
  }>;
}

interface Schema {
  workspace?: string;
  name?: string;
  schema?: SchemaData;
  workspaces?: Array<{
    workspace: string;
    name: string;
    schema: SchemaData;
  }>;
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ workspace, className = '' }) => {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSchema();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const loadSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await biService.getSchema(workspace);
      setSchema(data as Schema);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت schema');
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const renderSchema = (schemaData: Schema['schema']) => {
    if (!schemaData) return null;

    return (
      <div className="space-y-4">
        {schemaData.tables.map((table) => (
          <div key={table.name} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleTable(table.name)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-white">{table.name}</span>
                {table.primaryKey && (
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded">
                    PK: {table.primaryKey}
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${expandedTables.has(table.name) ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedTables.has(table.name) && (
              <div className="p-4 bg-white dark:bg-gray-900">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">فیلدها:</h4>
                  {table.fields.map((field) => (
                    <div key={field.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">{field.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {field.type}
                        </span>
                        {!field.nullable && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded">
                            NOT NULL
                          </span>
                        )}
                      </div>
                      {field.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{field.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">در حال بارگذاری schema...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadSchema}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Schema Viewer
          {workspace && <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">({workspace})</span>}
        </h3>
        <button
          onClick={loadSchema}
          className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          بروزرسانی
        </button>
      </div>

      {schema?.schema && renderSchema(schema.schema)}
      {schema?.workspaces && (
        <div className="space-y-6">
          {schema.workspaces.map((ws) => (
            <div key={ws.workspace}>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                {ws.name} ({ws.workspace})
              </h4>
              {renderSchema(ws.schema)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

