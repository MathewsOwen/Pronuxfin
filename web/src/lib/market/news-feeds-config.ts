export type NewsDesk = "br" | "mundo";

export type NewsWorldRegion =
  | "north_america"
  | "south_america"
  | "europe"
  | "asia"
  | "middle_east"
  | "africa"
  | "oceania";

export type NewsFeedConfig = {
  url: string;
  source: string;
  desk: NewsDesk;
  /** Região editorial — apenas feeds da mesa Mundo. */
  worldRegion?: NewsWorldRegion;
};

/** Ordem de exibição na mesa Mundo. */
export const WORLD_REGIONS: NewsWorldRegion[] = [
  "north_america",
  "south_america",
  "europe",
  "asia",
  "middle_east",
  "africa",
  "oceania",
];

/** Fontes RSS públicas — agregação em `fetch-news`. */
export const NEWS_FEEDS: NewsFeedConfig[] = [
  // —— Brasil ——
  { url: "https://www.infomoney.com.br/feed/", source: "InfoMoney", desk: "br" },
  { url: "https://www.moneytimes.com.br/feed/", source: "Money Times", desk: "br" },
  { url: "https://investnews.com.br/feed/", source: "InvestNews", desk: "br" },
  {
    url: "https://g1.globo.com/dynamo/economia/rss2.xml",
    source: "G1 Economia",
    desk: "br",
  },
  // —— Mundo · América do Norte ——
  {
    url: "https://feeds.npr.org/1006/rss.xml",
    source: "NPR Business",
    desk: "mundo",
    worldRegion: "north_america",
  },
  {
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147",
    source: "CNBC",
    desk: "mundo",
    worldRegion: "north_america",
  },
  {
    url: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    source: "MarketWatch",
    desk: "mundo",
    worldRegion: "north_america",
  },
  // —— Mundo · América do Sul ——
  {
    url: "https://en.mercopress.com/rss/economy",
    source: "Mercopress",
    desk: "mundo",
    worldRegion: "south_america",
  },
  {
    url: "https://www.batimes.com.ar/feed",
    source: "Buenos Aires Times",
    desk: "mundo",
    worldRegion: "south_america",
  },
  {
    url: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml",
    source: "BBC Latin America",
    desk: "mundo",
    worldRegion: "south_america",
  },
  // —— Mundo · Europa ——
  {
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    source: "BBC Business",
    desk: "mundo",
    worldRegion: "europe",
  },
  {
    url: "https://www.theguardian.com/business/rss",
    source: "The Guardian",
    desk: "mundo",
    worldRegion: "europe",
  },
  {
    url: "https://rss.dw.com/xml/rss_en_business",
    source: "DW Business",
    desk: "mundo",
    worldRegion: "europe",
  },
  // —— Mundo · Ásia ——
  {
    url: "https://asia.nikkei.com/rss/feed/nar",
    source: "Nikkei Asia",
    desk: "mundo",
    worldRegion: "asia",
  },
  {
    url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml",
    source: "CNA",
    desk: "mundo",
    worldRegion: "asia",
  },
  {
    url: "https://www.straitstimes.com/news/business/rss.xml",
    source: "The Straits Times",
    desk: "mundo",
    worldRegion: "asia",
  },
  // —— Mundo · Oriente Médio ——
  {
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    source: "Al Jazeera",
    desk: "mundo",
    worldRegion: "middle_east",
  },
  {
    url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
    source: "BBC Middle East",
    desk: "mundo",
    worldRegion: "middle_east",
  },
  {
    url: "https://www.france24.com/en/economy/rss",
    source: "France 24 Economy",
    desk: "mundo",
    worldRegion: "middle_east",
  },
  // —— Mundo · África ——
  {
    url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml",
    source: "BBC Africa",
    desk: "mundo",
    worldRegion: "africa",
  },
  {
    url: "https://allafrica.com/tools/headlines/rdf/business/headlines.rdf",
    source: "AllAfrica Business",
    desk: "mundo",
    worldRegion: "africa",
  },
  {
    url: "https://www.africanews.com/feed/rss",
    source: "AfricaNews",
    desk: "mundo",
    worldRegion: "africa",
  },
  // —— Mundo · Oceania ——
  {
    url: "https://www.rnz.co.nz/rss/business.xml",
    source: "RNZ Business",
    desk: "mundo",
    worldRegion: "oceania",
  },
  {
    url: "https://www.abc.net.au/news/feed/51120/rss.xml",
    source: "ABC Business",
    desk: "mundo",
    worldRegion: "oceania",
  },
  {
    url: "https://www.businessnews.com.au/rssfeed/latest.rss",
    source: "Business News AU",
    desk: "mundo",
    worldRegion: "oceania",
  },
];

export const NEWS_DESKS: NewsDesk[] = ["br", "mundo"];

export function isNewsDesk(value: string): value is NewsDesk {
  return NEWS_DESKS.includes(value as NewsDesk);
}

export function isNewsWorldRegion(value: string): value is NewsWorldRegion {
  return WORLD_REGIONS.includes(value as NewsWorldRegion);
}

export function feedsForDesk(desk: NewsDesk): NewsFeedConfig[] {
  return NEWS_FEEDS.filter((f) => f.desk === desk);
}

export function feedsForWorldRegion(region: NewsWorldRegion): NewsFeedConfig[] {
  return NEWS_FEEDS.filter((f) => f.worldRegion === region);
}

export function deskForSource(source: string): NewsDesk | undefined {
  return NEWS_FEEDS.find((f) => f.source === source)?.desk;
}

export function buildNewsHref(opts?: {
  mesa?: NewsDesk;
  fonte?: string;
  regiao?: NewsWorldRegion;
}): string {
  const params = new URLSearchParams();
  if (opts?.mesa) params.set("mesa", opts.mesa);
  if (opts?.regiao) params.set("regiao", opts.regiao);
  if (opts?.fonte) params.set("fonte", opts.fonte);
  const q = params.toString();
  return q ? `/noticias?${q}` : "/noticias";
}
