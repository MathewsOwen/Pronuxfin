/**
 * Camada decorativa do hero (SSR + hidratação com o restante do cliente).
 * Ícones genéricos ( BTC / ETH-style / $ / barril ) — sem logotipos de marca.
 */
export function HeroWatermarks() {
  return (
    <div
      className="absolute inset-0 -z-20 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute -inset-[12%] opacity-[0.22] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,black_12%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,black_12%,transparent_75%)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(0.78 0.04 85 / 14%) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <svg
        className="pointer-events-none absolute left-[2%] top-[6%] w-[min(28rem,82vw)] blur-[1.2px] opacity-[0.048] text-muted-foreground"
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Bitcoin (símbolo genérico)</title>
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <text
          x="64"
          y="83"
          fill="currentColor"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            fontSize: 58,
            fontWeight: 700,
          }}
        >
          ₿
        </text>
      </svg>

      <svg
        className="pointer-events-none absolute -right-[4%] top-[12%] w-[min(22rem,62vw)] blur-[1.2px] opacity-[0.054] text-muted-foreground"
        viewBox="0 0 120 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Ethereum-style (forma livre)</title>
        <path
          d="M60 8 L112 102 L60 78 L8 102 Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M60 78 L112 102 L60 140 L8 102 Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M8 102 L60 78 L112 102 M8 102 L60 192 L112 102"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinejoin="round"
          opacity={0.85}
        />
      </svg>

      <svg
        className="pointer-events-none absolute bottom-[20%] left-[4%] w-[min(18rem,52vw)] blur-[1.1px] opacity-[0.045] text-muted-foreground"
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Dólar (pictograma)</title>
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <text
          x="64"
          y="64"
          fill="currentColor"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            fontSize: 72,
            fontWeight: 600,
          }}
        >
          $
        </text>
      </svg>

      <svg
        className="pointer-events-none absolute bottom-[8%] right-[4%] w-[min(20rem,54vw)] blur-[1.35px] opacity-[0.04] text-muted-foreground"
        viewBox="0 0 140 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Commodity / petróleo (genérico)</title>
        <ellipse
          cx="70"
          cy="36"
          rx="44"
          ry="14"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          d="M26 42v78c0 8 18 22 44 22s44-14 44-22V42"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <ellipse
          cx="70"
          cy="120"
          rx="44"
          ry="14"
          stroke="currentColor"
          strokeWidth="4"
        />
        <line
          x1="26"
          y1="68"
          x2="114"
          y2="68"
          stroke="currentColor"
          strokeWidth="3"
          opacity={0.65}
        />
        <line
          x1="26"
          y1="92"
          x2="114"
          y2="92"
          stroke="currentColor"
          strokeWidth="3"
          opacity={0.65}
        />
        <path
          d="M108 24c8-4 16 4 12 14-4 12-16 20-16 28 0 6 6 10 12 8"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <svg
        className="pointer-events-none absolute left-1/2 top-[38%] w-[min(58rem,118vw)] -translate-x-1/2 -translate-y-1/2 blur-[0.7px] opacity-[0.058] text-muted-foreground"
        viewBox="0 0 600 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Candles abstratos</title>
        <line
          x1="0"
          y1="120"
          x2="600"
          y2="120"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity={0.4}
        />
        <rect x="40" y="90" width="14" height="70" fill="currentColor" opacity={0.35} />
        <line x1="47" y1="70" x2="47" y2="170" stroke="currentColor" strokeWidth="2" />
        <rect x="120" y="60" width="14" height="100" fill="currentColor" opacity={0.25} />
        <line x1="127" y1="40" x2="127" y2="190" stroke="currentColor" strokeWidth="2" />
        <rect x="200" y="100" width="14" height="50" fill="currentColor" opacity={0.3} />
        <rect x="280" y="50" width="14" height="110" fill="currentColor" opacity={0.22} />
        <rect x="360" y="85" width="14" height="75" fill="currentColor" opacity={0.28} />
        <rect x="440" y="70" width="14" height="95" fill="currentColor" opacity={0.2} />
        <rect x="520" y="95" width="14" height="55" fill="currentColor" opacity={0.32} />
        <path
          d="M30 150 Q150 40 300 100 T580 60"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity={0.35}
        />
      </svg>
    </div>
  );
}
