import type { SceneAmbience } from "@/components/tree-scene";
import { gridToLatLon, type KmaGrid } from "@/lib/kma-grid";

import { fetchWeather } from "./kma";
import { isNightAt } from "./sun";

/** 트리 지역의 지금 날씨와 낮밤. 페이지를 열 때 한 번 정한다. */
export async function getAmbience(
  grid: KmaGrid,
  now = new Date(),
): Promise<SceneAmbience> {
  const { lat, lon } = gridToLatLon(grid);
  return {
    weather: await fetchWeather(grid, now),
    time: isNightAt(now, lat, lon) ? "night" : "day",
  };
}
