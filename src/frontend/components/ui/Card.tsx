import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  compact?: boolean;
}

export function Card({ children, compact = false, className = '', ...props }: CardProps) {
  return (
    <div className={`ui-card ${compact ? 'ui-card--compact' : ''} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

