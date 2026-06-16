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
};

export function AuthMarketLogoChip({
  symbol,
  imageUrl,
  size = 44,
  className,
  showSymbol = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const monogram = symbol.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";

  const avatar = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-white/15 bg-white/[0.96] shadow-[0_8px_28px_oklch(0_0_0/0.35)]",
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
