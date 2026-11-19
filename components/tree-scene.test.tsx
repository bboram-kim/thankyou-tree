import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { TreeScene } from "./tree-scene";

const ornaments = [
  { id: "a", imageUrl: "/a.png", x: 50, y: 22 },
  { id: "b", imageUrl: "/b.png", x: 26, y: 64 },
];

test("오너먼트 사진이 각자의 위치(%)에 보인다 (AC3)", () => {
  render(<TreeScene ornaments={ornaments} />);

  const placed = screen.getAllByRole("img", { name: "오너먼트" });
  expect(placed).toHaveLength(2);
  expect(placed[0]).toHaveStyle({ left: "50%", top: "22%" });
  expect(placed[1]).toHaveStyle({ left: "26%", top: "64%" });
});

test("선택 핸들러가 있으면 오너먼트를 눌러 고를 수 있다 (AC11)", () => {
  const onSelect = vi.fn();
  render(
    <TreeScene
      ornaments={[{ ...ornaments[0], label: "김지현님의 오너먼트" }]}
      onSelect={onSelect}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "김지현님의 오너먼트" }));

  expect(onSelect).toHaveBeenCalledWith("a");
});

const parts = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-part]")].map((el) => el.getAttribute("data-part"));

test.each([
  ["clear", "day", ["sun", "bulbs"]],
  ["clear", "night", ["moon", "stars", "warm-glow", "bulbs"]],
  ["cloudy", "day", ["clouds", "bulbs"]],
  ["cloudy", "night", ["clouds", "warm-glow", "bulbs"]],
  ["rain", "day", ["clouds", "bulbs", "rain"]],
  ["rain", "night", ["clouds", "warm-glow", "bulbs", "rain"]],
  ["snow", "day", ["bulbs", "snow"]],
  ["snow", "night", ["moon", "warm-glow", "bulbs", "snow"]],
] as const)("%s·%s 장면은 날씨와 낮밤에 맞는 요소를 그린다 (AC6, AC10)", (weather, time, expected) => {
  const { container } = render(<TreeScene ornaments={[]} ambience={{ weather, time }} />);
  const scene = screen.getByTestId("tree-scene");
  expect(scene).toHaveAttribute("data-weather", weather);
  expect(scene).toHaveAttribute("data-time", time);
  expect(parts(container)).toEqual(expected);
});

test("날씨·낮밤을 주지 않으면 맑은 낮으로 그린다 (AC12)", () => {
  render(<TreeScene ornaments={[]} />);
  expect(screen.getByTestId("tree-scene")).toHaveAttribute("data-time", "day");
  expect(screen.getByTestId("tree-scene")).toHaveAttribute("data-weather", "clear");
});
