import { notFound } from "next/navigation";

import { NightPage } from "@/components/page-layout";
import { OrnamentComposer } from "@/features/tree/ornament-composer";
import { getVisitorTree } from "@/features/tree/tree-api";
import { getAmbience } from "@/features/weather/ambience";

export default async function NewOrnamentPage({
  params,
}: PageProps<"/t/[shareToken]/new">) {
  const { shareToken } = await params;
  const tree = await getVisitorTree(shareToken);
  if (!tree) notFound();
  const ambience = await getAmbience(tree.region);

  return (
    <>
      <NightPage night={ambience.time === "night"} />
      <OrnamentComposer
        shareToken={shareToken}
        ornaments={tree.ornaments}
        ambience={ambience}
      />
    </>
  );
}
