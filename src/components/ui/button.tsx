import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      default: "bg-blue-600 text-white hover:bg-blue-500 shadow-sm",
      destructive: "bg-rose-600 text-white hover:bg-rose-500 shadow-sm",
      outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
      link: "text-blue-600 underline-offset-4 hover:underline",
    }[variant];

    const sizeStyles = {
      default: "h-9 px-3.5 py-2",
      sm: "h-7 rounded-md px-2.5 text-[11px]",
      lg: "h-10 rounded-md px-5 text-sm",
      icon: "h-8 w-8",
    }[size];

    return (
      <button
        className={cn(baseStyles, variantStyles, sizeStyles, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
