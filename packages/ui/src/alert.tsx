import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-sm flex items-start gap-3",
  {
    variants: {
      variant: {
        default: "border-[#EAECF0] bg-[#F9FAFB] text-[#344054]",
        success: "border-emerald-200 bg-emerald-50 text-emerald-900",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
        destructive: "border-rose-200 bg-rose-50 text-rose-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: ComponentProps<"h5">) {
  return <h5 className={cn("font-semibold leading-none tracking-tight mb-1", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("text-sm opacity-90", className)} {...props} />;
}
