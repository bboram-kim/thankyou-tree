import { notFound } from "next/navigation";

import { OwnerTree } from "@/features/tree/owner-tree";
import { getOwnerTree } from "@/features/tree/tree-api";

export default async function OwnerTreePage({
  params,
}: PageProps<"/o/[ownerToken]">) {
  const { ownerToken } = await params;
  const tree = await getOwnerTree(ownerToken);
  if (!tree) notFound();

  return (
    <OwnerTree
      ownerName={tree.ownerName}
      shareToken={tree.shareToken}
      ornaments={tree.ornaments}
    />
  );
}
