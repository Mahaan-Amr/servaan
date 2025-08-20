// Chart Type Definitions for Frontend Components
// Replaces all 'any' types in chart components with proper interfaces

// ===================== BASE CHART TYPES =====================

/**
 * Base interface for all chart data points
 * Supports dynamic key-value pairs for flexible chart data
 */
export interface ChartDataPoint {
  [key: string]: string | number | Date | boolean | null | undefined;
}

/**
 * Common chart configuration interface
 */
export interface ChartConfig {
  dataKey: string;
  fill: string;
  stroke?: string;
  name: string;
  stackId?: string;
  fillOpacity?: number;
}

// ===================== TOOLTIP TYPES =====================

/**
 * Recharts tooltip payload entry structure
 */
export interface ChartTooltipPayload {
  value: number | string;
  name: string;
  color: string;
  dataKey: string;
  payload: ChartDataPoint;
  unit?: string;
}

/**
 * Recharts tooltip props structure
 */
export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string | number;
  coordinate?: {
    x: number;
    y: number;
  };
}

// ===================== LEGEND TYPES =====================

/**
 * Recharts legend payload entry structure
 */
export interface ChartLegendPayload {
  value: string;
  color: string;
  dataKey: string;
  type: string;
  payload: ChartDataPoint;
}

/**
 * Recharts legend props structure
 */
export interface ChartLegendProps {
  payload?: ChartLegendPayload[];
  content?: React.ReactElement;
  layout?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

// ===================== AREA CHART TYPES =====================

/**
 * Area chart specific configuration
 */
export interface AreaConfig extends ChartConfig {
  stackId?: string;
  fillOpacity?: number;
}

/**
 * Area chart props interface
 */
export interface AreaChartProps {
  data: ChartDataPoint[];
  areas: AreaConfig[];
  title?: string;
  height?: number;
  xAxisKey: string;
  className?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  referenceLines?: Array<{
    y?: number;
    x?: string;
    stroke?: string;
    strokeDasharray?: string;
    label?: string;
  }>;
}

// ===================== BAR CHART TYPES =====================

/**
 * Bar chart specific configuration
 */
export interface BarConfig extends ChartConfig {
  radius?: [number, number, number, number];
}

/**
 * Bar chart props interface
 */
export interface BarChartProps {
  data: ChartDataPoint[];
  bars: BarConfig[];
  title?: string;
  height?: number;
  xAxisKey: string;
  className?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

// ===================== LINE CHART TYPES =====================

/**
 * Line chart specific configuration
 */
export interface LineConfig extends ChartConfig {
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean | object;
  activeDot?: boolean | object;
}

/**
 * Line chart props interface
 */
export interface LineChartProps {
  data: ChartDataPoint[];
  lines: LineConfig[];
  title?: string;
  height?: number;
  xAxisKey: string;
  className?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
  smooth?: boolean;
}

// ===================== PIE CHART TYPES =====================

/**
 * Pie chart data structure
 */
export interface PieChartData {
  name: string;
  value: number;
  fill?: string;
  stroke?: string;
}

/**
 * Pie chart props interface
 */
export interface PieChartProps {
  data: PieChartData[];
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
}

// ===================== DONUT CHART TYPES =====================

/**
 * Donut chart props interface (extends pie chart)
 */
export interface DonutChartProps extends PieChartProps {
  innerRadius: number; // Required for donut charts
  showInnerLabels?: boolean;
}

// ===================== SCATTER CHART TYPES =====================

/**
 * Scatter chart data structure
 */
export interface ScatterChartData {
  x: number;
  y: number;
  z?: number;
  name?: string;
  fill?: string;
  stroke?: string;
}

/**
 * Scatter chart props interface
 */
export interface ScatterChartProps {
  data: ScatterChartData[];
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

// ===================== FORECAST CHART TYPES =====================

/**
 * Forecast data structure with confidence intervals
 */
export interface ForecastData {
  date: string | Date;
  actual?: number;
  forecast: number;
  lowerBound?: number;
  upperBound?: number;
  confidence?: number;
}

/**
 * Forecast chart props interface
 */
export interface ForecastChartProps {
  data: ForecastData[];
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  showConfidence?: boolean;
  showActual?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// ===================== MATRIX CHART TYPES =====================

/**
 * Matrix chart data structure
 */
export interface MatrixChartData {
  x: string | number;
  y: string | number;
  value: number;
  color?: string;
}

/**
 * Matrix chart props interface
 */
export interface MatrixChartProps {
  data: MatrixChartData[];
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorScale?: string[];
}

// ===================== MULTI-METRIC CHART TYPES =====================

/**
 * Multi-metric chart data structure
 */
export interface MultiMetricData {
  label: string;
  primary: number;
  secondary?: number;
  tertiary?: number;
  target?: number;
  color?: string;
}

/**
 * Multi-metric chart props interface
 */
export interface MultiMetricChartProps {
  data: MultiMetricData[];
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  showTarget?: boolean;
  showSecondary?: boolean;
  showTertiary?: boolean;
}

// ===================== PARETO CHART TYPES =====================

/**
 * Pareto chart data structure
 */
export interface ParetoChartData {
  category: string;
  value: number;
  cumulativePercentage?: number;
  color?: string;
}

/**
 * Pareto chart props interface
 */
export interface ParetoChartProps {
  data: ParetoChartData[];
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  showCumulative?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// ===================== KPI SCORECARD TYPES =====================

/**
 * KPI metric structure
 */
export interface KPIMetric {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  target?: number;
  unit?: string;
  color?: string;
  icon?: React.ReactNode;
}

/**
 * KPI scorecard props interface
 */
export interface KPIScorecardProps {
  metrics: KPIMetric[];
  title?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  showTargets?: boolean;
  showChanges?: boolean;
}

// ===================== COMMON CHART UTILITY TYPES =====================

/**
 * Chart color configuration
 */
export interface ChartColors {
  primary: string[];
  secondary: string[];
  accent: string[];
  neutral: string[];
}

/**
 * Chart theme configuration
 */
export interface ChartTheme {
  colors: ChartColors;
  fontFamily?: string;
  fontSize?: number;
  gridColor?: string;
  axisColor?: string;
  backgroundColor?: string;
}

/**
 * Chart animation configuration
 */
export interface ChartAnimation {
  duration?: number;
  easing?: string;
  delay?: number;
  repeat?: boolean;
}

/**
 * Chart responsive configuration
 */
export interface ChartResponsive {
  breakpoint: number;
  settings: Partial<ChartConfig>;
}
