'use client';

import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface ParetoChartData {
  name: string;
  revenue: number;
  cumulativePercentage: number;
  abcCategory: 'A' | 'B' | 'C';
}

interface CustomParetoChartProps {
  data: ParetoChartData[];
  title?: string;
  height?: number;
  className?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    payload: ParetoChartData;
  }>;
  label?: string;
}

interface LegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const revenueData = payload.find((p) => p.dataKey === 'revenue');
    const percentageData = payload.find((p) => p.dataKey === 'cumulativePercentage');
    const data = payload[0]?.payload; // Get the full data object
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-900 dark:text-white font-medium mb-2">{data?.name || label}</p>
        {revenueData && (
          <p className="text-sm" style={{ color: revenueData.color }}>
            درآمد: {revenueData.value?.toLocaleString('fa-IR')} ریال
          </p>
        )}
        {percentageData && (
          <p className="text-sm" style={{ color: percentageData.color }}>
            درصد تجمعی: {percentageData.value?.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CustomLegend = (props: LegendProps) => {
  const { payload } = props;
  if (!payload) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index: number) => (
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

// ABC Category color mapping
const getCategoryColor = (category: 'A' | 'B' | 'C') => {
  switch (category) {
    case 'A': return '#10B981'; // green-500
    case 'B': return '#F59E0B'; // yellow-500
    case 'C': return '#EF4444'; // red-500
    default: return '#6B7280'; // gray-500
  }
};

export const CustomParetoChart: React.FC<CustomParetoChartProps> = ({
  data,
  title,
  height = 400,
  className = ''
}) => {
  if (data.length === 0) {
    return (
      <div className={className}>
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
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      
      {/* Legend for ABC thresholds */}
      <div className="flex justify-center gap-6 mb-6 text-xs bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">80% (حد A-B)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">95% (حد B-C)</span>
        </div>
      </div>
      
      <div className="w-full" style={{ height: height + 'px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 10, right: 40, left: 80, bottom: 120 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="opacity-30"
              stroke="currentColor"
            />
            <XAxis 
              dataKey="name"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={{ stroke: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
              angle={-45}
              textAnchor="end"
              height={120}
              interval={0}
              tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              axisLine={{ stroke: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
              label={{ 
                value: 'درآمد (ریال)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
              tickFormatter={(value) => value.toLocaleString('fa-IR', { notation: 'compact' })}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              axisLine={{ stroke: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
              label={{ 
                value: 'درصد تجمعی', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle' }
              }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            
            {/* Reference lines for 80% and 95% */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={() => 80}
              stroke="#9CA3AF"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="خط 80%"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={() => 95}
              stroke="#9CA3AF"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="خط 95%"
            />
            
            {/* Revenue bars */}
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="درآمد"
              radius={[2, 2, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getCategoryColor(entry.abcCategory)}
                  opacity={0.8}
                />
              ))}
            </Bar>
            
            {/* Cumulative percentage line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercentage"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563EB' }}
              activeDot={{ r: 6, fill: '#2563EB' }}
              name="درصد تجمعی"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 