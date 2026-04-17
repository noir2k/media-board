"use client";

import { useEffect, useState } from "react";

type ClockPanelProps = {
  locale: string;
  timezone: string;
};

export function ClockPanel({ locale, timezone }: ClockPanelProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const parts = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).formatToParts(now);

  const period =
    parts.find((part) => part.type === "dayPeriod")?.value?.toUpperCase() || "";
  const hour24 = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).format(now),
  );
  const isAfternoon = Number.isFinite(hour24) ? hour24 >= 12 : period.includes("PM");
  const time = parts
    .filter((part) => part.type === "hour" || part.type === "minute" || part.value === ":")
    .map((part) => part.value)
    .join("");

  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: timezone,
  }).format(now);

  return (
    <div className="clockPanel">
      <div className="clockTimeRow">
        <div className="clockPeriodRow" aria-label="day period">
          <span className={`clockPeriod ${!isAfternoon ? "active" : ""}`}>오전</span>
          <span className="clockPeriodDivider" />
          <span className={`clockPeriod ${isAfternoon ? "active" : ""}`}>오후</span>
        </div>
        <strong>{time}</strong>
      </div>
      <span className="clockDate">{dateLabel}</span>
    </div>
  );
}
