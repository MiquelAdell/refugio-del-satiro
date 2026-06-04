/* eslint-disable react-refresh/only-export-components -- Radix primitive re-exports */
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import styles from "./Dialog.module.css";

export const DialogRoot = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

export const DialogOverlay = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(function DialogOverlay({ className, ...rest }, ref) {
  return (
    <RadixDialog.Overlay
      ref={ref}
      className={[styles.overlay, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  readonly children: ReactNode;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent({ children, className, ...rest }, ref) {
    return (
      <RadixDialog.Portal>
        <DialogOverlay />
        <RadixDialog.Content
          ref={ref}
          className={[styles.content, className].filter(Boolean).join(" ")}
          {...rest}
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    );
  }
);

/**
 * Convenience wrapper for the most common case: an open/close-controlled
 * dialog with a title and body. Composes the Radix primitives above.
 */
export interface DialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly children?: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {title && <DialogTitle className={styles.title}>{title}</DialogTitle>}
        {description && (
          <DialogDescription className={styles.description}>
            {description}
          </DialogDescription>
        )}
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
