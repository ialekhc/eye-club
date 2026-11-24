import type { ComponentProps } from "react";
import { cn } from "./utils";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-[#D0D5DD] bg-white px-3.5 py-2 text-sm text-[#101828] shadow-xs transition-all placeholder:text-[#667085] focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/12 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-[#D0D5DD] bg-white px-3.5 py-2.5 text-sm text-[#101828] shadow-xs transition-all placeholder:text-[#667085] focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/12 disabled:cursor-not-allowed disabled:bg-[#F9FAFB]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828] shadow-xs transition-all focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/12 disabled:cursor-not-allowed disabled:bg-[#F9FAFB]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("text-sm font-medium leading-none text-[#344054]", className)}
      {...props}
    />
  );
}
