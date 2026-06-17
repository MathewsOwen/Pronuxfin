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
  /** Nome exibido no hover. */
  label?: string;
  interactive?: boolean;
  tooltipPlacement?: "top" | "bottom";
};

export function AuthMarketLogoChip({
  symbol,
  imageUrl,
  size = 44,
  className,
  showSymbol = false,
  label,
  interactive = false,
  tooltipPlacement = "top",
}: Props) {
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const monogram = symbol.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";
  const hoverLabel = label?.trim() || symbol;

  const avatar = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-white/15 bg-white/[0.96] shadow-[0_8px_28px_oklch(0_0_0/0.35)]",
        interactive &&
          "transition-transform duration-300 hover:scale-110 hover:border-primary/40",
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

  if (interactive && showSymbol) {
    return (
      <span
        className="inline-flex cursor-default items-center gap-2 whitespace-nowrap"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={hoverLabel}
        aria-label={hoverLabel}
      >
        {avatar}
        <span
          className={cn(
            "font-mono text-[11px] font-medium tracking-wide transition-all duration-200",
            hovered
              ? "max-w-[9rem] truncate text-foreground"
              : "text-foreground/85",
          )}
        >
          {hovered ? hoverLabel : symbol}
        </span>
      </span>
    );
  }

  if (interactive) {
    return (
      <span
        className="relative inline-flex cursor-default flex-col items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={hoverLabel}
        aria-label={hoverLabel}
      >
        {hovered ? (
          <span
            className={cn(
              "pointer-events-none absolute left-1/2 z-50 max-w-[10rem] -translate-x-1/2 whitespace-nowrap",
              "rounded-lg border border-white/15 bg-[oklch(0.12_0.025_262/0.98)] px-2.5 py-1 text-center",
              "text-[10px] font-medium leading-tight text-foreground shadow-[0_8px_24px_oklch(0_0_0/0.5)] backdrop-blur-md",
              tooltipPlacement === "bottom"
                ? "top-[calc(100%+8px)]"
                : "bottom-[calc(100%+8px)]",
            )}
            role="tooltip"
          >
            {hoverLabel}
          </span>
        ) : null}
        {avatar}
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
