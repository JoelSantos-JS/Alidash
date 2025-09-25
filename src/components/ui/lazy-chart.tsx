"use client";

import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load dos componentes de gráfico
const LazyBarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const LazyPieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));
const LazyLineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })));

// Lazy load de outros componentes recharts
const LazyBar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const LazyPie = lazy(() => import('recharts').then(module => ({ default: module.Pie })));
const LazyLine = lazy(() => import('recharts').then(module => ({ default: module.Line })));
const LazyXAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const LazyYAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const LazyCartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const LazyTooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const LazyLegend = lazy(() => import('recharts').then(module => ({ default: module.Legend })));
const LazyResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
const LazyCell = lazy(() => import('recharts').then(module => ({ default: module.Cell })));

// Skeleton para loading dos gráficos
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Wrapper para BarChart
export const LazyBarChartWrapper = ({ children, ...props }: any) => (
  <Suspense fallback={<ChartSkeleton height={props.height} />}>
    <LazyResponsiveContainer {...props}>
      <LazyBarChart {...props}>
        {children}
      </LazyBarChart>
    </LazyResponsiveContainer>
  </Suspense>
);

// Wrapper para PieChart
export const LazyPieChartWrapper = ({ children, ...props }: any) => (
  <Suspense fallback={<ChartSkeleton height={props.height} />}>
    <LazyResponsiveContainer {...props}>
      <LazyPieChart {...props}>
        {children}
      </LazyPieChart>
    </LazyResponsiveContainer>
  </Suspense>
);

// Wrapper para LineChart
export const LazyLineChartWrapper = ({ children, ...props }: any) => (
  <Suspense fallback={<ChartSkeleton height={props.height} />}>
    <LazyResponsiveContainer {...props}>
      <LazyLineChart {...props}>
        {children}
      </LazyLineChart>
    </LazyResponsiveContainer>
  </Suspense>
);

// Exportar componentes lazy
export {
  LazyBar,
  LazyPie,
  LazyLine,
  LazyXAxis,
  LazyYAxis,
  LazyCartesianGrid,
  LazyTooltip,
  LazyLegend,
  LazyResponsiveContainer,
  LazyCell,
  ChartSkeleton
};