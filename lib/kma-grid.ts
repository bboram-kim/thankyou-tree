/**
 * 기상청 동네예보 5km 격자(람베르트 정각원추도법) 변환.
 * 공공데이터포털 "기상청_단기예보 조회서비스" 활용 가이드의 격자 변환식.
 */
export type KmaGrid = { nx: number; ny: number };

/** 위치를 받지 못한 트리와 이 기능 이전 트리의 지역 */
export const SEOUL_GRID: KmaGrid = { nx: 60, ny: 127 };

const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0;
const SLAT2 = 60.0;
const OLON = 126.0;
const OLAT = 38.0;
const XO = 43;
const YO = 136;
const NX_MAX = 149;
const NY_MAX = 253;

const DEGRAD = Math.PI / 180;
const re = RE / GRID;
const slat1 = SLAT1 * DEGRAD;
const slat2 = SLAT2 * DEGRAD;
const olon = OLON * DEGRAD;
const olat = OLAT * DEGRAD;
const sn =
  Math.log(Math.cos(slat1) / Math.cos(slat2)) /
  Math.log(
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
      Math.tan(Math.PI * 0.25 + slat1 * 0.5),
  );
const sf =
  (Math.pow(Math.tan(Math.PI * 0.25 + slat1 * 0.5), sn) * Math.cos(slat1)) / sn;
const ro = (re * sf) / Math.pow(Math.tan(Math.PI * 0.25 + olat * 0.5), sn);

export function latLonToGrid(lat: number, lon: number): KmaGrid {
  const ra = (re * sf) / Math.pow(Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5), sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;
  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

export function gridToLatLon({ nx, ny }: KmaGrid): { lat: number; lon: number } {
  const xn = nx - XO;
  const yn = ro - ny + YO;
  let ra = Math.sqrt(xn * xn + yn * yn);
  if (sn < 0) ra = -ra;
  const alat = 2 * Math.atan(Math.pow((re * sf) / ra, 1 / sn)) - Math.PI * 0.5;
  const theta = Math.atan2(xn, yn);
  return { lat: alat / DEGRAD, lon: (theta / sn + olon) / DEGRAD };
}

/** 기상청 예보가 있는 격자 범위 안인가 */
export function isInGrid({ nx, ny }: KmaGrid): boolean {
  return (
    Number.isInteger(nx) &&
    Number.isInteger(ny) &&
    nx >= 1 &&
    nx <= NX_MAX &&
    ny >= 1 &&
    ny <= NY_MAX
  );
}
