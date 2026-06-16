"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  imageUrl: string;
  size?: number;
  className?: string;
  showSymbol?: boolean;
  /** Nome exibido no hover (orbita interativa). */
  label?: string;
  interactive?: boolean;
};

export function AuthMarketLogoChip({
  symbol,
  imageUrl,
  size = 44,
  className,
  showSymbol = false,
  label,
  interactive = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const monogram = symbol.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";
  const hoverLabel = label?.trim() || symbol;

  const avatar = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-white/15 bg-white/[0.96] shadow-[0_8px_28px_oklch(0_0_0/0.35)]",
        interactive && "transition-transform duration-300 group-hover:scale-110 group-hover:border-primary/40",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {!failed && imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-contain p-[18%]"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-mono text-[10px] font-semibold text-foreground/80">{monogram}</span>
      )}
    </span>
  );

  if (interactive) {
    return (
      <span
        className="group relative inline-flex cursor-default flex-col items-center"
        aria-label={hoverLabel}
      >
        <span
          className={cn(
            "pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 max-w-[9rem] -translate-x-1/2",
            "rounded-lg border border-white/15 bg-[oklch(0.12_0.025_262/0.96)] px-2 py-1 text-center",
            "text-[10px] font-medium leading-tight text-foreground shadow-[0_8px_24px_oklch(0_0_0/0.45)]",
            "opacity-0 backdrop-blur-md transition-all duration-300",
            "group-hover:opacity-100 group-hover:-translate-y-0.5",
          )}
          role="tooltip"
        >
          {hoverLabel}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white/15"
            aria-hidden
          />
        </span>
        {avatar}
        <span className="mt-0.5 font-mono text-[7px] uppercase tracking-wide text-muted-foreground/0 transition-colors duration-300 group-hover:text-muted-foreground/80">
          {symbol}
        </span>
      </span>
    );
  }

  if (!showSymbol) return avatar;

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {avatar}
      <span className="font-mono text-[11px] font-medium tracking-wide text-foreground/85">
        {symbol}
      </span>
    </span>
  );
}
