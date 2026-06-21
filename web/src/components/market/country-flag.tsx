"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FLAG_CDN = "https://flagcdn.com";

export type CountryFlagProps = {
  /** ISO 3166-1 alpha-2 (BR, US, JP, HK, …). */
  countryCode: string;
  /** Fallback quando a imagem não carrega (ex.: emoji 🇧🇷). */
  emojiFallback?: string;
  className?: string;
  /** Altura em px — largura ~4:3. */
  size?: number;
  title?: string;
};

export function CountryFlag({
  countryCode,
  emojiFallback,
  className,
  size = 14,
  title,
}: CountryFlagProps) {
  const [failed, setFailed] = useState(false);
  const code = countryCode.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(code) || failed) {
    return emojiFallback ? (
      <span
        className={cn("inline-flex shrink-0 text-base leading-none", className)}
        aria-hidden
        title={title}
      >
        {emojiFallback}
      </span>
    ) : null;
  }

  const width = Math.round(size * 1.34);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-[2px] border border-white/10 bg-zinc-900/80 shadow-sm",
        className,
      )}
      style={{ width, height: size }}
      title={title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- CDN leve; evita config extra no Next Image */}
      <img
        src={`${FLAG_CDN}/w40/${code}.png`}
        srcSet={`${FLAG_CDN}/w80/${code}.png 2x`}
        width={width}
        height={size}
        alt=""
        aria-hidden
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
