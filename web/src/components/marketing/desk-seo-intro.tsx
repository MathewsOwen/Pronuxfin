import { getMessages, getTranslations } from "next-intl/server";

type DeskSeoIntroProps = {
  variant: "bolsa" | "noticias";
};

export async function DeskSeoIntro({ variant }: DeskSeoIntroProps) {
  const t = await getTranslations(`DeskSeo.${variant}`);
  const messages = await getMessages();
  const deskSeo = (messages as { DeskSeo?: Record<string, { bullets?: string[] }> }).DeskSeo?.[
    variant
  ];
  const bullets = deskSeo?.bullets ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-12">
      <div className="max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t("lead")}</p>
        {bullets.length > 0 ? (
          <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {bullets.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary" aria-hidden>
                  ·
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
