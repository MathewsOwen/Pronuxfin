export type NewsFeedConfig = {
  url: string;
  source: string;
  region: "br" | "global";
};

/** Fontes RSS públicas — alinhadas à agregação em `fetch-news`. */
export const NEWS_FEEDS: NewsFeedConfig[] = [
  { url: "https://www.infomoney.com.br/feed/", source: "InfoMoney", region: "br" },
  { url: "https://www.moneytimes.com.br/feed/", source: "Money Times", region: "br" },
  { url: "https://investnews.com.br/feed/", source: "InvestNews", region: "br" },
  {
    url: "https://g1.globo.com/dynamo/economia/rss2.xml",
    source: "G1 Economia",
    region: "br",
  },
  {
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    source: "BBC Business",
    region: "global",
  },
  {
    url: "https://www.theguardian.com/business/rss",
    source: "The Guardian",
    region: "global",
  },
];
