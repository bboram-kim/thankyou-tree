import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { toast } from "sonner";

import { createTreeAction } from "./actions";
import { CreateTreeForm } from "./create-tree-form";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./actions", () => ({
  createTreeAction: vi.fn(async () => ({
    shareToken: "share123",
    ownerToken: "owner456",
    regionFallback: false,
  })),
}));

const writeText = vi.fn(async () => {});
const getCurrentPosition = vi.fn();

function allowLocation(lat: number, lon: number) {
  getCurrentPosition.mockImplementation((ok: PositionCallback) =>
    ok({ coords: { latitude: lat, longitude: lon } } as GeolocationPosition),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
  allowLocation(37.5665, 126.978);
});

function create(name = "이도윤") {
  fireEvent.change(screen.getByLabelText("내 이름"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "트리 만들기" }));
}

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

test("만들기 전에 위치를 묻는 이유가 이름 입력칸 아래에 보인다 (AC1)", () => {
  render(<CreateTreeForm />);
  expect(
    screen.getByText(
      "트리에 내 동네의 날씨와 낮밤을 담으려고, 만들 때 위치를 한 번 물어봐요. 정확한 위치는 저장하지 않아요.",
    ),
  ).toBeInTheDocument();
  expect(getCurrentPosition).not.toHaveBeenCalled();
});

test("트리 만들기를 누르면 위치를 묻고, 위경도가 아니라 격자 번호만 서버로 보낸다 (AC1, AC2, AC4)", async () => {
  allowLocation(35.1796, 129.0756);
  render(<CreateTreeForm />);
  create();

  expect(await screen.findByText(/이도윤의 트리가 생겼어요/)).toBeInTheDocument();
  expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  expect(createTreeAction).toHaveBeenCalledWith("이도윤", { nx: 98, ny: 76 });
  expect(screen.queryByText("위치를 받지 못해 서울 날씨로 보여요")).not.toBeInTheDocument();
});

test("위치를 거절하면 막지 않고 만들고, 서울 날씨로 보인다는 한 줄이 보인다 (AC3)", async () => {
  getCurrentPosition.mockImplementation((_ok: PositionCallback, fail: PositionErrorCallback) =>
    fail({ code: 1, message: "denied" } as GeolocationPositionError),
  );
  vi.mocked(createTreeAction).mockResolvedValueOnce({
    shareToken: "share123",
    ownerToken: "owner456",
    regionFallback: true,
  });
  render(<CreateTreeForm />);
  create();

  expect(await screen.findByText("위치를 받지 못해 서울 날씨로 보여요")).toBeInTheDocument();
  expect(createTreeAction).toHaveBeenCalledWith("이도윤", null);
});

test("위치를 일정 시간 안에 받지 못하면 서울로 만든다 (AC3)", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  getCurrentPosition.mockImplementation(() => {}); // 권한 창을 그대로 둔 경우
  render(<CreateTreeForm />);
  create();
  await vi.advanceTimersByTimeAsync(15_000);
  vi.useRealTimers();

  await waitFor(() => expect(createTreeAction).toHaveBeenCalledWith("이도윤", null));
});
