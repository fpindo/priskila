import React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = '', name, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm font-medium',
      lg: 'h-14 w-14 text-lg font-medium',
    };

    const getInitials = (n: string) => {
      if (!n) return '';
      const parts = n.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return n.substring(0, 2).toUpperCase();
    };

    return (
      <div
        ref={ref}
        className={`flex items-center justify-center rounded-full bg-blue-50 text-[#2563EB] dark:bg-slate-800 dark:text-slate-200 select-none shadow-inner border border-blue-100/50 dark:border-slate-700/50 ${sizes[size]} ${className}`}
        {...props}
      >
        {getInitials(name)}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
