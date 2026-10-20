import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-semibold tracking-wide uppercase text-slate-400 select-none",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
