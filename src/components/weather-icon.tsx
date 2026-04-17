import Image from "next/image";

type WeatherIconProps = {
  code: number;
  className?: string;
};

function weatherIconPath(code: number) {
  if (code === 0) {
    return "/weather-icons/sun.png";
  }

  if (code === 1 || code === 2) {
    return "/weather-icons/partly-cloudy.png";
  }

  if (code === 3 || code === 45 || code === 48) {
    return "/weather-icons/cloud.png";
  }

  if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) {
    return "/weather-icons/rain.png";
  }

  if (code >= 71 && code <= 77) {
    return "/weather-icons/snow.png";
  }

  if (code >= 95) {
    return "/weather-icons/storm.png";
  }

  return "/weather-icons/cloud.png";
}

export function WeatherIcon({ code, className }: WeatherIconProps) {
  return (
    <Image
      src={weatherIconPath(code)}
      alt=""
      aria-hidden="true"
      width={512}
      height={512}
      className={className}
      priority
    />
  );
}
