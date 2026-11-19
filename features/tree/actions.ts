"use server";

import { isInGrid, SEOUL_GRID, type KmaGrid } from "@/lib/kma-grid";

import { canChoosePlacement, canCreateTree, type Position } from "./rules";
import { addOrnament, createTree } from "./tree-api";

/** region이 없거나 기상청 격자 밖(국외 등)이면 서울로 만든다. */
export async function createTreeAction(ownerName: string, region: KmaGrid | null) {
  if (!canCreateTree(ownerName)) throw new Error("이름을 확인해 주세요.");
  const regionFallback = !region || !isInGrid(region);
  const tokens = await createTree(
    ownerName,
    regionFallback ? SEOUL_GRID : { nx: region.nx, ny: region.ny },
  );
  return { ...tokens, regionFallback };
}

export async function addOrnamentAction(input: {
  shareToken: string;
  senderName: string;
  message: string;
  imagePath: string;
  position: Position;
}) {
  if (
    !canChoosePlacement({
      hasPhoto: true,
      senderName: input.senderName,
      message: input.message,
    })
  ) {
    throw new Error("이름과 감사 한 줄을 확인해 주세요.");
  }
  await addOrnament(input);
}
