"use client";

import { useState } from "react";

import { PageHead, StickyActions } from "@/components/page-layout";
import {
  OrnamentImage,
  TreeScene,
  type SceneAmbience,
} from "@/components/tree-scene";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { copyLink } from "./copy-link";
import type { OwnerOrnament } from "./tree-api";

export function OwnerTree({
  shareToken,
  ornaments,
  ambience,
}: {
  ownerName: string;
  shareToken: string;
  ornaments: OwnerOrnament[];
  ambience?: SceneAmbience;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = ornaments.find((o) => o.id === selectedId);

  return (
    <>
      <PageHead
        title="내 트리"
        description={
          ornaments.length === 0
            ? "아직 달린 오너먼트가 없어요. 공유 링크를 보내 보세요."
            : `오너먼트 ${ornaments.length}개 · 눌러서 감사 메시지를 읽어 보세요`
        }
      />
      <TreeScene
        ambience={ambience}
        ornaments={ornaments.map((o) => ({
          id: o.id,
          imageUrl: o.imageUrl,
          x: o.x,
          y: o.y,
          label: `${o.senderName}님의 오너먼트`,
        }))}
        onSelect={(id) => {
          setSelectedId(id);
          setOpen(true);
        }}
      />
      <StickyActions>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => copyLink(`/t/${shareToken}`, "공유 링크를 복사했어요")}
        >
          공유 링크 복사
        </Button>
      </StickyActions>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          {selected ? (
            <>
              <DrawerHeader className="flex-row items-center gap-3 text-left!">
                <div className="size-16 flex-none">
                  <OrnamentImage imageUrl={selected.imageUrl} />
                </div>
                <div>
                  <DrawerTitle>{selected.senderName}</DrawerTitle>
                  <DrawerDescription>{selected.postedOn}에 달았어요</DrawerDescription>
                </div>
              </DrawerHeader>
              <p className="mx-4 bg-muted p-3 text-base leading-relaxed">
                {selected.message}
              </p>
            </>
          ) : null}
          <DrawerFooter className="pt-4">
            <DrawerClose render={<Button variant="outline" size="lg" />}>
              닫기
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
