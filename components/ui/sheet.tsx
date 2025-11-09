"use client";
import * as React from "react";

type SheetContextType = { open: boolean; setOpen: (v: boolean) => void };
const SheetCtx = React.createContext<SheetContextType | null>(null);

export function Sheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <SheetCtx.Provider value={{ open, setOpen }}>{children}</SheetCtx.Provider>;
}

export function SheetTrigger({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(SheetCtx)!;
  return (
    <button onClick={() => ctx.setOpen(true)} className={className} aria-label="Open menu">
      {children}
    </button>
  );
}

export function SheetContent({ side = "left", className = "", children }: { side?: "left" | "right"; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(SheetCtx)!;
  if (!ctx.open) return null;
  return (
    <div className={`fixed inset-0 z-50`} onClick={() => ctx.setOpen(false)}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className={`absolute top-0 ${side === "left" ? "left-0" : "right-0"} h-full w-72 bg-white border-r border-[var(--border)] p-0 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`px-4 py-3 border-b border-[var(--border)] ${className}`}>{children}</div>;
}

export function SheetTitle({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <h3 className={`text-base font-semibold ${className}`}>{children}</h3>;
}

export function SheetDescription({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <p className={`text-sm text-[var(--muted-foreground)] ${className}`}>{children}</p>;
}
