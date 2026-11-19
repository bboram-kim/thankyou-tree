import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { toast } from "sonner";

import { addOrnamentAction } from "./actions";
import { OrnamentComposer } from "./ornament-composer";

const push = vi.fn();
const upload = vi.fn(async () => ({ error: null }));
const removeBackground = vi.fn();
const cutout = new Blob(["cutout"], { type: "image/png" });

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./shrink-image", () => ({ shrinkImage: async (file: File) => file }));
vi.mock("./trim-transparent", () => ({ trimTransparent: async (blob: Blob) => blob }));
vi.mock("./actions", () => ({ addOrnamentAction: vi.fn(async () => {}) }));
vi.mock("@/lib/supabase", () => ({
  createSupabase: () => ({ storage: { from: () => ({ upload }) } }),
  ORNAMENT_BUCKET: "ty-ornaments",
}));
vi.mock("@imgly/background-removal", () => ({
  removeBackground: (...args: unknown[]) => removeBackground(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  removeBackground.mockResolvedValue(cutout);
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

const original = new File(["original"], "me.jpg", { type: "image/jpeg" });

async function pickPhoto() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(input, { target: { files: [original] } });
  });
}

function fillText() {
  fireEvent.change(screen.getByLabelText("내 이름"), { target: { value: "김지현" } });
  fireEvent.change(screen.getByLabelText("감사 한 줄"), {
    target: { value: "코드 리뷰 고마워요" },
  });
}

test("사진을 고르면 처리 중 표시 뒤에 배경 제거 미리보기가 나오고 다른 사진을 고를 수 있다 (AC5)", async () => {
  let finish!: (blob: Blob) => void;
  removeBackground.mockReturnValue(new Promise<Blob>((r) => (finish = r)));
  render(<OrnamentComposer shareToken="share123" />);

  await pickPhoto();
  expect(screen.getByText(/배경을 지우는 중이에요/)).toBeInTheDocument();

  await act(async () => finish(cutout));
  expect(await screen.findByAltText("배경을 지운 사진")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "다른 사진 고르기" })).toBeInTheDocument();
});

test("배경 제거에 실패하면 오류가 보이고 사진이 없는 상태로 돌아간다 (AC6)", async () => {
  removeBackground.mockRejectedValue(new Error("unsupported"));
  render(<OrnamentComposer shareToken="share123" />);

  await pickPhoto();

  expect(await screen.findByRole("alert")).toHaveTextContent("배경을 지우지 못했어요");
  expect(screen.queryByAltText("배경을 지운 사진")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "사진 고르기" })).toBeInTheDocument();
});

test("사진, 이름, 감사 한 줄이 모두 있어야 위치 정하기를 누를 수 있고 글자 수와 안내가 보인다 (AC7)", async () => {
  render(<OrnamentComposer shareToken="share123" />);
  const next = screen.getByRole("button", { name: "위치 정하기" });

  expect(screen.getAllByText("트리 주인만 볼 수 있어요")).toHaveLength(2);
  expect(screen.getByText("0/20")).toBeInTheDocument();
  expect(screen.getByText("0/60")).toBeInTheDocument();

  fillText();
  expect(screen.getByText("3/20")).toBeInTheDocument();
  expect(next).toBeDisabled();

  await pickPhoto();
  await screen.findByAltText("배경을 지운 사진");
  expect(next).toBeEnabled();
});

test("오너먼트를 끌어 놓고 확인을 거쳐 달면 배경 제거된 사진만 저장되고 트리로 돌아간다 (AC8, AC9, AC13)", async () => {
  render(<OrnamentComposer shareToken="share123" />);
  fillText();
  await pickPhoto();
  await screen.findByAltText("배경을 지운 사진");
  fireEvent.click(screen.getByRole("button", { name: "위치 정하기" }));

  // 트리 영역을 가로 300, 세로 380으로 둔다.
  const scene = screen.getByTestId("tree-scene");
  scene.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 300, height: 380 }) as DOMRect;
  const mine = screen.getByRole("button", { name: /내 오너먼트/ });
  expect(mine).toHaveClass("touch-none");
  fireEvent.pointerDown(mine, { clientX: 150, clientY: 190, pointerId: 1 });
  fireEvent.pointerMove(mine, { clientX: 60, clientY: 114, pointerId: 1 });
  fireEvent.pointerUp(mine, { pointerId: 1 });
  expect(mine).toHaveStyle({ left: "20%", top: "24%" });

  fireEvent.click(screen.getByRole("button", { name: "여기에 달기" }));
  const dialog = await screen.findByRole("alertdialog");
  expect(dialog).toHaveTextContent("한 번 달면 위치를 옮기거나 지울 수 없어요");

  fireEvent.click(screen.getByRole("button", { name: "다시 정하기" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(push).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "여기에 달기" }));
  fireEvent.click(await screen.findByRole("button", { name: "달기" }));

  await waitFor(() => expect(push).toHaveBeenCalledWith("/t/share123"));
  const [path, body] = upload.mock.calls[0] as unknown as [string, Blob];
  expect(path).toMatch(/^[0-9a-f-]{36}\.png$/);
  expect(body).toBe(cutout);
  expect(addOrnamentAction).toHaveBeenCalledWith({
    shareToken: "share123",
    senderName: "김지현",
    message: "코드 리뷰 고마워요",
    imagePath: path,
    position: { x: 20, y: 24 },
  });
  expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("오너먼트를 달았어요"));
});

test("달기를 연달아 눌러도 오너먼트는 한 번만 달린다 (반복 동작)", async () => {
  render(<OrnamentComposer shareToken="share123" />);
  fillText();
  await pickPhoto();
  await screen.findByAltText("배경을 지운 사진");
  fireEvent.click(screen.getByRole("button", { name: "위치 정하기" }));
  fireEvent.click(screen.getByRole("button", { name: "여기에 달기" }));
  const hangButton = await screen.findByRole("button", { name: "달기" });

  // 같은 틱 안에서 두 번 눌러, 화면 상태가 갱신되기 전의 중복 호출을 재현한다.
  act(() => {
    hangButton.click();
    hangButton.click();
  });

  await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
  expect(upload).toHaveBeenCalledTimes(1);
  expect(addOrnamentAction).toHaveBeenCalledTimes(1);
});
