"use client";

import Link from "next/link";
import { useState } from "react";

import { PageHead, StickyActions } from "@/components/page-layout";
import { TreeScene } from "@/components/tree-scene";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RiAlertLine } from "@remixicon/react";

import { createTreeAction } from "./actions";
import { copyLink } from "./copy-link";
import { canCreateTree, OWNER_NAME_MAX } from "./rules";

type Created = { ownerName: string; shareToken: string; ownerToken: string };

export function CreateTreeForm() {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canCreateTree(name) || pending) return;
    setPending(true);
    setFailed(false);
    try {
      const ownerName = name.trim();
      const tokens = await createTreeAction(ownerName);
      setCreated({ ownerName, ...tokens });
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  if (created) return <Links {...created} />;

  return (
    <>
      <PageHead
        title="감사 트리를 만들어 보세요"
        description="링크를 받은 사람들이 자기 사진으로 오너먼트를 만들고, 감사 한 줄을 적어 달아 줘요. 메시지는 나만 볼 수 있어요."
      />
      <TreeScene ornaments={[]} />
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <Field>
          <FieldLabel htmlFor="owner-name">내 이름</FieldLabel>
          <Input
            id="owner-name"
            value={name}
            maxLength={OWNER_NAME_MAX}
            placeholder="예: 이도윤"
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
          <FieldDescription className="flex justify-between">
            <span>트리에 &ldquo;{name.trim() || "이름"}의 트리&rdquo;로 보여요</span>
            <span>{`${name.length}/${OWNER_NAME_MAX}`}</span>
          </FieldDescription>
        </Field>
        {failed ? (
          <Alert variant="destructive">
            <AlertTitle>트리를 만들지 못했어요</AlertTitle>
            <AlertDescription>잠시 뒤에 다시 시도해 주세요.</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!canCreateTree(name) || pending}
        >
          트리 만들기
        </Button>
      </form>
    </>
  );
}

function LinkCard({
  title,
  description,
  path,
  toastMessage,
}: {
  title: string;
  description: string;
  path: string;
  toastMessage: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate bg-muted px-2.5 py-2 font-mono text-xs">
          {`${window.location.origin}${path}`}
        </code>
        <Button
          type="button"
          variant="outline"
          onClick={() => copyLink(path, toastMessage)}
        >
          복사
        </Button>
      </CardContent>
    </Card>
  );
}

function Links({ ownerName, shareToken, ownerToken }: Created) {
  return (
    <>
      <PageHead
        title={`${ownerName}의 트리가 생겼어요`}
        description="링크가 두 개예요. 용도가 달라요."
      />
      <LinkCard
        title="공유 링크"
        description="카카오톡이나 인스타그램 프로필에 올려 주세요. 이 링크로는 트리를 보고 오너먼트를 달 수 있어요."
        path={`/t/${shareToken}`}
        toastMessage="공유 링크를 복사했어요"
      />
      <LinkCard
        title="내 링크"
        description="오너먼트를 눌러 메시지를 읽을 수 있는 나만의 링크예요."
        path={`/o/${ownerToken}`}
        toastMessage="내 링크를 복사했어요"
      />
      <Alert>
        <RiAlertLine />
        <AlertTitle>내 링크는 꼭 따로 저장해 두세요</AlertTitle>
        <AlertDescription>
          잃어버리면 메시지를 다시 볼 수 없어요. 다른 사람에게 보내면 그 사람도
          메시지를 읽을 수 있어요.
        </AlertDescription>
      </Alert>
      <StickyActions>
        <Link
          href={`/o/${ownerToken}`}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          내 트리 보러 가기
        </Link>
      </StickyActions>
    </>
  );
}
