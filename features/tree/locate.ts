import { latLonToGrid, type KmaGrid } from "@/lib/kma-grid";

/** 권한 창을 그대로 두거나 위치가 늦으면 이 시간 뒤에 포기한다. */
const LOCATE_TIMEOUT_MS = 10_000;

/**
 * 브라우저 위치를 한 번 받아 기상청 격자 번호로만 돌려준다.
 * 위경도는 이 함수 밖으로 나가지 않는다. 거절, 실패, 시간 초과는 null.
 */
export function locateGrid(): Promise<KmaGrid | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    const timer = setTimeout(() => resolve(null), LOCATE_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        clearTimeout(timer);
        resolve(latLonToGrid(coords.latitude, coords.longitude));
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: LOCATE_TIMEOUT_MS, maximumAge: 600_000 },
    );
  });
}
