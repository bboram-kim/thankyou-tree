import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHead, StickyActions } from "@/components/page-layout";
import { TreeScene } from "@/components/tree-scene";
import { buttonVariants } from "@/components/ui/button";
import { getVisitorTree } from "@/features/tree/tree-api";

export default async function VisitorTreePage({
  params,
}: PageProps<"/t/[shareToken]">) {
  const { shareToken } = await params;
  const tree = await getVisitorTree(shareToken);
  if (!tree) notFound();

  return (
    <>
      <PageHead
        title={`${tree.ownerName}의 트리`}
        description={
          tree.ornaments.length === 0
            ? "아직 아무도 오너먼트를 달지 않았어요. 첫 번째로 달아 주세요."
            : `오너먼트 ${tree.ornaments.length}개가 달려 있어요`
        }
      />
      <TreeScene ornaments={tree.ornaments} />
      <StickyActions>
        <Link
          href={`/t/${shareToken}/new`}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          오너먼트 달기
        </Link>
      </StickyActions>
    </>
  );
}
