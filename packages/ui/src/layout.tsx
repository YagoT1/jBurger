import * as React from 'react';
import { cn } from './utils.js';
export const PageShell = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <main className={cn('mx-auto min-h-screen w-full max-w-7xl px-6 py-8', className)} {...props} />;
export const Stack = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-4', className)} {...props} />;
export const Inline = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-wrap items-center gap-3', className)} {...props} />;
