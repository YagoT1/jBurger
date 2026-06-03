import * as React from 'react';
import { cn } from './utils.js';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn('min-h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2', className)} {...props} />);
Input.displayName = 'Input';
