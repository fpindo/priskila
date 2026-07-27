import React from 'react';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white';
}

export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className = '', size = 'md', variant = 'primary', ...props }, ref) => {
    const sizes = {
      sm: 'h-24 w-24',
      md: 'h-32 w-32',
      lg: 'h-48 w-48',
    };

    return (
      <div ref={ref} className={`flex items-center justify-center ${className}`} {...props}>
        <img src="/animation/animation.svg" alt="Loading..." className={`${sizes[size]}`} />
      </div>
    );
  }
);
Loading.displayName = 'Loading';

export const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm z-50">
    <div className="flex flex-col items-center space-y-4">
      <Loading size="lg" />
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
        Memuat data...
      </span>
    </div>
  </div>
);
