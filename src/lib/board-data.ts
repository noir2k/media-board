import { XMLParser } from "fast-xml-parser";

import { env } from "@/lib/env";
import { formatDayLabel } from "@/lib/format";

type ProviderState = "live" | "fallback";
type MarketGroup = "kr-stock" | "us-market" | "fx";
const RSS_NEWS_MAX_ITEMS = 30;

export type ProviderStatus = {
  label: string;
  source: string;
  mode: ProviderState;
  note: string;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  href: string;
  publishedAt: string;
};

export type WeatherDay = {
  date: string;
  label: string;
  min: number;
  max: number;
  weatherCode: number;
};

export type WeatherSnapshot = {
  location: string;
  currentTemp: number;
  apparentTemp: number;
  humidity: number;
  weatherCode: number;
  daily: WeatherDay[];
};

export type MarketTicker = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  currency: string;
  changePercent: number;
  sparkline: number[];
  series: Array<{
    time: string;
    value: number;
  }>;
  group: MarketGroup;
  marketLabel: string;
  exchange?: string;
};

export type BoardData = {
  locale: string;
  timezone: string;
  generatedAt: string;
  newsPageSize: number;
  newsSlideIntervalMs: number;
  news: NewsItem[];
  weather: WeatherSnapshot;
  markets: MarketTicker[];
  providerStatus: ProviderStatus[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  trimValues: true,
});

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "서리 안개",
  51: "이슬비",
  53: "보통 비",
  55: "강한 비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  80: "소나기",
  81: "강한 소나기",
  82: "폭우",
  95: "뇌우",
};

const MARKET_LABELS: Record<MarketGroup, string> = {
  "kr-stock": "KR Stock",
  "us-market": "US Market",
  fx: "FX",
};

const MARKET_NAME_ALIASES: Record<string, string> = {
  "005930:KRX": "삼성전자",
  "000660:KRX": "SK하이닉스",
  "035420:KRX": "NAVER",
  "^GSPC": "S&P 500",
  "^IXIC": "NASDAQ",
  "^DJI": "DOW",
  SPY: "S&P 500 ETF",
  QQQ: "Nasdaq 100 ETF",
  DIA: "Dow Jones ETF",
  IWM: "Russell 2000",
  "USD/KRW": "원/달러",
  "EUR/KRW": "원/유로",
  "USD/JPY": "달러/엔",
};

function describeWeather(code: number) {
  return WEATHER_DESCRIPTIONS[code] || "업데이트 중";
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").replace(/%/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function symbolAlias(symbol: string, fallback: string) {
  return MARKET_NAME_ALIASES[symbol] || fallback;
}

function isPlaceholderApiKey(value: string | undefined) {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized.includes("your_") || normalized.includes("example");
}

function guessCurrencyForSymbol(symbol: string, group: MarketGroup) {
  if (group === "kr-stock") {
    return "KRW";
  }

  if (group === "us-market") {
    return "USD";
  }

  const parts = symbol.split("/");
  return parts[1] || "USD";
}

async function fetchJson<T>(
  input: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      next: init?.revalidate ? { revalidate: init.revalidate } : undefined,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(
  input: string,
  init?: RequestInit & { revalidate?: number },
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      next: init?.revalidate ? { revalidate: init.revalidate } : undefined,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function getWeather(): Promise<{
  data: WeatherSnapshot;
  status: ProviderStatus;
}> {
  type OpenMeteoResponse = {
    current: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      weather_code: number;
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${env.weatherLat}` +
    `&longitude=${env.weatherLon}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
    "&forecast_days=5" +
    `&timezone=${encodeURIComponent(env.timezone)}`;

  const payload = await fetchJson<OpenMeteoResponse>(url, { revalidate: 900 });
  const daily = payload.daily.time.map((date, index) => ({
    date,
    label: formatDayLabel(date, env.locale, env.timezone),
    min: payload.daily.temperature_2m_min[index],
    max: payload.daily.temperature_2m_max[index],
    weatherCode: payload.daily.weather_code[index],
  }));

  return {
    data: {
      location: env.weatherLocationLabel,
      currentTemp: payload.current.temperature_2m,
      apparentTemp: payload.current.apparent_temperature,
      humidity: payload.current.relative_humidity_2m,
      weatherCode: payload.current.weather_code,
      daily,
    },
    status: {
      label: "Weather",
      source: "Open-Meteo",
      mode: "live",
      note: "Current + 5 day forecast",
    },
  };
}

function ensureArray<T>(value: T | T[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function readFeedText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => readFeedText(item)).find(Boolean) || "";
  }

  if (value && typeof value === "object") {
    const candidates = ["#text", "__cdata", "text", "title", "value"];

    for (const key of candidates) {
      if (key in value) {
        const nested = readFeedText((value as Record<string, unknown>)[key]);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return "";
}

function parseRssItems(xml: string) {
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { title?: string; item?: Array<Record<string, unknown>> } };
    feed?: { title?: string; entry?: Array<Record<string, unknown>> };
  };

  const rssItems = ensureArray(parsed.rss?.channel?.item).map((item) => {
    const source = readFeedText(parsed.rss?.channel?.title) || "RSS";
    const linkValue = item.link;
    const href =
      typeof linkValue === "string"
        ? linkValue
        : typeof linkValue === "object" && linkValue && "href" in linkValue
          ? readFeedText((linkValue as { href?: string }).href)
          : "";
    const title = readFeedText(item.title) || "Untitled";
    const publishedAt =
      readFeedText(item.pubDate) ||
      readFeedText(item.published) ||
      new Date().toISOString();
    const guid =
      readFeedText(item.guid) ||
      href ||
      `${source}-${title}-${publishedAt}` ||
      crypto.randomUUID();

    return {
      id: guid,
      title,
      source,
      href,
      publishedAt,
    };
  });

  const atomItems = ensureArray(parsed.feed?.entry).map((entry) => {
    const source = readFeedText(parsed.feed?.title) || "Atom";
    const linkValue = entry.link;
    const alternateLink = Array.isArray(linkValue)
      ? linkValue.find(
          (item) =>
            typeof item === "object" &&
            item &&
            "href" in item &&
            String((item as { rel?: string }).rel || "alternate") === "alternate",
        )
      : undefined;

    const href =
      typeof linkValue === "string"
        ? linkValue
        : Array.isArray(linkValue)
          ? typeof alternateLink === "object" &&
            alternateLink &&
            "href" in alternateLink
            ? readFeedText((alternateLink as { href?: string }).href)
            : ""
          : typeof linkValue === "object" && linkValue && "href" in linkValue
            ? readFeedText((linkValue as { href?: string }).href)
            : "";
    const title = readFeedText(entry.title) || "Untitled";
    const publishedAt =
      readFeedText(entry.updated) ||
      readFeedText(entry.published) ||
      new Date().toISOString();
    const id =
      readFeedText(entry.id) ||
      href ||
      `${source}-${title}-${publishedAt}` ||
      crypto.randomUUID();

    return {
      id,
      title,
      source,
      href,
      publishedAt,
    };
  });

  return [...rssItems, ...atomItems];
}

async function getNewsFromRss(limit: number) {
  const results = await Promise.all(
    env.newsRssUrls.map(async (url) => {
      const xml = await fetchText(url, { revalidate: 300 });
      return parseRssItems(xml);
    }),
  );

  return results
    .flat()
    .filter((item) => item.href)
    .filter(
      (item, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.href === item.href ||
            (candidate.title === item.title && candidate.source === item.source),
        ) === index,
    )
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, limit);
}

async function getNewsFromNewsApi(limit: number) {
  type NewsApiResponse = {
    articles: Array<{
      title: string;
      url: string;
      publishedAt: string;
      source: { name: string };
    }>;
  };

  if (!env.newsApiKey) {
    throw new Error("NEWS_API_KEY is missing");
  }

  const url =
    "https://newsapi.org/v2/top-headlines" +
    `?country=${encodeURIComponent(env.newsCountry)}` +
    `&category=${encodeURIComponent(env.newsCategory)}` +
    `&pageSize=${limit}`;

  const payload = await fetchJson<NewsApiResponse>(url, {
    revalidate: 300,
    headers: {
      "X-Api-Key": env.newsApiKey,
    },
  });

  return payload.articles.map((article) => ({
    id: `${article.url}-${article.publishedAt}`,
    title: article.title,
    source: article.source.name,
    href: article.url,
    publishedAt: article.publishedAt,
  }));
}

async function getNews(): Promise<{ data: NewsItem[]; status: ProviderStatus }> {
  const limit = Math.min(Math.max(env.newsLimit, 3), 12);

  if (env.newsProvider === "newsapi") {
    const data = await getNewsFromNewsApi(limit);
    return {
      data,
      status: {
        label: "News",
        source: "NewsAPI",
        mode: "live",
        note: `${env.newsCountry.toUpperCase()} / ${env.newsCategory}`,
      },
    };
  }

  const data = await getNewsFromRss(RSS_NEWS_MAX_ITEMS);
  return {
    data,
    status: {
      label: "News",
      source: "RSS",
      mode: "live",
      note: `${env.newsRssUrls.length} configured feed(s)`,
    },
  };
}

type TwelveDataError = {
  status?: string;
  code?: number;
  message?: string;
};

type TwelveDataQuote = TwelveDataError & {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  close?: string;
  price?: string;
  change?: string;
  percent_change?: string;
};

type TwelveDataSeries = TwelveDataError & {
  meta?: {
    symbol?: string;
    currency?: string;
    exchange?: string;
  };
  values?: Array<{
    datetime?: string;
    close?: string;
  }>;
};

type MarketRequest = {
  symbol: string;
  group: MarketGroup;
};

type YahooChartResponse = {
  chart?: {
    error?: { code?: string; description?: string } | null;
    result?: Array<{
      timestamp?: number[];
      meta?: {
        currency?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        shortName?: string;
        longName?: string;
        exchangeName?: string;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

function toYahooSymbol(symbol: string, group: MarketGroup) {
  if (group === "kr-stock") {
    const [code] = symbol.split(":");
    return `${code}.KS`;
  }

  if (group === "fx") {
    const [base, quote] = symbol.split("/");
    if (base === "USD" && quote === "KRW") {
      return "KRW=X";
    }

    if (base === "USD" && quote === "JPY") {
      return "JPY=X";
    }

    return `${base}${quote}=X`;
  }

  return symbol;
}

async function getTwelveDataQuote(symbol: string) {
  const url =
    "https://api.twelvedata.com/quote" +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&apikey=${encodeURIComponent(env.twelveDataApiKey || "")}`;

  const payload = await fetchJson<TwelveDataQuote>(url, { revalidate: 120 });
  if (payload.status === "error") {
    throw new Error(payload.message || `Quote lookup failed for ${symbol}`);
  }

  return payload;
}

async function getTwelveDataSeries(symbol: string) {
  const url =
    "https://api.twelvedata.com/time_series" +
    `?symbol=${encodeURIComponent(symbol)}` +
    "&interval=1day" +
    "&outputsize=12" +
    "&dp=4" +
    `&apikey=${encodeURIComponent(env.twelveDataApiKey || "")}`;

  const payload = await fetchJson<TwelveDataSeries>(url, { revalidate: 600 });
  if (payload.status === "error") {
    throw new Error(payload.message || `Series lookup failed for ${symbol}`);
  }

  return payload;
}

async function getTwelveDataTicker(request: MarketRequest): Promise<MarketTicker> {
  const [quote, series] = await Promise.all([
    getTwelveDataQuote(request.symbol),
    getTwelveDataSeries(request.symbol),
  ]);

  const points = (series.values || [])
    .flatMap((item) => {
      const close = toNumber(item.close);
      if (!item.datetime || close <= 0) {
        return [];
      }

      return [
        {
          time: item.datetime.slice(0, 10),
          value: close,
        },
      ];
    })
    .reverse();
  const sparkline = points.map((point) => point.value);

  return {
    id: `${request.group}-${request.symbol}`,
    name: symbolAlias(request.symbol, quote.name || request.symbol),
    symbol: request.symbol,
    price: toNumber(quote.close ?? quote.price),
    currency:
      quote.currency ||
      series.meta?.currency ||
      guessCurrencyForSymbol(request.symbol, request.group),
    changePercent: toNumber(quote.percent_change),
    sparkline: sparkline.length > 1 ? sparkline : [0, 0, 0, 0],
    series:
      points.length > 1
        ? points
        : [
            {
              time: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
              value: 0,
            },
            { time: new Date().toISOString().slice(0, 10), value: 0 },
          ],
    group: request.group,
    marketLabel: MARKET_LABELS[request.group],
    exchange: quote.exchange || series.meta?.exchange,
  };
}

async function getYahooTicker(request: MarketRequest): Promise<MarketTicker> {
  const yahooSymbol = toYahooSymbol(request.symbol, request.group);
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    `${encodeURIComponent(yahooSymbol)}?range=1mo&interval=1d`;

  const payload = await fetchJson<YahooChartResponse>(url, {
    revalidate: 300,
    headers: {
      "user-agent": "Mozilla/5.0",
    },
  });

  if (payload.chart?.error) {
    throw new Error(payload.chart.error.description || `Yahoo lookup failed for ${request.symbol}`);
  }

  const result = payload.chart?.result?.[0];
  if (!result) {
    throw new Error(`Yahoo result missing for ${request.symbol}`);
  }

  const timestamps = result.timestamp || [];
  const rawCloses = result.indicators?.quote?.[0]?.close || [];
  const points = timestamps.flatMap((timestamp, index) => {
    const close = rawCloses[index];
    if (typeof close !== "number" || !Number.isFinite(close)) {
      return [];
    }

    return [
      {
        time: new Date(timestamp * 1000).toISOString().slice(0, 10),
        value: close,
      },
    ];
  });
  const closes = points.map((point) => point.value);

  const price =
    result.meta?.regularMarketPrice ||
    closes.at(-1) ||
    result.meta?.previousClose ||
    result.meta?.chartPreviousClose ||
    0;
  const previousClose =
    result.meta?.previousClose || result.meta?.chartPreviousClose || closes.at(-2) || price;
  const changePercent = previousClose
    ? ((price - previousClose) / previousClose) * 100
    : 0;

  return {
    id: `${request.group}-${request.symbol}`,
    name: symbolAlias(
      request.symbol,
      result.meta?.shortName || result.meta?.longName || request.symbol,
    ),
    symbol: request.symbol,
    price,
    currency:
      result.meta?.currency || guessCurrencyForSymbol(request.symbol, request.group),
    changePercent,
    sparkline: closes.length > 1 ? closes.slice(-20) : [0, 0, 0, 0],
    series:
      points.length > 1
        ? points
        : [
            {
              time: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
              value: 0,
            },
            { time: new Date().toISOString().slice(0, 10), value: 0 },
          ],
    group: request.group,
    marketLabel: MARKET_LABELS[request.group],
    exchange: result.meta?.exchangeName || "Yahoo Finance",
  };
}

async function getMarketsFromTwelveData(): Promise<MarketTicker[]> {
  if (isPlaceholderApiKey(env.twelveDataApiKey)) {
    throw new Error("TWELVE_DATA_API_KEY is missing");
  }

  const requests: MarketRequest[] = [
    ...env.krStockSymbols.map((symbol) => ({ symbol, group: "kr-stock" as const })),
    ...env.usMarketSymbols.map((symbol) => ({ symbol, group: "us-market" as const })),
    ...env.fxPairs.map((symbol) => ({ symbol, group: "fx" as const })),
  ];

  const results = await Promise.allSettled(
    requests.map((request) => getTwelveDataTicker(request)),
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<MarketTicker> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);
}

async function getMarketsFromYahoo(): Promise<MarketTicker[]> {
  const requests: MarketRequest[] = [
    ...env.krStockSymbols.map((symbol) => ({ symbol, group: "kr-stock" as const })),
    ...env.usMarketSymbols.map((symbol) => ({ symbol, group: "us-market" as const })),
    ...env.fxPairs.map((symbol) => ({ symbol, group: "fx" as const })),
  ];

  const results = await Promise.allSettled(
    requests.map((request) => getYahooTicker(request)),
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<MarketTicker> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);
}

async function getFxFallbackFromFrankfurter(): Promise<MarketTicker[]> {
  type FrankfurterResponse = {
    base: string;
    rates: Record<string, number>;
  };

  const groupedPairs = env.fxPairs.reduce<Record<string, string[]>>((acc, pair) => {
    const [base, quote] = pair.split("/");
    if (!base || !quote) {
      return acc;
    }

    if (!acc[base]) {
      acc[base] = [];
    }

    acc[base].push(quote);
    return acc;
  }, {});

  const responses = await Promise.all(
    Object.entries(groupedPairs).map(async ([base, quotes]) => {
      const url =
        "https://api.frankfurter.dev/v1/latest" +
        `?base=${encodeURIComponent(base)}` +
        `&symbols=${encodeURIComponent(quotes.join(","))}`;

      const payload = await fetchJson<FrankfurterResponse>(url, { revalidate: 3600 });
      return Object.entries(payload.rates).map(([quote, rate]) => ({
        id: `fx-${base}-${quote}`,
        name: symbolAlias(`${base}/${quote}`, `${base}/${quote}`),
        symbol: `${base}/${quote}`,
        price: rate,
        currency: quote,
        changePercent: 0,
        sparkline: [rate * 0.997, rate * 1.002, rate * 0.999, rate],
        series: [
          {
            time: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
            value: rate * 0.997,
          },
          {
            time: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
            value: rate * 1.002,
          },
          {
            time: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
            value: rate * 0.999,
          },
          { time: new Date().toISOString().slice(0, 10), value: rate },
        ],
        group: "fx" as const,
        marketLabel: MARKET_LABELS.fx,
        exchange: "Frankfurter",
      }));
    }),
  );

  return responses.flat();
}

async function getMarkets(): Promise<{
  data: MarketTicker[];
  status: ProviderStatus;
}> {
  if (env.marketDataProvider === "yahoo") {
    const data = await getMarketsFromYahoo();
    return {
      data,
      status: {
        label: "Markets",
        source: "Yahoo Finance",
        mode: "live",
        note: "KR stocks, US indices and FX pairs",
      },
    };
  }

  if (env.marketDataProvider === "frankfurter") {
    const data = await getFxFallbackFromFrankfurter();
    return {
      data,
      status: {
        label: "Markets",
        source: "Frankfurter",
        mode: "live",
        note: "FX only reference rates",
      },
    };
  }

  try {
    const data = isPlaceholderApiKey(env.twelveDataApiKey)
      ? await getMarketsFromYahoo()
      : await getMarketsFromTwelveData();
    if (data.length === 0) {
      throw new Error("No market symbols resolved");
    }

    return {
      data,
      status: {
        label: "Markets",
        source: isPlaceholderApiKey(env.twelveDataApiKey)
          ? "Yahoo Finance"
          : "Twelve Data",
        mode: "live",
        note: "KR stocks, US indices and FX pairs",
      },
    };
  } catch {
    const data = await getFxFallbackFromFrankfurter();
    return {
      data,
      status: {
        label: "Markets",
        source: "Frankfurter",
        mode: "fallback",
        note: "Stock feed unavailable, showing FX fallback only",
      },
    };
  }
}

function buildFallbackBoard(
  news: NewsItem[],
  weather?: WeatherSnapshot,
  markets?: MarketTicker[],
  providerStatus: ProviderStatus[] = [],
): BoardData {
  return {
    locale: env.locale,
    timezone: env.timezone,
    generatedAt: new Date().toISOString(),
    newsPageSize: env.newsPageSize,
    newsSlideIntervalMs: env.newsSlideIntervalMs,
    news,
    weather:
      weather || {
        location: env.weatherLocationLabel,
        currentTemp: 0,
        apparentTemp: 0,
        humidity: 0,
        weatherCode: 0,
        daily: Array.from({ length: 5 }, (_, index) => ({
          date: new Date(Date.now() + index * 86400000).toISOString(),
          label: formatDayLabel(
            new Date(Date.now() + index * 86400000),
            env.locale,
            env.timezone,
          ),
          min: 0,
          max: 0,
          weatherCode: 0,
        })),
      },
    markets:
      markets ||
      [
        {
          id: "fallback-market",
          name: "시장 데이터를 불러오는 중",
          symbol: "N/A",
          price: 0,
          currency: "USD",
          changePercent: 0,
          sparkline: [0, 0, 0, 0],
          series: [
            {
              time: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
              value: 0,
            },
            { time: new Date().toISOString().slice(0, 10), value: 0 },
          ],
          group: "us-market",
          marketLabel: MARKET_LABELS["us-market"],
        },
      ],
    providerStatus,
  };
}

export async function getBoardData(): Promise<BoardData> {
  const [weatherResult, newsResult, marketsResult] = await Promise.allSettled([
    getWeather(),
    getNews(),
    getMarkets(),
  ]);

  const providerStatus: ProviderStatus[] = [];

  const news =
    newsResult.status === "fulfilled"
      ? (providerStatus.push(newsResult.value.status), newsResult.value.data)
      : [];

  const weather =
    weatherResult.status === "fulfilled"
      ? (providerStatus.push(weatherResult.value.status), weatherResult.value.data)
      : undefined;

  const markets =
    marketsResult.status === "fulfilled"
      ? (providerStatus.push(marketsResult.value.status), marketsResult.value.data)
      : undefined;

  if (weatherResult.status === "rejected") {
    providerStatus.push({
      label: "Weather",
      source: "Open-Meteo",
      mode: "fallback",
      note: "Unable to refresh right now",
    });
  }

  if (newsResult.status === "rejected") {
    providerStatus.push({
      label: "News",
      source: env.newsProvider === "newsapi" ? "NewsAPI" : "RSS",
      mode: "fallback",
      note: "Unable to refresh right now",
    });
  }

  if (marketsResult.status === "rejected") {
    providerStatus.push({
      label: "Markets",
      source: "Market data",
      mode: "fallback",
      note: "Unable to refresh right now",
    });
  }

  return buildFallbackBoard(news, weather, markets, providerStatus);
}

export function getWeatherDescription(code: number) {
  return describeWeather(code);
}
