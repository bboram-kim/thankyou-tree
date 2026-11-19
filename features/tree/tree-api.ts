import { createSupabase, ornamentImageUrl } from "@/lib/supabase";

import type { Position } from "./rules";

/** 공유 링크 쪽에 나가는 오너먼트. 이름과 메시지는 타입에도 없다. */
export type VisitorOrnament = { id: string; imageUrl: string } & Position;
export type VisitorTree = { ownerName: string; ornaments: VisitorOrnament[] };

export type OwnerOrnament = VisitorOrnament & {
  senderName: string;
  message: string;
  postedOn: string;
};
export type OwnerTree = {
  ownerName: string;
  shareToken: string;
  ornaments: OwnerOrnament[];
};

type Row = { id: string; image_path: string; x: number; y: number };
type OwnerRow = Row & {
  sender_name: string;
  message: string;
  created_at: string;
};

const postedOnFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

export async function createTree(ownerName: string) {
  const { data, error } = await createSupabase().rpc("ty_create_tree", {
    p_owner_name: ownerName,
  });
  if (error) throw new Error(error.message);
  const row = data as { share_token: string; owner_token: string };
  return { shareToken: row.share_token, ownerToken: row.owner_token };
}

export async function getVisitorTree(
  shareToken: string,
): Promise<VisitorTree | null> {
  const { data, error } = await createSupabase().rpc("ty_get_visitor_tree", {
    p_share_token: shareToken,
  });
  if (error) throw new Error(error.message);
  if (!data) return null;
  const tree = data as { owner_name: string; ornaments: Row[] };
  return {
    ownerName: tree.owner_name,
    ornaments: tree.ornaments.map((o) => ({
      id: o.id,
      imageUrl: ornamentImageUrl(o.image_path),
      x: o.x,
      y: o.y,
    })),
  };
}

export async function getOwnerTree(
  ownerToken: string,
): Promise<OwnerTree | null> {
  const { data, error } = await createSupabase().rpc("ty_get_owner_tree", {
    p_owner_token: ownerToken,
  });
  if (error) throw new Error(error.message);
  if (!data) return null;
  const tree = data as {
    owner_name: string;
    share_token: string;
    ornaments: OwnerRow[];
  };
  return {
    ownerName: tree.owner_name,
    shareToken: tree.share_token,
    ornaments: tree.ornaments.map((o) => ({
      id: o.id,
      imageUrl: ornamentImageUrl(o.image_path),
      x: o.x,
      y: o.y,
      senderName: o.sender_name,
      message: o.message,
      postedOn: postedOnFormat.format(new Date(o.created_at)),
    })),
  };
}

export async function addOrnament(input: {
  shareToken: string;
  senderName: string;
  message: string;
  imagePath: string;
  position: Position;
}) {
  const { error } = await createSupabase().rpc("ty_add_ornament", {
    p_share_token: input.shareToken,
    p_sender_name: input.senderName,
    p_message: input.message,
    p_image_path: input.imagePath,
    p_x: input.position.x,
    p_y: input.position.y,
  });
  if (error) throw new Error(error.message);
}
