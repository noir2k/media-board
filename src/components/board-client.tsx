"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { ClockPanel } from "@/components/clock-panel";
import {
  type BoardData,
  type MarketTicker,
  getWeatherDescription,
} from "@/lib/board-data";
import { formatCurrency, formatSignedNumber } from "@/lib/format";
import { WeatherIcon } from "@/components/weather-icon";

type BoardClientProps = {
  initialData: BoardData;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to refresh board data");
  }

  return (await response.json()) as BoardData;
};

const MarketHeroChart = dynamic(
  () =>
    import("@/components/market-hero-chart").then((module) => ({
      default: module.MarketHeroChart,
    })),
  {
    ssr: false,
    loading: () => <div className="heroChartPlaceholder" />,
  },
);

const MARKET_HERO_ROTATE_INTERVAL_MS = 10000;

function heroBadge(ticker: MarketTicker) {
  if (ticker.group === "kr-stock") {
    return "KR";
  }

  if (ticker.group === "us-market") {
    return "US";
  }

  if (ticker.symbol.includes("JPY")) {
    return "JP";
  }

  if (ticker.symbol.includes("EUR")) {
    return "EU";
  }

  if (ticker.symbol.includes("USD")) {
    return "US";
  }

  return "FX";
}

function MarketCard({
  locale,
  ticker,
}: {
  locale: string;
  ticker: MarketTicker;
}) {
  const positive = ticker.changePercent >= 0;

  return (
    <article className="marketCard">
      <span className="marketCardName">{ticker.name}</span>
      <strong>{formatCurrency(ticker.price, locale, ticker.currency)}</strong>
      <span className={`marketCardChange ${positive ? "up" : "down"}`}>
        {formatSignedNumber(ticker.changePercent, locale, {
          maximumFractionDigits: 2,
        })}
        %
      </span>
    </article>
  );
}

function chunkNews<T>(items: T[], size: number) {
  if (items.length === 0) {
    return [];
  }

  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }

  return pages;
}

function getPreferredHeroIndex(tickers: MarketTicker[]) {
  const preferredOrder = ["^GSPC", "^IXIC", "^DJI", "SPY", "QQQ", "DIA"];

  for (const symbol of preferredOrder) {
    const matchIndex = tickers.findIndex((ticker) => ticker.symbol === symbol);
    if (matchIndex >= 0) {
      return matchIndex;
    }
  }

  return 0;
}

export function BoardClient({ initialData }: BoardClientProps) {
  const { data } = useSWR("/api/board", fetcher, {
    fallbackData: initialData,
    refreshInterval: 180000,
    revalidateOnFocus: false,
  });

  const board = data || initialData;
  const newsSource = board.news[0]?.source || "뉴스";
  const configuredNewsPageSize = Math.max(1, Math.floor(board.newsPageSize || 6));
  const newsSlideIntervalMs = Math.max(
    2000,
    Math.floor(board.newsSlideIntervalMs || 8000),
  );
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const newsPageSize = useMemo(() => {
    if (viewportWidth !== null && viewportWidth <= 480) {
      return Math.min(configuredNewsPageSize, 3);
    }

    if (viewportWidth !== null && viewportWidth <= 720) {
      return Math.min(configuredNewsPageSize, 4);
    }

    return configuredNewsPageSize;
  }, [configuredNewsPageSize, viewportWidth]);
  const newsPages = useMemo(
    () => chunkNews(board.news, newsPageSize),
    [board.news, newsPageSize],
  );
  const [newsPageIndex, setNewsPageIndex] = useState(0);
  const heroTickers = useMemo(
    () =>
      board.markets.filter(
        (ticker) => ticker.series.length > 1 || ticker.sparkline.length > 1,
      ),
    [board.markets],
  );
  const heroTickerSignature = heroTickers.map((ticker) => ticker.id).join("|");
  const [heroIndex, setHeroIndex] = useState(() =>
    getPreferredHeroIndex(heroTickers),
  );

  useEffect(() => {
    const syncViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth, { passive: true });

    return () => window.removeEventListener("resize", syncViewportWidth);
  }, []);

  useEffect(() => {
    setNewsPageIndex(0);
  }, [newsPages.length]);

  useEffect(() => {
    setHeroIndex(getPreferredHeroIndex(heroTickers));
  }, [heroTickerSignature]);

  useEffect(() => {
    if (newsPages.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setNewsPageIndex((current) => (current + 1) % newsPages.length);
    }, newsSlideIntervalMs);

    return () => window.clearInterval(timer);
  }, [newsPages.length, newsSlideIntervalMs]);

  useEffect(() => {
    if (heroTickers.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroTickers.length);
    }, MARKET_HERO_ROTATE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [heroTickers.length]);

  const marketHero =
    heroTickers[heroIndex] ||
    board.markets.find((ticker) => ticker.group === "us-market") ||
    board.markets.find((ticker) => ticker.group === "kr-stock") ||
    board.markets[0];

  const marketCards = board.markets
    .filter((ticker) => ticker.id !== marketHero?.id)
    .slice(0, 6);
  const weatherMin = Math.min(...board.weather.daily.map((day) => day.min));
  const weatherMax = Math.max(...board.weather.daily.map((day) => day.max));
  const weatherRange = Math.max(1, weatherMax - weatherMin);

  return (
    <main className="boardShell">
      <div className="signageBoard">
        <section className="newsArea">
          <div className="newsSource">{newsSource}</div>
          <div className="newsViewport">
            {newsPages.length > 0 ? (
              <div
                className="newsPages"
                style={{ transform: `translateY(-${newsPageIndex * 100}%)` }}
              >
                {newsPages.map((page, pageIndex) => (
                  <ul className="signageNewsList" key={`${newsSource}-${pageIndex}`}>
                    {page.map((item) => (
                      <li key={`${item.id}-${item.publishedAt}`}>
                        <span className="newsBullet">-</span>
                        <span className="signageNewsText">{item.title}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            ) : (
              <ul className="signageNewsList">
                <li>뉴스 데이터를 불러올 수 없습니다.</li>
              </ul>
            )}
          </div>
        </section>

        <section className="weatherArea">
          <div className="weatherHeader">
            <div className="weatherHeroBlock">
              <WeatherIcon
                code={board.weather.weatherCode}
                className="weatherHeroIcon"
              />
              <div className="weatherHeroTemp">
                <strong>{Math.round(board.weather.currentTemp)}°</strong>
                <div className="weatherHeroMeta">
                  <span>{getWeatherDescription(board.weather.weatherCode)}</span>
                  <span>체감 {Math.round(board.weather.apparentTemp)}°</span>
                </div>
              </div>
            </div>
          </div>

          <div className="weatherRows">
            {board.weather.daily.map((day) => {
              const left = ((day.min - weatherMin) / weatherRange) * 100;
              const width = ((day.max - day.min) / weatherRange) * 100;

              return (
                <div key={day.date} className="weatherRow">
                  <span className="weatherDay">{day.label}</span>
                  <span className="weatherLow">{Math.round(day.min)}°</span>
                  <div className="weatherTrack">
                    <div
                      className="weatherFill"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(12, width)}%`,
                      }}
                    />
                  </div>
                  <span className="weatherHigh">{Math.round(day.max)}°</span>
                </div>
              );
            })}
          </div>

          <div className="weatherFooter">
            <ClockPanel locale={board.locale} timezone={board.timezone} />
            <div className="weatherNow">
              <span>{board.weather.location}</span>
              <span>습도 {board.weather.humidity}%</span>
            </div>
          </div>
        </section>

        <section className="heroArea">
          {marketHero ? (
            <article className="heroMarketCard heroMarketCardAnimated" key={marketHero.id}>
              <div className="heroMarketTop">
                <div>
                  <span className="heroMarketLabel">{marketHero.name}</span>
                  <strong>
                    {formatCurrency(marketHero.price, board.locale, marketHero.currency)}
                  </strong>
                  <span className="heroMarketExchange">
                    {marketHero.exchange || marketHero.marketLabel}
                  </span>
                </div>
                <div className="heroMarketMeta">
                  <span
                    className={`heroChange ${marketHero.changePercent >= 0 ? "up" : "down"}`}
                  >
                    {formatSignedNumber(marketHero.changePercent, board.locale, {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </span>
                  <span className="heroFlag">{heroBadge(marketHero)}</span>
                </div>
              </div>
              <MarketHeroChart
                positive={marketHero.changePercent >= 0}
                series={marketHero.series}
              />
            </article>
          ) : null}
        </section>

        <section className="marketArea">
          <div className="marketGrid">
            {marketCards.map((ticker) => (
              <MarketCard key={ticker.id} locale={board.locale} ticker={ticker} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
