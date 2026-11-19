import { beforeEach, expect, test, vi } from "vitest";

import { baseTimeFor, clearWeatherCache, fetchWeather, toSceneWeather } from "./kma";

const item = (category: string, fcstTime: string, fcstValue: string) => ({
  category,
  fcstDate: "20261119",
  fcstTime,
  fcstValue,
});

const body = (items: ReturnType<typeof item>[]) => ({
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL_SERVICE" },
    body: { items: { item: items } },
  },
});

test("발표 시각은 매시 30분, 45분 이후부터 그 시각 것을 쓴다", () => {
  expect(baseTimeFor(new Date("2026-11-19T16:44:00+09:00"))).toEqual({
    baseDate: "20261119",
    baseTime: "1530",
  });
  expect(baseTimeFor(new Date("2026-11-19T16:45:00+09:00"))).toEqual({
    baseDate: "20261119",
    baseTime: "1630",
  });
  // 자정 직후는 전날 23:30 발표
  expect(baseTimeFor(new Date("2026-11-20T00:20:00+09:00"))).toEqual({
    baseDate: "20261119",
    baseTime: "2330",
  });
});

test("강수형태와 하늘상태를 트리 날씨로 바꾼다 (AC6)", () => {
  expect(toSceneWeather({ pty: "1", sky: "1" })).toBe("rain");
  expect(toSceneWeather({ pty: "5", sky: "4" })).toBe("rain");
  for (const pty of ["2", "3", "6", "7"]) {
    expect(toSceneWeather({ pty, sky: "4" })).toBe("snow");
  }
  expect(toSceneWeather({ pty: "0", sky: "3" })).toBe("cloudy");
  expect(toSceneWeather({ pty: "0", sky: "4" })).toBe("cloudy");
  expect(toSceneWeather({ pty: "0", sky: "1" })).toBe("clear");
});

const now = new Date("2026-11-19T16:50:00+09:00");
const grid = { nx: 60, ny: 127 };

beforeEach(() => {
  clearWeatherCache();
  vi.stubEnv("DATA_GO_KR_SERVICE_KEY", "test-key");
});

test("가장 가까운 예보 시각의 값으로 날씨를 정한다", async () => {
  const fetcher = vi.fn(async () =>
    Response.json(
      body([
        item("PTY", "1800", "3"),
        item("SKY", "1700", "4"),
        item("PTY", "1700", "0"),
        item("SKY", "1800", "4"),
      ]),
    ),
  );
  expect(await fetchWeather(grid, now, fetcher)).toBe("cloudy");
  const url = new URL(String((fetcher.mock.calls[0] as unknown[])[0]));
  expect(url.searchParams.get("base_time")).toBe("1630");
  expect(url.searchParams.get("nx")).toBe("60");
  expect(url.searchParams.get("serviceKey")).toBe("test-key");
});

test("같은 격자는 30분 동안 다시 부르지 않는다", async () => {
  const fetcher = vi.fn(async () =>
    Response.json(body([item("SKY", "1700", "1"), item("PTY", "1700", "1")])),
  );
  expect(await fetchWeather(grid, now, fetcher)).toBe("rain");
  expect(await fetchWeather(grid, new Date(now.getTime() + 29 * 60e3), fetcher)).toBe("rain");
  expect(fetcher).toHaveBeenCalledTimes(1);
  await fetchWeather(grid, new Date(now.getTime() + 31 * 60e3), fetcher);
  expect(fetcher).toHaveBeenCalledTimes(2);
  await fetchWeather({ nx: 98, ny: 76 }, now, fetcher);
  expect(fetcher).toHaveBeenCalledTimes(3);
});

test("키 오류, 장애, 이상한 응답이면 맑음으로 본다 (AC7)", async () => {
  const keyError = vi.fn(async () =>
    new Response("<OpenAPI_ServiceResponse><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></OpenAPI_ServiceResponse>"),
  );
  expect(await fetchWeather(grid, now, keyError)).toBe("clear");

  clearWeatherCache();
  const down = vi.fn(async () => {
    throw new Error("timeout");
  });
  expect(await fetchWeather(grid, now, down)).toBe("clear");

  clearWeatherCache();
  const noData = vi.fn(async () =>
    Response.json({ response: { header: { resultCode: "03", resultMsg: "NO_DATA" } } }),
  );
  expect(await fetchWeather(grid, now, noData)).toBe("clear");

  clearWeatherCache();
  vi.stubEnv("DATA_GO_KR_SERVICE_KEY", "");
  const never = vi.fn();
  expect(await fetchWeather(grid, now, never)).toBe("clear");
  expect(never).not.toHaveBeenCalled();
});
