import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  ...props 
}) => {
  const variantStyles = {
    default: 'bg-blue-100 text-blue-800 border border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    outline: 'bg-transparent text-gray-700 border border-gray-300',
    destructive: 'bg-red-100 text-red-800 border border-red-200'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

export default Badge;