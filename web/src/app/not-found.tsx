"use client";

import Error from "next/error";

/**
 * Rotas fora de `[locale]` (ex.: ficheiro inexistente) ou segmento de locale inválido.
 * Mantém HTML mínimo porque o `app/layout.tsx` raiz só repassa `children`.
 */
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased">
        <Error statusCode={404} />
      </body>
    </html>
  );
}
