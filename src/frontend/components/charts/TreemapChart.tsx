'use client';

import React, { useRef, useState, useMemo } from 'react';
import { exportChartToPNG, exportChartToSVG } from '../../utils/chartExport';
import { ChartTooltipProps } from '../../types/charts';

interface TreemapDataPoint {
  name: string;
  value: number;
  children?: TreemapDataPoint[];
  fill?: string;
  metadata?: Record<string, unknown>;
}

interface TreemapNode {
  x: number;
  y: number;
  width: number;
  height: number;
  data: TreemapDataPoint;
  level: number;
}

interface CustomTreemapChartProps {
  data: TreemapDataPoint[];
  title?: string;
  height?: number;
  className?: string;
  enableExport?: boolean;
  chartId?: string;
  onNodeClick?: (data: TreemapDataPoint) => void;
  showTooltip?: boolean;
  maxDepth?: number;
}

// Enhanced tooltip
const CustomTooltip: React.FC<ChartTooltipProps & { data?: TreemapDataPoint }> = ({ active, data }) => {
  if (active && data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-bold mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-600 dark:text-blue-400">
            مقدار: {typeof data.value === 'number' ? data.value.toLocaleString('fa-IR') : String(data.value)}
          </p>
          {data.children && (
            <p className="text-gray-600 dark:text-gray-400">
              زیرمجموعه: {data.children.length} مورد
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Squarified treemap algorithm
function squarify(nodes: TreemapDataPoint[], x: number, y: number, width: number, height: number, result: TreemapNode[], level: number = 0): void {
  if (nodes.length === 0) return;

  const totalValue = nodes.reduce((sum, node) => sum + node.value, 0);
  if (totalValue === 0) return;

  // Sort by value descending
  const sortedNodes = [...nodes].sort((a, b) => b.value - a.value);

  // Determine layout direction (horizontal or vertical)
  const isHorizontal = width > height;

    let currentX = x;
    let currentY = y;
    let remainingWidth = width;
    let remainingHeight = height;

  for (const node of sortedNodes) {
    const nodeValue = node.value;
    const nodeRatio = nodeValue / totalValue;
    
    if (isHorizontal) {
      const nodeWidth = width * nodeRatio;
      const nodeHeight = remainingHeight;
      
      result.push({
        x: currentX,
        y: currentY,
        width: nodeWidth,
        height: nodeHeight,
        data: node,
        level
      });

      currentX += nodeWidth;
      remainingWidth -= nodeWidth;
    } else {
      const nodeHeight = height * nodeRatio;
      const nodeWidth = remainingWidth;
      
      result.push({
        x: currentX,
        y: currentY,
        width: nodeWidth,
        height: nodeHeight,
        data: node,
        level
      });

      currentY += nodeHeight;
      remainingHeight -= nodeHeight;
    }
  }
}

export const CustomTreemapChart: React.FC<CustomTreemapChartProps> = ({
  data,
  title,
  height = 400,
  className = '',
  enableExport = false,
  chartId,
  onNodeClick,
  showTooltip = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<TreemapNode | null>(null);
  const uniqueId = chartId || `treemap-chart-${Math.random().toString(36).substr(2, 9)}`;

  // Flatten data for treemap
  const flattenedData = useMemo(() => {
    const flatten = (nodes: TreemapDataPoint[], parentName = ''): TreemapDataPoint[] => {
      const result: TreemapDataPoint[] = [];
      nodes.forEach(node => {
        const fullName = parentName ? `${parentName} > ${node.name}` : node.name;
        result.push({
          ...node,
          name: fullName,
          children: undefined // Remove children for flattened view
        });
        if (node.children && node.children.length > 0) {
          result.push(...flatten(node.children, fullName));
        }
      });
      return result;
    };
    return flatten(data);
  }, [data]);

  // Calculate treemap layout
  const treemapNodes = useMemo(() => {
    const nodes: TreemapNode[] = [];
    squarify(flattenedData, 0, 0, 100, 100, nodes, 0);
    return nodes;
  }, [flattenedData]);

  // Get color scale
  const values = flattenedData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const colorScale = ['#f0f9ff', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'];
  const getColor = (value: number, defaultColor?: string) => {
    if (defaultColor) return defaultColor;
    const normalizedValue = (value - minValue) / valueRange;
    const colorIndex = Math.floor(normalizedValue * (colorScale.length - 1));
    return colorScale[Math.min(colorIndex, colorScale.length - 1)];
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

      <div id={uniqueId} ref={containerRef} className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {treemapNodes.map((node, index) => {
            const color = getColor(node.data.value, node.data.fill);
            const isHovered = hoveredNode === node;
            const fontSize = Math.max(10, Math.min(node.width, node.height) / 10);

            return (
              <g key={index}>
                <rect
                  x={`${node.x}%`}
                  y={`${node.y}%`}
                  width={`${node.width}%`}
                  height={`${node.height}%`}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={isHovered ? 3 : 1}
                  opacity={isHovered ? 0.9 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onNodeClick?.(node.data)}
                />
                {node.width > 5 && node.height > 5 && (
                  <text
                    x={`${node.x + node.width / 2}%`}
                    y={`${node.y + node.height / 2}%`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fill="#1f2937"
                    className="pointer-events-none font-medium"
                  >
                    {node.data.name.length > 15 ? `${node.data.name.substring(0, 15)}...` : node.data.name}
                  </text>
                )}
                {node.width > 8 && node.height > 8 && (
                  <text
                    x={`${node.x + node.width / 2}%`}
                    y={`${node.y + node.height / 2 + fontSize}%`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize * 0.7}
                    fill="#6b7280"
                    className="pointer-events-none"
                  >
                    {node.data.value.toLocaleString('fa-IR', { notation: 'compact' })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {showTooltip && hoveredNode && (
          <div className="absolute z-10 pointer-events-none" style={{ top: '10px', right: '10px' }}>
            <CustomTooltip active={true} data={hoveredNode.data} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400">کم</span>
        <div className="flex gap-1">
          {colorScale.map((color, index) => (
            <div
              key={index}
              className="w-6 h-4 rounded"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">زیاد</span>
      </div>
    </div>
  );
};

