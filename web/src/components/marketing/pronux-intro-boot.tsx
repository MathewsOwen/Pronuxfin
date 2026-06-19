const HOME_PATH_RE = /^\/(pt-BR|en)\/?$/;

/** Bloqueia o chrome do site antes da hidratação — só na home (script estático com nonce). */
export function PronuxIntroBootScript({ nonce }: { nonce?: string }) {
  return (
    <script
      id="pronux-intro-boot"
      src="/scripts/pronux-intro-boot.js"
      nonce={nonce}
    />
  );
}

export function isHomeIntroPath(pathname: string) {
  return pathname === "/" || HOME_PATH_RE.test(pathname);
}
