import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Home from "@/app/page";

vi.mock("@/features/tree/actions", () => ({ createTreeAction: vi.fn() }));

test("홈 화면은 트리 만들기 화면이다 (AC1)", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "Thank You Tree를 만들어 보세요" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "트리 만들기" })).toBeDisabled();
});
