const HOME_PATH_RE = /^\/(pt-BR|en)\/?$/;

const INTRO_BOOT_SCRIPT = `try{var p=location.pathname;var q=location.search||"";if(/^\\/(pt-BR|en)\\/?$/.test(p)||p==="/"){if(/[?&]intro=0(?:&|$)/.test(q))return;document.documentElement.setAttribute("data-pronux-intro-pending","");setTimeout(function(){var r=document.documentElement;if(r.hasAttribute("data-pronux-intro-pending")&&!r.hasAttribute("data-pronux-intro")){r.removeAttribute("data-pronux-intro-pending");}},12000);}}catch(e){}`;

/** Bloqueia o chrome do site antes da hidratação — só na home (script nativo no layout). */
export function PronuxIntroBootScript({ nonce }: { nonce?: string }) {
  return (
    <script
      id="pronux-intro-boot"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }}
    />
  );
}

export function isHomeIntroPath(pathname: string) {
  return pathname === "/" || HOME_PATH_RE.test(pathname);
}
