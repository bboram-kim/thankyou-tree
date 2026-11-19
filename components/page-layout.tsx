import { cn } from "@/lib/utils";

export function PageHead({
  title,
  description,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1 pt-2">
      <h1 className="font-heading text-xl font-bold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}

/**
 * 트리 지역이 밤이면 렌더한다. 이 표시가 있는 동안 문서 전체(Drawer 같은 overlay 포함)가
 * 프로젝트의 다크 토큰으로 바뀐다(app/globals.css의 [data-night-page]).
 */
export function NightPage({ night }: { night: boolean }) {
  return night ? <div hidden data-night-page="" /> : null;
}

/** 화면 아래에 붙어 있는 주요 action 줄 */
export function StickyActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-auto flex gap-2 bg-gradient-to-t from-background from-70% to-transparent pt-3 pb-1",
        className,
      )}
      {...props}
    />
  );
}
