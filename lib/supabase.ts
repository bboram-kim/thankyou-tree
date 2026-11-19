import { createClient } from "@supabase/supabase-js";

// Auth는 쓰지 않는다. 서버와 브라우저 모두 publishable 키로 연결한다.
// process.env.NEXT_PUBLIC_* 는 브라우저 번들에서 문자 그대로 치환되므로 변수째 꺼내지 않는다.
export function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY가 필요합니다. (.env.local)",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // 트리는 항상 최신 상태로 읽는다.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export const ORNAMENT_BUCKET = "ty-ornaments";

export function ornamentImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${ORNAMENT_BUCKET}/${path}`;
}
