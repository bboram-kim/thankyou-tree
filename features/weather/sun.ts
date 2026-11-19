/**
 * 일출·일몰 계산(일출 방정식, NOAA 근사). 오차는 몇 분 안쪽이다.
 * "오늘"은 한국 시각(UTC+9) 기준 날짜다.
 */
const DEG = Math.PI / 180;
const J2000 = 2451545;
const KST_OFFSET_MS = 9 * 3600e3;

const toJulian = (ms: number) => ms / 86400e3 + 2440587.5;
const fromJulian = (j: number) => new Date((j - 2440587.5) * 86400e3);

export function sunTimes(now: Date, lat: number, lon: number) {
  // 한국 날짜의 정오(UTC로는 03:00)를 기준 날로 잡는다.
  const kstDay = Math.floor((now.getTime() + KST_OFFSET_MS) / 86400e3);
  const noonUtcMs = kstDay * 86400e3 + 3 * 3600e3;
  const n = Math.round(toJulian(noonUtcMs) - J2000 + 0.0008);

  const jStar = n - lon / 360;
  const m = (357.5291 + 0.98560028 * jStar) % 360;
  const c =
    1.9148 * Math.sin(m * DEG) +
    0.02 * Math.sin(2 * m * DEG) +
    0.0003 * Math.sin(3 * m * DEG);
  const lambda = (m + c + 180 + 102.9372) % 360;
  const transit =
    J2000 + jStar + 0.0053 * Math.sin(m * DEG) - 0.0069 * Math.sin(2 * lambda * DEG);
  const sinDecl = Math.sin(lambda * DEG) * Math.sin(23.4397 * DEG);
  const cosDecl = Math.cos(Math.asin(sinDecl));
  const cosW =
    (Math.sin(-0.833 * DEG) - Math.sin(lat * DEG) * sinDecl) /
    (Math.cos(lat * DEG) * cosDecl);
  const w = Math.acos(Math.min(1, Math.max(-1, cosW))) / DEG;

  return {
    sunrise: fromJulian(transit - w / 360),
    sunset: fromJulian(transit + w / 360),
  };
}

/** 오늘 일출 이후 일몰 전이면 낮, 그 밖은 밤 */
export function isNightAt(now: Date, lat: number, lon: number): boolean {
  const { sunrise, sunset } = sunTimes(now, lat, lon);
  return now < sunrise || now >= sunset;
}
