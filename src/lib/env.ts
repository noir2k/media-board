const DEFAULTS = {
  timezone: "Asia/Seoul",
  locale: "ko-KR",
  weatherLabel: "Seoul, KR",
  weatherLat: 37.5665,
  weatherLon: 126.978,
  newsProvider: "rss",
  newsCountry: "kr",
  newsCategory: "general",
  newsLimit: 8,
  newsPageSize: 6,
  newsSlideIntervalMs: 8000,
  newsRssUrls: ["https://news.sbs.co.kr/news/headlineRssFeed.do?plink=RSSREADER"],
  marketDataProvider: "yahoo",
  krStockSymbols: ["005930:KRX", "000660:KRX", "035420:KRX"],
  usMarketSymbols: ["^GSPC", "^IXIC", "^DJI"],
  fxPairs: ["USD/KRW", "USD/JPY", "EUR/KRW"],
} as const;

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readList(value: string | undefined, fallback: readonly string[]) {
  if (!value) {
    return [...fallback];
  }

  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : [...fallback];
}

export const env = {
  timezone: process.env.BOARD_TIMEZONE || DEFAULTS.timezone,
  locale: process.env.BOARD_LOCALE || DEFAULTS.locale,
  weatherLocationLabel:
    process.env.WEATHER_LOCATION_LABEL || DEFAULTS.weatherLabel,
  weatherLat: readNumber(process.env.WEATHER_LAT, DEFAULTS.weatherLat),
  weatherLon: readNumber(process.env.WEATHER_LON, DEFAULTS.weatherLon),
  newsProvider: (process.env.NEWS_PROVIDER || DEFAULTS.newsProvider).toLowerCase(),
  newsCountry: (process.env.NEWS_COUNTRY || DEFAULTS.newsCountry).toLowerCase(),
  newsCategory: (
    process.env.NEWS_CATEGORY || DEFAULTS.newsCategory
  ).toLowerCase(),
  newsLimit: readNumber(process.env.NEWS_LIMIT, DEFAULTS.newsLimit),
  newsPageSize: readNumber(process.env.NEWS_PAGE_SIZE, DEFAULTS.newsPageSize),
  newsSlideIntervalMs: readNumber(
    process.env.NEWS_SLIDE_INTERVAL_MS,
    DEFAULTS.newsSlideIntervalMs,
  ),
  newsRssUrls: readList(process.env.NEWS_RSS_URLS, DEFAULTS.newsRssUrls),
  newsApiKey: process.env.NEWS_API_KEY,
  marketDataProvider: (
    process.env.MARKET_DATA_PROVIDER ||
    process.env.FINANCE_PROVIDER ||
    DEFAULTS.marketDataProvider
  ).toLowerCase(),
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY,
  krStockSymbols: readList(process.env.KR_STOCK_SYMBOLS, DEFAULTS.krStockSymbols),
  usMarketSymbols: readList(
    process.env.US_MARKET_SYMBOLS,
    DEFAULTS.usMarketSymbols,
  ),
  fxPairs: readList(process.env.FX_PAIRS, DEFAULTS.fxPairs),
};
