type WeatherIconProps = {
  code: number;
  className?: string;
};

function SunIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="8" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M24 5v6" />
        <path d="M24 37v6" />
        <path d="M5 24h6" />
        <path d="M37 24h6" />
        <path d="M10.5 10.5l4.3 4.3" />
        <path d="M33.2 33.2l4.3 4.3" />
        <path d="M37.5 10.5l-4.3 4.3" />
        <path d="M14.8 33.2l-4.3 4.3" />
      </g>
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M16 35h18.5a7.5 7.5 0 0 0 .6-15 10.5 10.5 0 0 0-20.2 2.8A6.5 6.5 0 0 0 16 35Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PartlyCloudyIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g opacity="0.9">
        <circle cx="18" cy="17" r="6" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 6v4" />
          <path d="M18 24v4" />
          <path d="M7 17h4" />
          <path d="M25 17h4" />
        </g>
      </g>
      <path
        d="M19 36h16a6.5 6.5 0 0 0 .5-13 9 9 0 0 0-17 2.3A5.5 5.5 0 0 0 19 36Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RainIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M16 28h18.5a7.5 7.5 0 0 0 .6-15 10.5 10.5 0 0 0-20.2 2.8A6.5 6.5 0 0 0 16 28Z"
        fill="currentColor"
      />
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M18 32l-2 7" />
        <path d="M26 32l-2 7" />
        <path d="M34 32l-2 7" />
      </g>
    </svg>
  );
}

function SnowIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M16 28h18.5a7.5 7.5 0 0 0 .6-15 10.5 10.5 0 0 0-20.2 2.8A6.5 6.5 0 0 0 16 28Z"
        fill="currentColor"
      />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 33v6" />
        <path d="M15 36h6" />
        <path d="M15.8 33.8l4.4 4.4" />
        <path d="M20.2 33.8l-4.4 4.4" />
        <path d="M29 33v6" />
        <path d="M26 36h6" />
        <path d="M26.8 33.8l4.4 4.4" />
        <path d="M31.2 33.8l-4.4 4.4" />
      </g>
    </svg>
  );
}

function StormIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M16 28h18.5a7.5 7.5 0 0 0 .6-15 10.5 10.5 0 0 0-20.2 2.8A6.5 6.5 0 0 0 16 28Z"
        fill="currentColor"
      />
      <path d="M24 30h6l-5 7h4l-9 10 3-8h-5l6-9Z" fill="currentColor" />
    </svg>
  );
}

function FogIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M16 24h18.5a7.5 7.5 0 0 0 .6-15 10.5 10.5 0 0 0-20.2 2.8A6.5 6.5 0 0 0 16 24Z"
        fill="currentColor"
      />
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 30h24" />
        <path d="M9 35h30" />
        <path d="M14 40h20" />
      </g>
    </svg>
  );
}

export function WeatherIcon({ code, className }: WeatherIconProps) {
  let icon = <CloudIcon />;

  if (code === 0) {
    icon = <SunIcon />;
  } else if (code === 1 || code === 2) {
    icon = <PartlyCloudyIcon />;
  } else if (code === 3) {
    icon = <CloudIcon />;
  } else if (code === 45 || code === 48) {
    icon = <FogIcon />;
  } else if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) {
    icon = <RainIcon />;
  } else if (code >= 71 && code <= 77) {
    icon = <SnowIcon />;
  } else if (code >= 95) {
    icon = <StormIcon />;
  }

  return <div className={className}>{icon}</div>;
}
