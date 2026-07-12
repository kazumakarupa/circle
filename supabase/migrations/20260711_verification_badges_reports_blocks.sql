-- ========== 本人確認バッジ基盤 ==========
alter table public.profiles add column phone_verified boolean not null default false;

-- auth.users の電話確認状態を profiles に同期
create or replace function public.sync_phone_verified()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set phone_verified = (new.phone_confirmed_at is not null), updated_at = now()
  where id = new.id
    and phone_verified is distinct from (new.phone_confirmed_at is not null);
  return new;
end $$;
create trigger trg_sync_phone_verified after update on auth.users
  for each row execute function public.sync_phone_verified();
revoke execute on function public.sync_phone_verified() from anon, authenticated, public;

-- ========== ブロック ==========
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "blocks_own" on public.blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- どちらかがブロックしていれば true(RLSを越えて判定するため definer)
create or replace function public.is_blocked_pair(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = _a and blocked_id = _b) or (blocker_id = _b and blocked_id = _a)
  )
$$;
revoke execute on function public.is_blocked_pair(uuid, uuid) from anon, public;
grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;

create or replace function public.is_conversation_blocked(_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select public.is_blocked_pair(c.guest_id, c.host_id)
    from public.conversations c where c.id = _conversation_id
  ), false)
$$;
revoke execute on function public.is_conversation_blocked(uuid) from anon, public;
grant execute on function public.is_conversation_blocked(uuid) to authenticated;

-- ブロック中の相手とは 新規会話・メッセージ・交換リクエスト を作れない
drop policy "conv_insert_guest" on public.conversations;
create policy "conv_insert_guest" on public.conversations for insert
  with check (
    auth.uid() = guest_id and guest_id <> host_id
    and not public.is_blocked_pair(guest_id, host_id)
  );

drop policy "msg_insert_participants" on public.messages;
create policy "msg_insert_participants" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.guest_id, c.host_id))
    and not public.is_conversation_blocked(conversation_id)
  );

drop policy "ex_insert_guest" on public.exchanges;
create policy "ex_insert_guest" on public.exchanges for insert
  with check (
    auth.uid() = guest_id
    and not public.is_blocked_pair(guest_id, host_id)
  );

-- ========== 通報 ==========
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  category text not null check (category in ('inappropriate_listing','scam','harassment','other')),
  body text not null default '' check (char_length(body) <= 2000),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "reports_insert_own" on public.reports for insert
  with check (reporter_id = auth.uid());
create policy "reports_select_own" on public.reports for select
  using (reporter_id = auth.uid());
