-- 감사 트리 핵심 흐름: 트리와 오너먼트 저장.
-- 기존 프로젝트와 함께 쓰므로 모든 객체 이름에 ty_ 접두어를 붙이고,
-- 기존 객체는 읽지도 바꾸지도 않는다. (docs/decisions/data-storage.md)

create table public.ty_trees (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null check (char_length(owner_name) between 1 and 20),
  share_token text not null unique,
  owner_token text not null unique,
  created_at timestamptz not null default now()
);

create table public.ty_ornaments (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.ty_trees (id) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 20),
  message text not null check (char_length(message) between 1 and 60),
  image_path text not null check (image_path ~ '^[0-9a-f-]{36}\.png$'),
  pos_x real not null check (pos_x between 0 and 100),
  pos_y real not null check (pos_y between 0 and 100),
  created_at timestamptz not null default now()
);

create index ty_ornaments_tree_id_idx on public.ty_ornaments (tree_id);

-- 테이블은 직접 읽고 쓸 수 없다. 아래 함수만 통로이고, 함수가 링크 종류를 가려
-- 공유 링크 쪽에는 보낸 사람 이름과 메시지가 나가지 않게 한다. (owner-access)
alter table public.ty_trees enable row level security;
alter table public.ty_ornaments enable row level security;
revoke all on table public.ty_trees from anon, authenticated;
revoke all on table public.ty_ornaments from anon, authenticated;

create function public.ty_create_tree(p_owner_name text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(p_owner_name);
  v_share text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  v_owner text := replace(gen_random_uuid()::text, '-', '');
begin
  if v_name is null or char_length(v_name) not between 1 and 20 then
    raise exception 'invalid owner name';
  end if;
  insert into public.ty_trees (owner_name, share_token, owner_token)
  values (v_name, v_share, v_owner);
  return json_build_object('share_token', v_share, 'owner_token', v_owner);
end;
$$;

-- 공유 링크용: 이름과 메시지는 포함하지 않는다.
create function public.ty_get_visitor_tree(p_share_token text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'owner_name', t.owner_name,
    'ornaments', coalesce((
      select json_agg(
        json_build_object('id', o.id, 'image_path', o.image_path, 'x', o.pos_x, 'y', o.pos_y)
        order by o.created_at
      )
      from public.ty_ornaments o
      where o.tree_id = t.id
    ), '[]'::json)
  )
  from public.ty_trees t
  where t.share_token = p_share_token;
$$;

-- 주인 링크용: 메시지와 보낸 사람 이름까지 포함한다.
create function public.ty_get_owner_tree(p_owner_token text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'owner_name', t.owner_name,
    'share_token', t.share_token,
    'ornaments', coalesce((
      select json_agg(
        json_build_object(
          'id', o.id, 'image_path', o.image_path, 'x', o.pos_x, 'y', o.pos_y,
          'sender_name', o.sender_name, 'message', o.message, 'created_at', o.created_at
        )
        order by o.created_at
      )
      from public.ty_ornaments o
      where o.tree_id = t.id
    ), '[]'::json)
  )
  from public.ty_trees t
  where t.owner_token = p_owner_token;
$$;

create function public.ty_add_ornament(
  p_share_token text,
  p_sender_name text,
  p_message text,
  p_image_path text,
  p_x real,
  p_y real
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tree_id uuid;
begin
  select id into v_tree_id from public.ty_trees where share_token = p_share_token;
  if v_tree_id is null then
    raise exception 'tree not found';
  end if;
  insert into public.ty_ornaments (tree_id, sender_name, message, image_path, pos_x, pos_y)
  values (v_tree_id, btrim(p_sender_name), btrim(p_message), p_image_path, p_x, p_y);
end;
$$;

revoke execute on function
  public.ty_create_tree(text),
  public.ty_get_visitor_tree(text),
  public.ty_get_owner_tree(text),
  public.ty_add_ornament(text, text, text, text, real, real)
from public;
grant execute on function
  public.ty_create_tree(text),
  public.ty_get_visitor_tree(text),
  public.ty_get_owner_tree(text),
  public.ty_add_ornament(text, text, text, text, real, real)
to anon;

-- 배경을 지운 사진만 저장한다. 공개 읽기, 익명 업로드(이 버킷만, PNG, 2MB까지).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ty-ornaments', 'ty-ornaments', true, 2097152, array['image/png'])
on conflict (id) do nothing;

create policy "ty_ornaments_anon_upload"
on storage.objects for insert to anon
with check (bucket_id = 'ty-ornaments');
