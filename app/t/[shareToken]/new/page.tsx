import { notFound } from "next/navigation";

import { OrnamentComposer } from "@/features/tree/ornament-composer";
import { getVisitorTree } from "@/features/tree/tree-api";

export default async function NewOrnamentPage({
  params,
}: PageProps<"/t/[shareToken]/new">) {
  const { shareToken } = await params;
  const tree = await getVisitorTree(shareToken);
  if (!tree) notFound();

  return <OrnamentComposer shareToken={shareToken} ornaments={tree.ornaments} />;
}
