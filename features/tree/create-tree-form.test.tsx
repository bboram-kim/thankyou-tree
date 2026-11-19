import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { toast } from "sonner";

import { CreateTreeForm } from "./create-tree-form";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./actions", () => ({
  createTreeAction: vi.fn(async () => ({
    shareToken: "share123",
    ownerToken: "owner456",
  })),
}));

const writeText = vi.fn(async () => {});

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

test("이름을 비우면 트리 만들기를 누를 수 없고, 이름은 20자까지만 입력된다 (AC1)", () => {
  render(<CreateTreeForm />);

  expect(screen.getByRole("button", { name: "트리 만들기" })).toBeDisabled();
  expect(screen.getByLabelText("내 이름")).toHaveAttribute("maxlength", "20");

  fireEvent.change(screen.getByLabelText("내 이름"), {
    target: { value: "이도윤" },
  });
  expect(screen.getByRole("button", { name: "트리 만들기" })).toBeEnabled();
});

test("트리를 만들면 공유 링크와 주인 링크, 저장 경고가 보이고 복사하면 토스트가 뜬다 (AC2)", async () => {
  render(<CreateTreeForm />);
  fireEvent.change(screen.getByLabelText("내 이름"), {
    target: { value: "이도윤" },
  });
  fireEvent.click(screen.getByRole("button", { name: "트리 만들기" }));

  expect(await screen.findByText(/이도윤의 트리가 생겼어요/)).toBeInTheDocument();
  expect(screen.getByText(/\/t\/share123$/)).toBeInTheDocument();
  expect(screen.getByText(/\/o\/owner456$/)).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("내 링크는 꼭 따로 저장해 두세요");

  const [copyShare, copyOwner] = screen.getAllByRole("button", { name: "복사" });
  fireEvent.click(copyShare);
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/t\/share123$/)),
  );
  expect(toast.success).toHaveBeenCalledWith("공유 링크를 복사했어요");

  fireEvent.click(copyOwner);
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/o\/owner456$/)),
  );
  expect(toast.success).toHaveBeenCalledWith("내 링크를 복사했어요");
});
