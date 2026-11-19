import { notFound } from "next/navigation";

import { NightPage } from "@/components/page-layout";
import { OwnerTree } from "@/features/tree/owner-tree";
import { getOwnerTree } from "@/features/tree/tree-api";
import { getAmbience } from "@/features/weather/ambience";

export default async function OwnerTreePage({
  params,
}: PageProps<"/o/[ownerToken]">) {
  const { ownerToken } = await params;
  const tree = await getOwnerTree(ownerToken);
  if (!tree) notFound();
  const ambience = await getAmbience(tree.region);

  return (
    <>
      <NightPage night={ambience.time === "night"} />
      <OwnerTree
        ownerName={tree.ownerName}
        shareToken={tree.shareToken}
        ornaments={tree.ornaments}
        ambience={ambience}
      />
    </>
  );
}
