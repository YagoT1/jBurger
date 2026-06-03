import * as React from 'react';
import { cn } from './utils.js';
export const Badge = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span className={cn('inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-900', className)} {...props} />;
