import { describe, expect, test } from "vitest";

import {
  canChoosePlacement,
  canCreateTree,
  pointerToPosition,
} from "./rules";

describe("트리 만들기 (AC1)", () => {
  test("이름이 비어 있거나 공백뿐이면 트리를 만들 수 없다", () => {
    expect(canCreateTree("")).toBe(false);
    expect(canCreateTree("   ")).toBe(false);
  });

  test("이름이 1–20자이면 트리를 만들 수 있다", () => {
    expect(canCreateTree("이도윤")).toBe(true);
    expect(canCreateTree("가".repeat(20))).toBe(true);
  });
});

describe("위치 정하기 활성 조건 (AC7)", () => {
  const ok = { hasPhoto: true, senderName: "김지현", message: "고마워요" };

  test("사진, 이름, 감사 한 줄이 모두 있어야 한다", () => {
    expect(canChoosePlacement(ok)).toBe(true);
    expect(canChoosePlacement({ ...ok, hasPhoto: false })).toBe(false);
    expect(canChoosePlacement({ ...ok, senderName: " " })).toBe(false);
    expect(canChoosePlacement({ ...ok, message: "" })).toBe(false);
  });

  test("이름은 20자, 감사 한 줄은 60자를 넘으면 안 된다", () => {
    expect(canChoosePlacement({ ...ok, senderName: "가".repeat(21) })).toBe(false);
    expect(canChoosePlacement({ ...ok, message: "가".repeat(60) })).toBe(true);
    expect(canChoosePlacement({ ...ok, message: "가".repeat(61) })).toBe(false);
  });
});

describe("끌어서 놓은 위치 (AC8)", () => {
  const rect = { left: 100, top: 200, width: 300, height: 380 };

  test("포인터 위치를 트리 영역 안 비율(%)로 바꾼다", () => {
    // 가로 절반(250), 세로 50%(390) - 오너먼트 매달림 보정 6%p
    expect(pointerToPosition(rect, { clientX: 250, clientY: 390 })).toEqual({
      x: 50,
      y: 44,
    });
  });

  test("영역 밖으로 나가도 가장자리 안쪽에 머문다", () => {
    expect(pointerToPosition(rect, { clientX: -999, clientY: -999 })).toEqual({
      x: 8,
      y: 4,
    });
    expect(pointerToPosition(rect, { clientX: 9999, clientY: 9999 })).toEqual({
      x: 92,
      y: 86,
    });
  });
});
