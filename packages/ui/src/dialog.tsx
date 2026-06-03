import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from './utils.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />
    <DialogPrimitive.Content
      className={cn(
        'fixed left-1/2 top-1/2 w-[min(90vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl',
        className,
      )}
      {...props}
    />
  </DialogPrimitive.Portal>
);
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
