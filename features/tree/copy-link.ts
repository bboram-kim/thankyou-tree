import { toast } from "sonner";

/** 사이트 안 경로를 전체 주소로 복사하고 토스트로 알린다. */
export async function copyLink(path: string, message: string) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    toast.success(message);
  } catch {
    toast.error("복사하지 못했어요. 링크를 길게 눌러 직접 복사해 주세요.");
  }
}
