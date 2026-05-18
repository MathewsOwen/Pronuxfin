import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "PRONUXFIN — infraestrutura cognitiva para mercados";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  let hostLabel = "PRONUXFIN";
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    try {
      hostLabel = new URL(raw).hostname.replace(/^www\./, "");
    } catch {
      /* keep default */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#070b14",
          backgroundImage:
            "radial-gradient(ellipse 90% 70% at 12% 88%, rgba(56, 189, 248, 0.14), transparent 55%), radial-gradient(ellipse 60% 50% at 88% 12%, rgba(99, 102, 241, 0.12), transparent 50%)",
          padding: 72,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(251, 191, 36, 0.92)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "linear-gradient(135deg, #38bdf8, #6366f1)",
              boxShadow: "0 0 18px rgba(56, 189, 248, 0.65)",
            }}
          />
          Cognitive markets desk
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              flexWrap: "wrap",
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 1.05,
              color: "#f4f4f5",
            }}
          >
            <span>PRONUX</span>
            <span style={{ color: "#38bdf8" }}>FIN</span>
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.35,
              color: "rgba(228, 228, 231, 0.78)",
              maxWidth: 780,
            }}
          >
            Clareza sob pressão · dados em tempo real · IA disciplinada · linguagem
            institucional
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 15,
            color: "rgba(161, 161, 170, 0.95)",
            letterSpacing: "0.06em",
          }}
        >
          <span>{hostLabel}</span>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
            Dados em tempo real · alertas · IA com limites explícitos
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
