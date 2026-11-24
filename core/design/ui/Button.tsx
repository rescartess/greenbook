import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "./cn";

type Variant = "primary" | "quiet" | "onBrand" | "glassOnBrand" | "plain";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-pine text-pine-ink hover:opacity-90",
  quiet: "bg-wash text-ink hover:bg-hairline",
  onBrand: "bg-white text-brand hover:bg-white/90",
  glassOnBrand: "glass-on-brand text-white hover:bg-white/15",
  plain: "text-pine hover:underline underline-offset-4",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-[17px]",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors disabled:opacity-50";

type Common = { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className, ...rest }: Common & ComponentProps<"button">) {
  return <button type="button" className={cn(base, variants[variant], sizes[size], className)} {...rest} />;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...rest }: Common & ComponentProps<typeof Link>) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...rest} />;
}
