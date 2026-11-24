import type { ComponentProps } from "react";
import { cn } from "./utils";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-[#EAECF0] bg-white shadow-xs">
      <table className={cn("w-full caption-bottom text-sm text-left", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("bg-[#F9FAFB] border-b border-[#EAECF0]", className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-[#EAECF0]", className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors hover:bg-[#F9FAFB]/70", className)} {...props} />;
}

export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn("h-11 px-4 text-xs font-semibold uppercase tracking-wider text-[#475467]", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("p-4 align-middle text-[#101828]", className)} {...props} />;
}
