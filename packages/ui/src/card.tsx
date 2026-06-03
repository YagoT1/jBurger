import * as React from 'react';
import { cn } from './utils.js';
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <section className={cn('rounded-xl border bg-white p-6 shadow-sm', className)} {...props} />;
export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <header className={cn('mb-4 space-y-1', className)} {...props} />;
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className={cn('text-lg font-semibold', className)} {...props} />;
