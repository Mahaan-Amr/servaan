'use client';

import React, { useRef, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import { 
  ChartTooltipProps, 
  ChartLegendProps 
} from '../../types/charts';
import { exportChartToPNG, exportChartToSVG } from '../../utils/chartExport';
import { ChartKeyboardShortcuts, ZoomState } from '../../utils/chartInteractivity';

// Maintain backward compatibility with existing interfaces
interface LegacyLineChartData {
  [key: string]: unknown;
}

interface LegacyLineConfig {
  dataKey: string;
  fill: string;
  stroke: string;
  name: string;
}

interface LegacyCustomLineChartProps {
  data: LegacyLineChartData[];
  lines: LegacyLineConfig[];
  title?: string;
  height?: number;
  xAxisKey: string;
  className?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  enableExport?: boolean;
  chartId?: string;
  enableZoom?: boolean;
  enableDrillDown?: boolean;
  onDrillDown?: (data: LegacyLineChartData) => void;
  enableKeyboardShortcuts?: boolean;
}

// Enhanced tooltip with proper typing
const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('fa-IR') : String(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Enhanced legend with proper typing
const CustomLegend: React.FC<ChartLegendProps> = ({ payload }) => {
  if (!payload) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const CustomLineChart: React.FC<LegacyCustomLineChartProps> = ({
  data,
  lines,
  title,
  height = 300,
  xAxisKey,
  className = '',
  yAxisLabel,
  xAxisLabel,
  enableExport = false,
  chartId,
  enableZoom = false,
  enableDrillDown = false,
  onDrillDown,
  enableKeyboardShortcuts = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = chartId || `line-chart-${Math.random().toString(36).substr(2, 9)}`;
  const [zoomState, setZoomState] = useState<ZoomState>({ isZoomed: false });
  const [displayedData, setDisplayedData] = useState(data);
  const keyboardShortcutsRef = useRef<ChartKeyboardShortcuts | null>(null);

  // Initialize keyboard shortcuts
  useEffect(() => {
    if (enableKeyboardShortcuts) {
      keyboardShortcutsRef.current = new ChartKeyboardShortcuts();
      
      // Register shortcuts
      keyboardShortcutsRef.current.register('r', () => {
        setZoomState({ isZoomed: false });
        setDisplayedData(data);
      });
      
      keyboardShortcutsRef.current.register('ctrl+z', () => {
        setZoomState({ isZoomed: false });
        setDisplayedData(data);
      });
      
      return () => {
        keyboardShortcutsRef.current?.destroy();
      };
    }
  }, [enableKeyboardShortcuts, data]);

  // Update displayed data when zoom changes
  useEffect(() => {
    if (zoomState.isZoomed && zoomState.xMin !== undefined && zoomState.xMax !== undefined) {
      const filtered = data.filter((_, index) => {
        return index >= zoomState.xMin! && index <= zoomState.xMax!;
      });
      setDisplayedData(filtered);
    } else {
      setDisplayedData(data);
    }
  }, [zoomState, data]);

  const handleExportPNG = async () => {
    try {
      await exportChartToPNG(uniqueId, `${title || 'chart'}-${Date.now()}.png`);
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      alert('خطا در صادرات نمودار به PNG');
    }
  };

  const handleExportSVG = () => {
    try {
      exportChartToSVG(uniqueId, `${title || 'chart'}-${Date.now()}.svg`);
    } catch (error) {
      console.error('Error exporting to SVG:', error);
      alert('خطا در صادرات نمودار به SVG');
    }
  };
  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        {enableExport && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1"
              title="صادرات به PNG"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PNG
            </button>
            <button
              onClick={handleExportSVG}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1"
              title="صادرات به SVG"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              SVG
            </button>
          </div>
        )}
      </div>
      
      <div id={uniqueId} ref={containerRef}>
        <ResponsiveContainer width="100%" height={height}>
        <LineChart 
          data={displayedData} 
          margin={{ top: 5, right: 30, left: 20, bottom: enableZoom ? 60 : 5 }}
          onClick={(chartData) => {
            if (enableDrillDown && chartData && chartData.activePayload && chartData.activePayload[0]) {
              const clickedData = chartData.activePayload[0].payload as LegacyLineChartData;
              onDrillDown?.(clickedData);
            }
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="opacity-30"
            stroke="currentColor"
          />
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            tickLine={{ stroke: 'currentColor' }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'currentColor' }}
            axisLine={{ stroke: 'currentColor' }}
            tickLine={{ stroke: 'currentColor' }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: '#8884d8', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Legend content={<CustomLegend />} />
          
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              fill={line.fill}
              name={line.name}
              dot={{ fill: line.fill, strokeWidth: 2, r: enableDrillDown ? 5 : 4, cursor: enableDrillDown ? 'pointer' : 'default' }}
              activeDot={{ 
                r: 8, 
                stroke: line.stroke, 
                strokeWidth: 2,
                cursor: enableDrillDown ? 'pointer' : 'default'
              }}
            />
          ))}
          
          {enableZoom && (
            <Brush
              dataKey={xAxisKey}
              height={30}
              stroke="#8884d8"
              onChange={(brushData) => {
                if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
                  setZoomState({
                    xMin: brushData.startIndex,
                    xMax: brushData.endIndex,
                    isZoomed: brushData.startIndex !== brushData.endIndex
                  });
                } else {
                  setZoomState({ isZoomed: false });
                }
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      </div>
      
      {/* Zoom Controls */}
      {enableZoom && zoomState.isZoomed && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setZoomState({ isZoomed: false });
              setDisplayedData(data);
            }}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="بازنشانی زوم (R)"
          >
            بازنشانی زوم
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            نمایش {displayedData.length} از {data.length} نقطه
          </span>
        </div>
      )}
      
      {/* Keyboard Shortcuts Hint */}
      {enableKeyboardShortcuts && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          میانبر: R - بازنشانی زوم | Ctrl+Z - بازگشت
        </div>
      )}
    </div>
  );
}; 