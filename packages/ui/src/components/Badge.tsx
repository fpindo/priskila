import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
      secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      danger: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
      outline: 'text-slate-900 border border-slate-200 dark:text-slate-100 dark:border-slate-800',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
