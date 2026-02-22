import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`ui-table-wrap ${className}`.trim()}>
      <table className="ui-table">{children}</table>
    </div>
  );
}

