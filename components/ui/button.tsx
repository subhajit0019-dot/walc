import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glow";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variants = {
      default:
        "bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 shadow-md shadow-cyan-500/20",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20",
      outline:
        "border border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:text-white text-slate-200",
      secondary:
        "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/50",
      ghost: "hover:bg-slate-800/80 text-slate-300 hover:text-white",
      link: "text-cyan-400 underline-offset-4 hover:underline",
      glow: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-8 text-base",
      icon: "h-9 w-9",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
