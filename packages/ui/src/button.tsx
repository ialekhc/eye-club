import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/15 [&_svg]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-teal-700 text-white shadow-xs hover:bg-teal-800 border border-teal-700",
        primary:
          "bg-slate-900 text-white shadow-xs hover:bg-slate-800 border border-slate-900",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
        outline:
          "border border-[#D0D5DD] bg-white text-[#344054] shadow-xs hover:bg-[#F9FAFB] hover:text-[#101828]",
        ghost:
          "text-[#475467] hover:bg-[#F2F4F7] hover:text-[#101828]",
        destructive:
          "bg-rose-600 text-white shadow-xs hover:bg-rose-700 border border-rose-600 focus-visible:ring-rose-600/15",
        link: "text-teal-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs rounded-lg",
        lg: "h-11 px-5 text-base rounded-xl",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
