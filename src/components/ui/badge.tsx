import * as React from "react";
import { cn } from "../../lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "border-transparent bg-blue-600 text-white shadow hover:bg-blue-500",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
    destructive: "border-transparent bg-rose-500/15 text-rose-700 border border-rose-200",
    outline: "text-slate-950 border border-slate-200",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 border",
    warning: "border-amber-200 bg-amber-50 text-amber-700 border",
  }[variant];

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold font-mono tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 uppercase",
        variantStyles,
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
