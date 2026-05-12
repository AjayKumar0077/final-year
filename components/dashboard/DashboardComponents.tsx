'use client';

/**
 * Reusable dashboard components for consistent UI patterns
 */

import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dashboard Section - Wrapper for dashboard sections
interface DashboardSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function DashboardSection({
  title,
  description,
  icon: Icon,
  className,
  children,
  action,
}: DashboardSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            {Icon && <Icon className="w-6 h-6 text-green-600" />}
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

// Dashboard Card - Consistent card for dashboard items
interface DashboardCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  status?: 'active' | 'inactive' | 'pending' | 'completed';
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  isClickable?: boolean;
}

const statusColors = {
  active: 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800',
  inactive: 'border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800',
  pending: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800',
  completed: 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800',
};

export function DashboardCard({
  title,
  description,
  icon: Icon,
  status,
  className,
  children,
  onClick,
  isClickable,
}: DashboardCardProps) {
  const baseClasses = cn(
    'p-4 border rounded-lg transition-all',
    isClickable && 'cursor-pointer hover:shadow-md hover:scale-105',
    status ? statusColors[status] : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800',
    className,
  );

  return (
    <div className={baseClasses} onClick={onClick}>
      {(title || Icon || description) && (
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-start gap-3">
            {Icon && <Icon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
            <div>
              {title && <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>}
              {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// Dashboard Stats - Grid for showing statistics
interface DashboardStat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'green' | 'blue' | 'yellow' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface DashboardStatsProps {
  stats: DashboardStat[];
  className?: string;
}

const statColors = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const color = stat.color || 'green';

        return (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  {stat.trend && (
                    <p className={`text-xs font-medium mt-1 ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.isPositive ? '↑' : '↓'} {stat.trend.value}%
                    </p>
                  )}
                </div>
                {Icon && <Icon className={`w-8 h-8 ${statColors[color]}`} />}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Dashboard Empty State
interface DashboardEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function DashboardEmptyState({ icon: Icon, title, description, action, className }: DashboardEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg', className)}>
      {Icon && <Icon className="w-12 h-12 text-slate-400 mb-4" />}
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Dashboard Loading Skeleton
interface DashboardSkeletonProps {
  count?: number;
  className?: string;
}

export function DashboardSkeleton({ count = 3, className }: DashboardSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Dashboard Error State
interface DashboardErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DashboardError({ title = 'Error', message = 'Something went wrong', onRetry, className }: DashboardErrorProps) {
  return (
    <Card className={cn('border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800', className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-300">{title}</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{message}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm ml-4 flex-shrink-0"
            >
              Retry
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
