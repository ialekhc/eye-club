import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 [&_svg]:size-4",
  { variants: {
    variant: {
      default: "bg-emerald-950 text-white hover:bg-emerald-900",
      outline: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
      ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
    },
    size: { default: "h-11 px-4", sm: "h-9 px-3 text-xs", icon: "size-10" },
  }, defaultVariants: { variant: "default", size: "default" } },
);

export function Button({ className, variant, size, type = "button", ...props }: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={twMerge(clsx(buttonVariants({ variant, size }), className))} {...props} />;
}
