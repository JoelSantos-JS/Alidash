"use client";

import { Suspense, lazy, type ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load dos componentes de gráfico
const LazyBarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart as unknown as ComponentType<any> })));
const LazyPieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart as unknown as ComponentType<any> })));
const LazyLineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart as unknown as ComponentType<any> })));

// Lazy load de outros componentes recharts
const LazyBar = lazy(() => import('recharts').then(module => ({ default: module.Bar as unknown as ComponentType<any> })));
const LazyPie = lazy(() => import('recharts').then(module => ({ default: module.Pie as unknown as ComponentType<any> })));
const LazyLine = lazy(() => import('recharts').then(module => ({ default: module.Line as unknown as ComponentType<any> })));
const LazyXAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis as unknown as ComponentType<any> })));
const LazyYAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis as unknown as ComponentType<any> })));
const LazyCartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid as unknown as ComponentType<any> })));
const LazyTooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip as unknown as ComponentType<any> })));
const LazyLegend = lazy(() => import('recharts').then(module => ({ default: module.Legend as unknown as ComponentType<any> })));
const LazyResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer as unknown as ComponentType<any> })));
const LazyCell = lazy(() => import('recharts').then(module => ({ default: module.Cell as unknown as ComponentType<any> })));

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
