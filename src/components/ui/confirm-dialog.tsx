import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  icon?: "trash" | "alert" | "info";
}

export type ConfirmFunction = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFunction>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      if (typeof opts === "string") {
        setOptions({
          title: "Are you sure?",
          description: opts,
          variant: "destructive",
        });
      } else {
        setOptions(opts);
      }
      setOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const variant = options.variant || "destructive";
  const iconType =
    options.icon ||
    (variant === "destructive" ? "trash" : variant === "warning" ? "alert" : "info");

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancel();
        }}
      >
        <AlertDialogContent className="sm:max-w-[440px] p-6 rounded-2xl border bg-card text-card-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {iconType === "trash" && (
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
            )}
            {iconType === "alert" && (
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}
            {iconType === "info" && (
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <AlertDialogTitle className="text-lg font-bold text-foreground leading-snug">
                {options.title || "Confirm Action"}
              </AlertDialogTitle>
              {options.description && (
                <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {options.description}
                </AlertDialogDescription>
              )}
            </div>
          </div>

          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <AlertDialogCancel
              onClick={handleCancel}
              className="rounded-xl border-border hover:bg-muted font-medium transition cursor-pointer"
            >
              {options.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                "rounded-xl font-medium shadow-sm transition cursor-pointer",
                variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : variant === "warning"
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {options.confirmText || (variant === "destructive" ? "Delete" : "Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Graceful fallback to window.confirm if used outside provider
    return async (opts: ConfirmOptions | string) => {
      const msg =
        typeof opts === "string"
          ? opts
          : opts.description
          ? `${opts.title ? opts.title + "\n\n" : ""}${opts.description}`
          : opts.title || "Confirm action?";
      return typeof window !== "undefined" ? window.confirm(String(msg)) : false;
    };
  }
  return context;
}
