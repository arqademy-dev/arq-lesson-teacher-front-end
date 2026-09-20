"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock background scroll

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-[6px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(); // click outside to close
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "card w-full max-w-2xl max-h-[90vh] overflow-auto border border-[var(--line)] shadow-[var(--shadow-lg)]",
          className
        )}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--line)]">
          <h3 className="font-heading text-xl">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--ink-3)] hover:text-[var(--ink)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}

        {footer && (
          <div className="flex justify-end gap-3 px-6 py-5 border-t border-[var(--line)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}