'use client';

import React, { useRef, useState } from 'react';
import { exportChartToPNG, exportChartToSVG } from '../../utils/chartExport';
import { ChartTooltipProps } from '../../types/charts';

interface HeatmapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

interface CustomHeatmapChartProps {
  data: HeatmapDataPoint[];
  title?: string;
  height?: number;
  className?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorScale?: string[];
  enableExport?: boolean;
  chartId?: string;
  onCellClick?: (data: HeatmapDataPoint) => void;
  showTooltip?: boolean;
}

// Enhanced tooltip
const CustomTooltip: React.FC<ChartTooltipProps & { data?: HeatmapDataPoint }> = ({ active, data }) => {
  if (active && data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-bold mb-2">{data.label || `${data.x} × ${data.y}`}</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-600 dark:text-blue-400">
            مقدار: {typeof data.value === 'number' ? data.value.toLocaleString('fa-IR') : String(data.value)}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            X: {String(data.x)}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Y: {String(data.y)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const CustomHeatmapChart: React.FC<CustomHeatmapChartProps> = ({
  data,
  title,
  className = '',
  colorScale = ['#f0f9ff', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
  enableExport = false,
  chartId,
  onCellClick,
  showTooltip = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);
  const uniqueId = chartId || `heatmap-chart-${Math.random().toString(36).substr(2, 9)}`;

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

  // Get unique x and y values
  const xValues = Array.from(new Set(data.map(d => String(d.x)))).sort();
  const yValues = Array.from(new Set(data.map(d => String(d.y)))).sort();

  // Get min and max values for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Get color for a value
  const getColor = (value: number) => {
    const normalizedValue = (value - minValue) / valueRange;
    const colorIndex = Math.floor(normalizedValue * (colorScale.length - 1));
    return colorScale[Math.min(colorIndex, colorScale.length - 1)];
  };

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

      <div id={uniqueId} ref={containerRef} className="relative">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Y-Axis Labels */}
            <div className="flex">
              <div className="w-24 flex-shrink-0"></div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${xValues.length}, 1fr)` }}>
                {xValues.map((x, index) => (
                  <div key={index} className="text-center text-xs text-gray-600 dark:text-gray-400 p-2 border-b border-gray-200 dark:border-gray-700">
                    {x}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="flex">
              {/* Y-Axis */}
              <div className="w-24 flex-shrink-0 flex flex-col">
                {yValues.map((y, index) => (
                  <div key={index} className="flex-1 flex items-center justify-end text-xs text-gray-600 dark:text-gray-400 p-2 border-r border-gray-200 dark:border-gray-700">
                    {y}
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${xValues.length}, 1fr)`, gridTemplateRows: `repeat(${yValues.length}, 1fr)` }}>
                {yValues.map((y) =>
                  xValues.map((x) => {
                    const cellData = data.find(d => String(d.x) === x && String(d.y) === y);
                    const value = cellData?.value ?? 0;
                    const color = cellData ? getColor(value) : '#f3f4f6';
                    const isHovered = hoveredCell && hoveredCell.x === cellData?.x && hoveredCell.y === cellData?.y;

                    return (
                      <div
                        key={`${x}-${y}`}
                        className="relative border border-gray-200 dark:border-gray-700 transition-all duration-200 cursor-pointer"
                        style={{
                          backgroundColor: color,
                          minHeight: `${100 / yValues.length}%`,
                          opacity: cellData ? (isHovered ? 0.8 : 1) : 0.3
                        }}
                        onMouseEnter={() => cellData && setHoveredCell(cellData)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => cellData && onCellClick?.(cellData)}
                        title={cellData ? `${cellData.label || `${x} × ${y}`}: ${value.toLocaleString('fa-IR')}` : ''}
                      >
                        {cellData && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">
                            {value.toLocaleString('fa-IR', { notation: 'compact' })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {showTooltip && hoveredCell && (
          <div className="absolute z-10 pointer-events-none" style={{ top: '10px', right: '10px' }}>
            <CustomTooltip active={true} data={hoveredCell} />
          </div>
        )}

        {/* Color Scale Legend */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">کم</span>
          <div className="flex gap-1">
            {colorScale.map((color, index) => (
              <div
                key={index}
                className="w-6 h-4 rounded"
                style={{ backgroundColor: color }}
                title={`${minValue + (valueRange * index) / (colorScale.length - 1)}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">زیاد</span>
        </div>

        {/* Value Range */}
        <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          محدوده: {minValue.toLocaleString('fa-IR')} - {maxValue.toLocaleString('fa-IR')}
        </div>
      </div>
    </div>
  );
};
