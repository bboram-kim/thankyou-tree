"use client";

import { RiErrorWarningLine, RiImageAddLine } from "@remixicon/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHead, StickyActions } from "@/components/page-layout";
import {
  OrnamentImage,
  ornamentFrameClass,
  TreeScene,
} from "@/components/tree-scene";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createSupabase, ORNAMENT_BUCKET } from "@/lib/supabase";

import { addOrnamentAction } from "./actions";
import {
  canChoosePlacement,
  MESSAGE_MAX,
  pointerToPosition,
  SENDER_NAME_MAX,
  type Position,
} from "./rules";
import { shrinkImage } from "./shrink-image";
import { trimTransparent } from "./trim-transparent";
import type { VisitorOrnament } from "./tree-api";

type Photo =
  | { status: "empty" }
  | { status: "busy" }
  | { status: "failed" }
  | { status: "done"; blob: Blob; previewUrl: string };

export function OrnamentComposer({
  shareToken,
  ornaments = [],
}: {
  shareToken: string;
  ornaments?: VisitorOrnament[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"make" | "place">("make");
  const [photo, setPhoto] = useState<Photo>({ status: "empty" });
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState<Position>({ x: 50, y: 48 });
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const latestPick = useRef(0);
  // 상태는 다음 렌더에야 바뀌므로, 같은 틱의 중복 클릭은 ref로 막는다.
  const hanging = useRef(false);

  // 미리보기 주소는 사진이 바뀌거나 화면을 떠날 때 해제한다.
  const previewUrl = photo.status === "done" ? photo.previewUrl : null;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function pick(file: File | undefined) {
    if (!file) return;
    const pickId = ++latestPick.current;
    setPhoto({ status: "busy" });
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await trimTransparent(
        await removeBackground(await shrinkImage(file), {
          model: "isnet_quint8",
          output: { format: "image/png" },
        }),
      );
      if (pickId !== latestPick.current) return;
      setPhoto({ status: "done", blob, previewUrl: URL.createObjectURL(blob) });
    } catch {
      if (pickId !== latestPick.current) return;
      setPhoto({ status: "failed" });
    }
  }

  async function hang() {
    if (photo.status !== "done" || hanging.current) return;
    hanging.current = true;
    setSubmitting(true);
    try {
      // 저장하는 것은 배경을 지운 사진뿐이다. 원본은 브라우저 밖으로 나가지 않는다.
      const imagePath = `${crypto.randomUUID()}.png`;
      const { error } = await createSupabase()
        .storage.from(ORNAMENT_BUCKET)
        .upload(imagePath, photo.blob, { contentType: "image/png" });
      if (error) throw error;
      await addOrnamentAction({
        shareToken,
        senderName,
        message,
        imagePath,
        position,
      });
      toast.success("오너먼트를 달았어요. 고마운 마음이 전해질 거예요.");
      router.push(`/t/${shareToken}`);
    } catch {
      setConfirming(false);
      toast.error("오너먼트를 달지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
      hanging.current = false;
      setSubmitting(false);
    }
  }

  const ready = canChoosePlacement({
    hasPhoto: photo.status === "done",
    senderName,
    message,
  });

  if (step === "place" && photo.status === "done") {
    return (
      <PlaceStep
        ornaments={ornaments}
        imageUrl={photo.previewUrl}
        position={position}
        onMove={setPosition}
        onBack={() => setStep("make")}
        confirming={confirming}
        onConfirmingChange={setConfirming}
        submitting={submitting}
        onHang={hang}
      />
    );
  }

  return (
    <>
      <PageHead
        title="오너먼트 만들기"
        description="사진을 고르면 배경을 지워서 오너먼트로 만들어 드려요."
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <PhotoArea photo={photo} onPick={() => fileInput.current?.click()} />
      {photo.status === "failed" ? (
        <Alert variant="destructive">
          <RiErrorWarningLine />
          <AlertTitle>배경을 지우지 못했어요</AlertTitle>
          <AlertDescription>
            사람이나 물건이 또렷하게 보이는 사진으로 다시 골라 주세요.
          </AlertDescription>
        </Alert>
      ) : null}
      <Field>
        <FieldLabel htmlFor="sender-name">내 이름</FieldLabel>
        <Input
          id="sender-name"
          value={senderName}
          maxLength={SENDER_NAME_MAX}
          placeholder="트리 주인이 알아볼 수 있게 적어 주세요"
          autoComplete="off"
          onChange={(e) => setSenderName(e.target.value)}
        />
        <FieldDescription className="flex justify-between">
          <span>트리 주인만 볼 수 있어요</span>
          <span>{`${senderName.length}/${SENDER_NAME_MAX}`}</span>
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="message">감사 한 줄</FieldLabel>
        <Input
          id="message"
          value={message}
          maxLength={MESSAGE_MAX}
          placeholder="고마웠던 일을 한 줄로 적어 주세요"
          autoComplete="off"
          onChange={(e) => setMessage(e.target.value)}
        />
        <FieldDescription className="flex justify-between">
          <span>트리 주인만 볼 수 있어요</span>
          <span>{`${message.length}/${MESSAGE_MAX}`}</span>
        </FieldDescription>
      </Field>
      <StickyActions>
        <Link
          href={`/t/${shareToken}`}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          취소
        </Link>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          disabled={!ready}
          onClick={() => setStep("place")}
        >
          위치 정하기
        </Button>
      </StickyActions>
    </>
  );
}

function PhotoArea({ photo, onPick }: { photo: Photo; onPick: () => void }) {
  const box =
    "mx-auto flex aspect-square w-full max-w-64 flex-col items-center justify-center gap-3 border text-sm text-muted-foreground";

  if (photo.status === "busy") {
    return (
      <div className={cn(box, "border-dashed")} role="status">
        <div className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
        <span>배경을 지우는 중이에요…</span>
      </div>
    );
  }
  if (photo.status === "done") {
    return (
      <>
        <div
          className={cn(
            box,
            // 투명한 부분이 보이도록 체크무늬 바탕을 깐다.
            "bg-[conic-gradient(var(--muted)_25%,var(--background)_0_50%,var(--muted)_0_75%,var(--background)_0)] bg-size-[20px_20px]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.previewUrl}
            alt="배경을 지운 사진"
            className="size-[86%] object-contain"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="self-center"
          onClick={onPick}
        >
          다른 사진 고르기
        </Button>
      </>
    );
  }
  return (
    <div className={cn(box, "border-dashed")}>
      <RiImageAddLine className="size-7" />
      <span>사진이나 셀카를 골라 주세요</span>
      <Button type="button" variant="outline" onClick={onPick}>
        사진 고르기
      </Button>
    </div>
  );
}

function PlaceStep({
  ornaments,
  imageUrl,
  position,
  onMove,
  onBack,
  confirming,
  onConfirmingChange,
  submitting,
  onHang,
}: {
  ornaments: VisitorOrnament[];
  imageUrl: string;
  position: Position;
  onMove: (position: Position) => void;
  onBack: () => void;
  confirming: boolean;
  onConfirmingChange: (open: boolean) => void;
  submitting: boolean;
  onHang: () => void;
}) {
  const scene = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function move(event: React.PointerEvent) {
    if (!scene.current) return;
    onMove(pointerToPosition(scene.current.getBoundingClientRect(), event));
  }

  return (
    <>
      <PageHead
        title="어디에 달까요?"
        description="오너먼트를 끌어서 달고 싶은 곳에 놓아 주세요."
      />
      <TreeScene ref={scene} ornaments={ornaments} dimmed>
        <button
          type="button"
          aria-label="내 오너먼트, 끌어서 위치를 정하세요"
          className={cn(
            ornamentFrameClass,
            // 끄는 동안 페이지가 함께 스크롤되지 않도록 터치 제스처를 막는다.
            "z-10 touch-none cursor-grab outline-2 outline-dashed outline-offset-4 outline-primary",
            dragging && "w-[19%] cursor-grabbing",
          )}
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            setDragging(true);
            move(e);
          }}
          onPointerMove={(e) => dragging && move(e)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <OrnamentImage imageUrl={imageUrl} />
        </button>
      </TreeScene>
      <StickyActions>
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          뒤로
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={() => onConfirmingChange(true)}
        >
          여기에 달기
        </Button>
      </StickyActions>

      <AlertDialog open={confirming} onOpenChange={onConfirmingChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>여기에 달까요?</AlertDialogTitle>
            <AlertDialogDescription>
              한 번 달면 위치를 옮기거나 지울 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>다시 정하기</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={onHang}>
              달기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
