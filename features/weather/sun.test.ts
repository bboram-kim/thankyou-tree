import { expect, test } from "vitest";

import { isNightAt, sunTimes } from "./sun";

// 서울 2026-11-19 일출 07:12, 일몰 17:18 무렵(KST)
const SEOUL = { lat: 37.5665, lon: 126.978 };
const kst = (hhmm: string) => new Date(`2026-11-19T${hhmm}:00+09:00`);

test("격자 위치와 날짜로 오늘의 일출·일몰을 계산한다", () => {
  const { sunrise, sunset } = sunTimes(kst("12:00"), SEOUL.lat, SEOUL.lon);
  expect(Math.abs(sunrise.getTime() - kst("07:12").getTime())).toBeLessThan(6 * 60e3);
  expect(Math.abs(sunset.getTime() - kst("17:18").getTime())).toBeLessThan(6 * 60e3);
});

test("일출 이후 일몰 전이면 낮, 그 밖은 밤이다 (AC9)", () => {
  expect(isNightAt(kst("06:30"), SEOUL.lat, SEOUL.lon)).toBe(true);
  expect(isNightAt(kst("09:00"), SEOUL.lat, SEOUL.lon)).toBe(false);
  expect(isNightAt(kst("16:50"), SEOUL.lat, SEOUL.lon)).toBe(false);
  expect(isNightAt(kst("17:40"), SEOUL.lat, SEOUL.lon)).toBe(true);
  expect(isNightAt(kst("23:59"), SEOUL.lat, SEOUL.lon)).toBe(true);
  expect(isNightAt(new Date("2026-11-19T00:10:00+09:00"), SEOUL.lat, SEOUL.lon)).toBe(true);
});
