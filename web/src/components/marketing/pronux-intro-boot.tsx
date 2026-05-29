import Script from "next/script";

const HOME_PATH_RE = /^\/(pt-BR|en)\/?$/;

/** Bloqueia o chrome do site antes da hidratação — só atributos data-* (sem inline style). */
export function PronuxIntroBootScript({ nonce }: { nonce?: string }) {
  return (
    <Script
      id="pronux-intro-boot"
      nonce={nonce}
      strategy="beforeInteractive"
    >{`try{var p=location.pathname;if(/^\\/(pt-BR|en)\\/?$/.test(p)||p==="/"){document.documentElement.setAttribute("data-pronux-intro-pending","");}}catch(e){}`}</Script>
  );
}

export function isHomeIntroPath(pathname: string) {
  return pathname === "/" || HOME_PATH_RE.test(pathname);
}
