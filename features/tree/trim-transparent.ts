/**
 * 배경을 지운 PNG의 투명한 가장자리를 잘라 낸다.
 * 잘라 내지 않으면 원본 사진 크기의 빈 공간이 남아 트리에서 끈과 그림 사이가 벌어진다.
 */
export async function trimTransparent(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const ctx = source.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, width, height);
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  // 전부 투명하면 그대로 둔다.
  if (right < 0) return blob;

  const out = document.createElement("canvas");
  out.width = right - left + 1;
  out.height = bottom - top + 1;
  out.getContext("2d")!.drawImage(source, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return new Promise((resolve) =>
    out.toBlob((trimmed) => resolve(trimmed ?? blob), "image/png"),
  );
}
