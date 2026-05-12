import { AmbientBackdrop } from "@/components/marketing/ambient-backdrop";
import { PageEnter } from "@/components/marketing/page-enter";
import { SiteFooter } from "@/components/marketing/landing-sections";
import { SiteHeader } from "@/components/marketing/site-header";
import { LiveMarketStrip } from "@/components/market/live-market-strip";
import { MarketSessionBar } from "@/components/market/market-session-bar";
import { QuotesStreamProvider } from "@/components/market/quotes-stream-provider";
import { MAIN_CONTENT_ID } from "@/lib/content-anchor";

const mainChrome =
  "flex-1 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-4 focus-visible:ring-offset-background";

export function MarketingShell({
  children,
  ticker = false,
  showLanguageSwitcher = false,
}: {
  children: React.ReactNode;
  /** Faixa de cotações estilo mesa — reforça “ao vivo” sem poluir todas as rotas. */
  ticker?: boolean;
  showLanguageSwitcher?: boolean;
}) {
  return (
    <>
      <AmbientBackdrop />
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader showLanguageSwitcher={showLanguageSwitcher} />
        {ticker ? (
          <QuotesStreamProvider>
            <>
              <MarketSessionBar />
              <LiveMarketStrip />
              <PageEnter id={MAIN_CONTENT_ID} className={mainChrome}>
                {children}
              </PageEnter>
            </>
          </QuotesStreamProvider>
        ) : (
          <PageEnter id={MAIN_CONTENT_ID} className={mainChrome}>
            {children}
          </PageEnter>
        )}
        <SiteFooter />
      </div>
    </>
  );
}
