import { useId } from "react";

import type { Position } from "@/features/tree/rules";
import { cn } from "@/lib/utils";

export type SceneOrnament = {
  id: string;
  imageUrl: string;
  /** 눌러서 고를 수 있는 화면에서 쓰는 접근성 이름 */
  label?: string;
} & Position;

export type SceneWeather = "clear" | "cloudy" | "rain" | "snow";
export type SceneTime = "day" | "night";
/** 트리 주인 지역의 지금 날씨와 낮밤 */
export type SceneAmbience = { weather: SceneWeather; time: SceneTime };

const CLEAR_DAY: SceneAmbience = { weather: "clear", time: "day" };

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

/** 날씨·낮밤별 장면의 빛 색(채도 낮은 하늘, 주광, 안개, 땅). prototype.html의 값. */
const PALETTE: Record<`${SceneTime}.${SceneWeather}`, Record<string, string>> = {
  "day.clear": { sky1: "#8BA3B9", sky2: "#C6CCCD", sky3: "#E6D5BC", light: "#FFE4BC", haze: "#F1E3CF", ground: "#D6D1C7" },
  "day.cloudy": { sky1: "#7C8791", sky2: "#A7AEB3", sky3: "#C2C5C5", light: "#E5E8EA", haze: "#C8CCCF", ground: "#B4B8B8" },
  "day.rain": { sky1: "#4C5860", sky2: "#6B777D", sky3: "#879093", light: "#C6D1D6", haze: "#97A2A7", ground: "#586367", rain: "rgb(225 233 238 / .38)" },
  "day.snow": { sky1: "#9BA3B3", sky2: "#C9CDD6", sky3: "#E4E4E9", light: "#F6F2F0", haze: "#E7E8ED", ground: "#ECEDF2", flake: "#FFFFFF" },
  "night.clear": { sky1: "#04060D", sky2: "#0F1830", sky3: "#202D4B", light: "#A9BCFF", haze: "#26365A", ground: "#0A101F" },
  "night.cloudy": { sky1: "#08090D", sky2: "#15191F", sky3: "#252A32", light: "#8B94A4", haze: "#2A2F38", ground: "#0C0E12" },
  "night.rain": { sky1: "#05080B", sky2: "#0F161B", sky3: "#1C252B", light: "#80969F", haze: "#213039", ground: "#091014", rain: "rgb(175 198 215 / .3)" },
  "night.snow": { sky1: "#0B101E", sky2: "#1D263D", sky3: "#384361", light: "#CAD5F6", haze: "#495577", ground: "#8A95B3", flake: "#FFFFFF" },
};

const BULBS = [
  [122, 72], [174, 84], [150, 126], [100, 150], [202, 142], [86, 206],
  [214, 214], [150, 190], [72, 282], [228, 290], [122, 262], [180, 270],
];

/** 서버와 브라우저가 같은 값을 내는 고정 난수(입자 배치용) */
function rnd(i: number, m: number) {
  const x = Math.sin(i * 12.9898 + 1.7) * 43758.5453;
  return +((x - Math.floor(x)) * m).toFixed(1);
}
function range<T>(n: number, f: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => f(i));
}

const STARS = range(40, (i) => ({
  cx: rnd(i + 11, 300), cy: rnd(i + 29, 190), r: i % 7 ? 0.45 : 0.9,
  opacity: 0.35 + (i % 4) * 0.15, breathe: i % 5 === 0,
}));
const DROPS = range(46, (i) => ({
  x: rnd(i, 320), y: rnd(i + 7, 380), len: 18 + (i % 3) * 8,
  w: i % 4 ? 0.6 : 1.1, delay: (i % 9) / 10,
}));
const FAR_FLAKES = range(50, (i) => ({
  cx: rnd(i, 300), cy: rnd(i + 3, 380), r: 0.6 + (i % 3) * 0.5,
  delay: (i % 11) * 0.7, duration: 8 + (i % 5),
}));
const NEAR_FLAKES = range(9, (i) => ({
  cx: rnd(i + 40, 300), cy: rnd(i + 60, 380), r: 3 + (i % 3) * 1.4,
  delay: i * 0.9, duration: 5 + (i % 3),
}));

const layer = "pointer-events-none absolute inset-0 size-full";

/**
 * 트리 표면. 일반 UI가 아니라 이 서비스의 핵심 화면이라 직접 그린다.
 * 배경은 "안개와 역광" 연출이고, 날씨와 낮밤에 따라 빛과 입자가 바뀐다.
 * 오너먼트 위치는 표면 크기에 대한 비율(%)이라 화면 크기와 무관하다.
 */
export function TreeScene({
  ornaments,
  ambience = CLEAR_DAY,
  onSelect,
  dimmed,
  children,
  ref,
  className,
}: {
  ornaments: SceneOrnament[];
  ambience?: SceneAmbience;
  onSelect?: (id: string) => void;
  /** 위치 정하기에서 이미 달린 오너먼트를 흐리게 둔다. */
  dimmed?: boolean;
  /** 표면 위에 얹는 요소(끌어서 놓을 내 오너먼트 등) */
  children?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  // 한 페이지에 장면이 여러 개여도 SVG filter id가 겹치지 않게 한다.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const { weather, time } = ambience;
  const night = time === "night";
  const palette = Object.fromEntries(
    Object.entries(PALETTE[`${time}.${weather}`]).map(([k, v]) => [`--${k}`, v]),
  );

  return (
    <div
      ref={ref}
      data-testid="tree-scene"
      data-weather={weather}
      data-time={time}
      className={cn(
        "tree-scene relative aspect-[300/380] w-full touch-manipulation overflow-hidden border select-none",
        className,
      )}
      style={palette}
    >
      {/* 하늘 빛, 해·달·별, 구름, 안개, 땅 */}
      <svg viewBox="0 0 300 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={layer}>
        <defs>
          <filter id={id("blur")} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id={id("bok")} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <radialGradient id={id("key")}>
            <stop offset="0" stopColor="var(--light)" stopOpacity=".95" />
            <stop offset=".35" stopColor="var(--light)" stopOpacity=".35" />
            <stop offset="1" stopColor="var(--light)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("warm")}>
            <stop offset="0" stopColor="#FFB25C" stopOpacity=".45" />
            <stop offset=".5" stopColor="#FF9A4A" stopOpacity=".12" />
            <stop offset="1" stopColor="#FF9A4A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id("ground")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--ground)" stopOpacity="0" />
            <stop offset=".45" stopColor="var(--ground)" stopOpacity=".85" />
            <stop offset="1" stopColor="var(--ground)" />
          </linearGradient>
        </defs>
        {!night && weather === "clear" ? (
          <g data-part="sun">
            <circle cx="238" cy="70" r="120" fill={url("key")} />
            <circle cx="238" cy="70" r="9" fill="#FFF8EA" filter={url("bok")} />
          </g>
        ) : null}
        {night && (weather === "clear" || weather === "snow") ? (
          <g data-part="moon">
            <circle cx="236" cy="62" r="70" fill={url("key")} opacity=".55" />
            <circle cx="236" cy="62" r="8" fill="#F4F1E6" />
          </g>
        ) : null}
        {night && weather === "clear" ? (
          <g data-part="stars">
            {STARS.map((s, i) => (
              <circle
                key={i}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill="#fff"
                opacity={s.opacity}
                className={s.breathe ? "scene-breathe" : undefined}
              />
            ))}
          </g>
        ) : null}
        {weather === "cloudy" || weather === "rain" ? (
          <g data-part="clouds">
            <g className="scene-drift" filter={url("blur")} fill="var(--haze)">
              <ellipse cx="60" cy="40" rx="110" ry="34" />
              <ellipse cx="250" cy="70" rx="120" ry="30" opacity=".8" />
              <ellipse cx="150" cy="10" rx="160" ry="26" />
            </g>
          </g>
        ) : null}
        {/* 트리 뒤로 번지는 빛 */}
        {!night ? <circle cx="150" cy="150" r="150" fill={url("key")} opacity=".35" /> : null}
        <g filter={url("blur")} fill="var(--haze)">
          <ellipse className="scene-drift" cx="80" cy="250" rx="140" ry="22" opacity=".55" />
          <ellipse cx="240" cy="285" rx="130" ry="20" opacity=".5" />
        </g>
        <rect y="270" width="300" height="110" fill={url("ground")} />
        <g filter={url("blur")}>
          <ellipse cx="150" cy="345" rx="190" ry="26" fill="var(--haze)" opacity=".7" />
        </g>
        {night ? (
          <circle data-part="warm-glow" cx="150" cy="230" r="170" fill={url("warm")} />
        ) : null}
      </svg>

      {/* 트리(모양은 그대로, 장면의 빛에 맞춘 색 보정만), 전구, 꼭대기 별 */}
      <svg viewBox="0 0 300 380" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className={layer}>
        <g className="scene-tree">
          <ellipse cx="150" cy="350" rx="105" ry="8" fill="rgb(0 0 0 / .18)" />
          <rect x="134" y="300" width="32" height="50" fill="var(--trunk)" />
          <polygon points="150,150 268,312 32,312" fill="var(--tree-dark)" />
          <polygon points="150,98 245,236 55,236" fill="var(--tree)" />
          <polygon points="150,48 218,160 82,160" fill="var(--tree-dark)" />
          <polygon points="150,30 192,96 108,96" fill="var(--tree)" />
        </g>
        <g data-part="bulbs">
          {BULBS.map(([x, y], i) => (
            <circle
              key={i}
              className="scene-bulb"
              cx={x}
              cy={y}
              r="2.6"
              style={{ animationDelay: `${i % 3}s` }}
            />
          ))}
        </g>
        <polygon
          className="scene-star"
          points="150,8 156,24 173,24 159,34 164,50 150,40 136,50 141,34 127,24 144,24"
          fill="var(--star)"
        />
      </svg>

      {ornaments.map((o) => {
        const style = { left: `${o.x}%`, top: `${o.y}%` };
        const frame = cn(ornamentFrameClass, "scene-ornament", dimmed && "opacity-55");
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

      {/* 비와 눈. 가까운 입자는 크고 흐리다. */}
      {weather === "rain" || weather === "snow" ? (
        <svg viewBox="0 0 300 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={layer}>
          <defs>
            <filter id={id("near")} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
          </defs>
          {weather === "rain" ? (
            <g data-part="rain" stroke="var(--rain)" strokeLinecap="round">
              {DROPS.map((d, i) => (
                <line
                  key={i}
                  className="scene-rain"
                  x1={d.x}
                  y1={d.y}
                  x2={d.x - 5}
                  y2={d.y + d.len}
                  strokeWidth={d.w}
                  style={{ animationDelay: `-${d.delay}s` }}
                />
              ))}
            </g>
          ) : (
            <g data-part="snow" fill="var(--flake)">
              {FAR_FLAKES.map((f, i) => (
                <circle
                  key={i}
                  className="scene-snow"
                  cx={f.cx}
                  cy={f.cy}
                  r={f.r}
                  opacity=".8"
                  style={{ animationDelay: `-${f.delay}s`, animationDuration: `${f.duration}s` }}
                />
              ))}
              <g filter={url("near")}>
                {NEAR_FLAKES.map((f, i) => (
                  <circle
                    key={i}
                    className="scene-snow"
                    cx={f.cx}
                    cy={f.cy}
                    r={f.r}
                    opacity=".7"
                    style={{ animationDelay: `-${f.delay}s`, animationDuration: `${f.duration}s` }}
                  />
                ))}
              </g>
            </g>
          )}
        </svg>
      ) : null}

      {/* 필름 질감과 비네팅(맨 위) */}
      <svg viewBox="0 0 300 380" preserveAspectRatio="none" aria-hidden="true" className={cn(layer, "scene-grain")}>
        <filter id={id("grain")}>
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.2 -.2" />
        </filter>
        <rect width="300" height="380" filter={url("grain")} />
      </svg>
      <div aria-hidden="true" className="scene-vignette pointer-events-none absolute inset-0" />
      {children}
    </div>
  );
}
