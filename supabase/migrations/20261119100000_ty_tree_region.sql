-- 트리 지역: 기상청 5km 격자 번호만 저장한다. 위경도 원값은 저장하지 않는다.
-- 이 기능 전에 만든 트리와 위치를 받지 못한 트리는 서울(60, 127)이다.
-- (docs/specs/tree-weather-daynight/spec.md, docs/decisions/data-storage.md)

alter table public.ty_trees
  add column grid_nx smallint not null default 60 check (grid_nx between 1 and 149),
  add column grid_ny smallint not null default 127 check (grid_ny between 1 and 253);

drop function public.ty_create_tree(text);

-- 기본값을 두어 배포 전 앱(이름만 보냄)도 계속 만들 수 있다.
create function public.ty_create_tree(
  p_owner_name text,
  p_grid_nx int default 60,
  p_grid_ny int default 127
)
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
  insert into public.ty_trees (owner_name, share_token, owner_token, grid_nx, grid_ny)
  values (v_name, v_share, v_owner, p_grid_nx, p_grid_ny);
  return json_build_object('share_token', v_share, 'owner_token', v_owner);
end;
$$;

-- 공유 링크용: 이름과 메시지는 포함하지 않는다. 지역은 격자 번호만.
create or replace function public.ty_get_visitor_tree(p_share_token text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'owner_name', t.owner_name,
    'grid_nx', t.grid_nx,
    'grid_ny', t.grid_ny,
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
create or replace function public.ty_get_owner_tree(p_owner_token text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'owner_name', t.owner_name,
    'share_token', t.share_token,
    'grid_nx', t.grid_nx,
    'grid_ny', t.grid_ny,
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

revoke execute on function public.ty_create_tree(text, int, int) from public;
grant execute on function public.ty_create_tree(text, int, int) to anon;
