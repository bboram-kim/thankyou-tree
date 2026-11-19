import { expect, test } from "vitest";

import { gridToLatLon, isInGrid, latLonToGrid, SEOUL_GRID } from "./kma-grid";

test("위경도를 기상청 5km 격자 번호로 바꾼다 (AC2)", () => {
  // 서울시청, 부산시청: 기상청 격자 위경도 표의 값
  expect(latLonToGrid(37.5665, 126.978)).toEqual({ nx: 60, ny: 127 });
  expect(latLonToGrid(35.1796, 129.0756)).toEqual({ nx: 98, ny: 76 });
});

test("격자 밖(국외)은 격자로 인정하지 않는다 (AC3)", () => {
  expect(isInGrid(latLonToGrid(37.5665, 126.978))).toBe(true);
  expect(isInGrid(latLonToGrid(48.8566, 2.3522))).toBe(false); // 파리
  expect(isInGrid(latLonToGrid(40.7128, -74.006))).toBe(false); // 뉴욕
  expect(isInGrid({ nx: 0, ny: 10 })).toBe(false);
  expect(isInGrid({ nx: 60.5, ny: 127 })).toBe(false);
});

test("격자 번호에서 격자 중심의 위경도를 되돌린다 (낮밤 계산용)", () => {
  const { lat, lon } = gridToLatLon(SEOUL_GRID);
  expect(lat).toBeCloseTo(37.57, 1);
  expect(lon).toBeCloseTo(126.98, 1);
});
