import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-3xl border border-dashed border-white/15 bg-white/[0.03] text-center",
        compact ? "px-4 py-5" : "px-6 py-8",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]",
          compact ? "size-10" : "size-12",
        )}
      >
        <Icon
          className={cn("text-muted-foreground", compact ? "size-5" : "size-6")}
          aria-hidden
        />
      </div>
      <p
        className={cn(
          "font-semibold tracking-tight text-foreground",
          compact ? "mt-3 text-base" : "mt-4 text-lg",
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mx-auto max-w-md leading-relaxed text-muted-foreground",
          compact ? "mt-1.5 text-xs" : "mt-2 text-sm",
        )}
      >
        {description}
      </p>
      {children ? (
        <div className={cn("flex flex-wrap justify-center gap-2", compact ? "mt-3" : "mt-5")}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
