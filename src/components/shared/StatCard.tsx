import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'accent';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) {
  const TrendIcon = trend?.value && trend.value > 0 
    ? TrendingUp 
    : trend?.value && trend.value < 0 
      ? TrendingDown 
      : Minus;

  return (
    <div 
      className={cn(
        'stat-card animate-slide-up',
        variant === 'primary' && 'stat-card-primary',
        variant === 'accent' && 'stat-card-accent',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            'text-sm font-medium',
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          )}>
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight lg:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-sm',
              variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            variant === 'default' ? 'bg-primary/10 text-primary' : 'bg-white/20'
          )}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            variant === 'default' 
              ? trend.value > 0 
                ? 'bg-success/10 text-success' 
                : trend.value < 0 
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground'
              : 'bg-white/20'
          )}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend.value)}%
          </div>
          <span className={cn(
            'text-xs',
            variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
          )}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
