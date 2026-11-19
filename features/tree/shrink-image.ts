const MAX_SIDE = 800;

/**
 * 배경 제거 전에 사진을 줄인다. 휴대폰 사진(수천 px)을 그대로 처리하면 느리고,
 * 결과 PNG가 저장 한도(2MB)를 넘을 수 있다. 읽을 수 없는 형식(예: HEIC)은 여기서 실패한다.
 */
export async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지를 줄이지 못했어요."))),
      "image/png",
    ),
  );
}
