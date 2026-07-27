import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'info', title, children, ...props }, ref) => {
    const variants = {
      info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40',
      success:
        'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40',
      warning:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40',
      danger:
        'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40',
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`flex flex-col p-4 border rounded-xl space-y-1 ${variants[variant]} ${className}`}
        {...props}
      >
        {title && <span className="font-semibold text-sm leading-none">{title}</span>}
        <div className="text-sm opacity-90 leading-normal">{children}</div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';
