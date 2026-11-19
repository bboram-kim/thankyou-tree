"use server";

import { canChoosePlacement, canCreateTree, type Position } from "./rules";
import { addOrnament, createTree } from "./tree-api";

export async function createTreeAction(ownerName: string) {
  if (!canCreateTree(ownerName)) throw new Error("이름을 확인해 주세요.");
  return createTree(ownerName);
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
