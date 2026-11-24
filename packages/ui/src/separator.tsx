import type { ComponentProps } from "react";
import { cn } from "./utils";

export function Separator({ className, ...props }: ComponentProps<"hr">) {
  return <hr className={cn("shrink-0 border-t border-[#EAECF0]", className)} {...props} />;
}
