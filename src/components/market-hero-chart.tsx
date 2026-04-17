"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  LineType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

import type { MarketTicker } from "@/lib/board-data";

type MarketHeroChartProps = {
  positive: boolean;
  series: MarketTicker["series"];
};

function buildPalette(positive: boolean) {
  if (positive) {
    return {
      line: "#7fe9ff",
      top: "rgba(127, 233, 255, 0.28)",
      bottom: "rgba(127, 233, 255, 0.02)",
      marker: "#f5e08a",
    };
  }

  return {
    line: "#ff8d87",
    top: "rgba(255, 141, 135, 0.24)",
    bottom: "rgba(255, 141, 135, 0.02)",
    marker: "#ffd7c8",
  };
}

export function MarketHeroChart({
  positive,
  series,
}: MarketHeroChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area", Time> | null>(null);

  const data = useMemo(
    () =>
      series
        .filter((point) => Number.isFinite(point.value))
        .map((point) => ({
          time: point.time,
          value: point.value,
        })),
    [series],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const palette = buildPalette(positive);
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "#060606",
        },
        attributionLogo: false,
        textColor: "rgba(255, 255, 255, 0.52)",
        fontFamily: "Pretendard, Pretendard Variable, Segoe UI, sans-serif",
      },
      grid: {
        vertLines: {
          color: "rgba(255, 255, 255, 0.04)",
        },
        horzLines: {
          color: "rgba(255, 255, 255, 0.07)",
        },
      },
      crosshair: {
        vertLine: {
          visible: false,
          labelVisible: false,
        },
        horzLine: {
          visible: false,
          labelVisible: false,
        },
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
        scaleMargins: {
          top: 0.14,
          bottom: 0.12,
        },
      },
      leftPriceScale: {
        visible: false,
        borderVisible: false,
      },
      timeScale: {
        visible: false,
        borderVisible: false,
        ticksVisible: false,
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 0.6,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    const chartSeries = chart.addSeries(AreaSeries, {
      lineColor: palette.line,
      topColor: palette.top,
      bottomColor: palette.bottom,
      lineWidth: 3,
      lineType: LineType.Curved,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBorderColor: palette.marker,
      crosshairMarkerBackgroundColor: palette.line,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chartSeries.setData(data);
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    chartRef.current = chart;
    seriesRef.current = chartSeries;

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const chartSeries = seriesRef.current;
    if (!chart || !chartSeries) {
      return;
    }

    const palette = buildPalette(positive);
    chartSeries.applyOptions({
      lineColor: palette.line,
      topColor: palette.top,
      bottomColor: palette.bottom,
      crosshairMarkerBorderColor: palette.marker,
      crosshairMarkerBackgroundColor: palette.line,
    });
    chartSeries.setData(data);
    chart.timeScale().fitContent();
  }, [data, positive]);

  return <div className="heroChartCanvas" ref={containerRef} />;
}
