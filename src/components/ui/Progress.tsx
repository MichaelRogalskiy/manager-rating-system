import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    size = 'md', 
    variant = 'default',
    showLabel = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
    
    const sizes = {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
    };
    
    const variants = {
      default: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
    };
    
    return (
      <div className={cn('w-full', className)} ref={ref} {...props}>
        <div className={cn(
          'w-full rounded-full bg-secondary-200 overflow-hidden',
          sizes[size]
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-in-out',
              variants[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="flex justify-between items-center mt-2 text-sm text-secondary-600">
            <span>{value} / {max}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };