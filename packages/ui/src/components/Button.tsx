import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2';

    const variants = {
      primary: 'bg-[#F97316] hover:bg-orange-600 text-white focus:ring-orange-500',
      secondary: 'bg-[#1E293B] hover:bg-slate-800 text-white focus:ring-slate-900',
      success: 'bg-[#16A34A] hover:bg-green-700 text-white focus:ring-green-500',
      warning: 'bg-[#F59E0B] hover:bg-amber-600 text-white focus:ring-amber-500',
      danger: 'bg-[#DC2626] hover:bg-red-700 text-white focus:ring-red-500',
    };

    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
    };

    return (
      <button ref={ref} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
