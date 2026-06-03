import * as React from 'react';
import { cn } from './utils.js';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost'; }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', ...props }, ref) => <button ref={ref} className={cn('inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50', variant === 'primary' && 'bg-orange-500 text-white hover:bg-orange-600', variant === 'secondary' && 'border bg-white text-neutral-900 hover:bg-neutral-50', variant === 'ghost' && 'hover:bg-neutral-100', className)} {...props} />);
Button.displayName = 'Button';
