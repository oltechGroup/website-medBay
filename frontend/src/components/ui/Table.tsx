import React from 'react';
import { cn } from '@/lib/utils';

const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
};

const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ 
  className, 
  ...props 
}) => {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
};

const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  );
};

const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50',
        className
      )}
      {...props}
    />
  );
};

const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
};

const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ 
  className, 
  ...props 
}) => {
  return (
    <td
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
};