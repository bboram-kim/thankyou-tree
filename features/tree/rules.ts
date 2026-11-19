export const OWNER_NAME_MAX = 20;
export const SENDER_NAME_MAX = 20;
export const MESSAGE_MAX = 60;

function within(value: string, max: number): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= max;
}

export function canCreateTree(ownerName: string): boolean {
  return within(ownerName, OWNER_NAME_MAX);
}

export function canChoosePlacement(draft: {
  hasPhoto: boolean;
  senderName: string;
  message: string;
}): boolean {
  return (
    draft.hasPhoto &&
    within(draft.senderName, SENDER_NAME_MAX) &&
    within(draft.message, MESSAGE_MAX)
  );
}

/** 트리 영역 안의 위치. 가로세로 모두 영역 크기에 대한 비율(%)이다. */
export type Position = { x: number; y: number };

const X_RANGE = [8, 92] as const;
const Y_RANGE = [4, 86] as const;
// 오너먼트는 끈이 달린 윗부분이 기준점이라, 손가락 위치보다 조금 위로 보정한다.
const HANG_OFFSET = 6;

const clamp = (value: number, [min, max]: readonly [number, number]) =>
  Math.min(max, Math.max(min, value));

export function pointerToPosition(
  rect: { left: number; top: number; width: number; height: number },
  pointer: { clientX: number; clientY: number },
): Position {
  return {
    x: clamp(((pointer.clientX - rect.left) / rect.width) * 100, X_RANGE),
    y: clamp(
      ((pointer.clientY - rect.top) / rect.height) * 100 - HANG_OFFSET,
      Y_RANGE,
    ),
  };
}
