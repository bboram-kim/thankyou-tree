import type { SceneWeather } from "@/components/tree-scene";
import type { KmaGrid } from "@/lib/kma-grid";

/**
 * 기상청 단기예보 조회서비스의 초단기예보(getUltraSrtFcst).
 * 인증키는 서버에서만 읽는다. 어떤 실패든 맑음으로 본다(AC7).
 */
const ENDPOINT =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";
const CACHE_MS = 30 * 60e3;
const TIMEOUT_MS = 3000;
const KST_OFFSET_MS = 9 * 3600e3;

type Item = { category: string; fcstDate: string; fcstTime: string; fcstValue: string };

/** 매시 30분 발표, 45분 이후 제공. 그 전이면 한 시간 전 발표를 쓴다. */
export function baseTimeFor(now: Date) {
  const kst = new Date(now.getTime() + KST_OFFSET_MS - 45 * 60e3);
  const iso = kst.toISOString();
  return {
    baseDate: iso.slice(0, 10).replaceAll("-", ""),
    baseTime: `${iso.slice(11, 13)}30`,
  };
}

/**
 * 강수형태(PTY) 0 없음, 1 비, 2 비/눈, 3 눈, 5 빗방울, 6 빗방울눈날림, 7 눈날림.
 * 하늘상태(SKY) 1 맑음, 3 구름많음, 4 흐림.
 */
export function toSceneWeather({ pty, sky }: { pty?: string; sky?: string }): SceneWeather {
  if (pty === "1" || pty === "5") return "rain";
  if (pty === "2" || pty === "3" || pty === "6" || pty === "7") return "snow";
  if (sky === "3" || sky === "4") return "cloudy";
  return "clear";
}

const cache = new Map<string, { weather: SceneWeather; until: number }>();

export function clearWeatherCache() {
  cache.clear();
}

export async function fetchWeather(
  grid: KmaGrid,
  now: Date,
  fetcher: typeof fetch = fetch,
): Promise<SceneWeather> {
  const key = `${grid.nx},${grid.ny}`;
  const hit = cache.get(key);
  if (hit && hit.until > now.getTime()) return hit.weather;

  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) return "clear";

  const { baseDate, baseTime } = baseTimeFor(now);
  const url = new URL(ENDPOINT);
  for (const [k, v] of Object.entries({
    serviceKey,
    pageNo: "1",
    numOfRows: "60",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(grid.nx),
    ny: String(grid.ny),
  })) {
    url.searchParams.set(k, v);
  }

  try {
    const res = await fetcher(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = await res.json();
    if (json?.response?.header?.resultCode !== "00") return "clear";
    const items: Item[] = json.response.body?.items?.item ?? [];
    // 예보 시각 중 가장 이른 것(지금과 가장 가까운 시각)
    const first = items
      .map((i) => i.fcstDate + i.fcstTime)
      .sort()[0];
    const at = (category: string) =>
      items.find((i) => i.category === category && i.fcstDate + i.fcstTime === first)
        ?.fcstValue;
    const weather = toSceneWeather({ pty: at("PTY"), sky: at("SKY") });
    cache.set(key, { weather, until: now.getTime() + CACHE_MS });
    return weather;
  } catch {
    return "clear";
  }
}
