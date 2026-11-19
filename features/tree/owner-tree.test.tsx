import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { toast } from "sonner";

import { OwnerTree } from "./owner-tree";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const writeText = vi.fn(async () => {});

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

const ornaments = [
  {
    id: "a",
    imageUrl: "/a.png",
    x: 50,
    y: 22,
    senderName: "김지현",
    message: "올해 코드 리뷰 고마워요!",
    postedOn: "12월 2일",
  },
];

test("오너먼트를 누르면 사진, 이름, 단 날짜, 메시지가 보이고 닫을 수 있다 (AC11)", async () => {
  render(<OwnerTree ownerName="이도윤" shareToken="share123" ornaments={ornaments} />);

  fireEvent.click(screen.getByRole("button", { name: "김지현님의 오너먼트" }));

  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("김지현");
  expect(dialog).toHaveTextContent("12월 2일에 달았어요");
  expect(dialog).toHaveTextContent("올해 코드 리뷰 고마워요!");
  expect(dialog.querySelector("img")).toHaveAttribute("src", "/a.png");

  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("오너먼트가 없으면 공유 링크를 보내 보라는 문구와 공유 링크 복사가 보인다 (AC12)", async () => {
  render(<OwnerTree ownerName="이도윤" shareToken="share123" ornaments={[]} />);

  expect(screen.getByText(/공유 링크를 보내 보세요/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "공유 링크 복사" }));
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/t\/share123$/)),
  );
  expect(toast.success).toHaveBeenCalledWith("공유 링크를 복사했어요");
});
