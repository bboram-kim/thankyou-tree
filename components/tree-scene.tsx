import type { Position } from "@/features/tree/rules";
import { cn } from "@/lib/utils";

export type SceneOrnament = {
  id: string;
  imageUrl: string;
  /** 눌러서 고를 수 있는 화면에서 쓰는 접근성 이름 */
  label?: string;
} & Position;

/** 오너먼트 한 개의 크기와 기준점(끈 윗부분). 트리 폭의 15%. */
export const ornamentFrameClass =
  "absolute flex w-[15%] -translate-x-1/2 -translate-y-[12%] flex-col items-center before:h-2.5 before:w-px before:bg-star/70 before:content-['']";

export function OrnamentImage({ imageUrl }: { imageUrl: string }) {
  return (
    // 배경을 제거한 PNG라 next/image 최적화가 필요 없다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt=""
      draggable={false}
      className="pointer-events-none aspect-square w-full object-contain object-top drop-shadow-md"
    />
  );
}

const TREE_SVG = (
  <svg
    viewBox="0 0 300 380"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    className="absolute inset-0 size-full"
  >
    <ellipse cx="150" cy="352" rx="110" ry="10" fill="rgb(0 0 0 / .08)" />
    <rect x="134" y="300" width="32" height="50" fill="var(--trunk)" />
    <polygon points="150,150 268,312 32,312" fill="var(--tree-dark)" />
    <polygon points="150,98 245,236 55,236" fill="var(--tree)" />
    <polygon points="150,48 218,160 82,160" fill="var(--tree-dark)" />
    <polygon points="150,30 192,96 108,96" fill="var(--tree)" />
    <polygon
      points="150,8 156,24 173,24 159,34 164,50 150,40 136,50 141,34 127,24 144,24"
      fill="var(--star)"
    />
  </svg>
);

/**
 * 트리 표면. 일반 UI가 아니라 이 서비스의 핵심 화면이라 직접 그린다.
 * 오너먼트 위치는 표면 크기에 대한 비율(%)이라 화면 크기와 무관하다.
 */
export function TreeScene({
  ornaments,
  onSelect,
  dimmed,
  children,
  ref,
  className,
}: {
  ornaments: SceneOrnament[];
  onSelect?: (id: string) => void;
  /** 위치 정하기에서 이미 달린 오너먼트를 흐리게 둔다. */
  dimmed?: boolean;
  /** 표면 위에 얹는 요소(끌어서 놓을 내 오너먼트 등) */
  children?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <div
      ref={ref}
      data-testid="tree-scene"
      className={cn(
        "relative aspect-[300/380] w-full touch-manipulation overflow-hidden border select-none",
        className,
      )}
      style={{
        background: "linear-gradient(var(--scene-top), var(--scene-bottom))",
      }}
    >
      {TREE_SVG}
      {ornaments.map((o) => {
        const style = { left: `${o.x}%`, top: `${o.y}%` };
        const frame = cn(ornamentFrameClass, dimmed && "opacity-55");
        return onSelect ? (
          <button
            key={o.id}
            type="button"
            aria-label={o.label}
            className={cn(
              frame,
              "cursor-pointer focus-visible:outline-2 focus-visible:outline-ring",
            )}
            style={style}
            onClick={() => onSelect(o.id)}
          >
            <OrnamentImage imageUrl={o.imageUrl} />
          </button>
        ) : (
          <div
            key={o.id}
            role="img"
            aria-label="오너먼트"
            className={frame}
            style={style}
          >
            <OrnamentImage imageUrl={o.imageUrl} />
          </div>
        );
      })}
      {children}
    </div>
  );
}
