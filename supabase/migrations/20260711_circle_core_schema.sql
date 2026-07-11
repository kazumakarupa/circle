-- circle: 日本発ホームエクスチェンジ MVP スキーマ
-- (Supabaseプロジェクト thizqgbjmbvjedidwtaa に適用済み)

-- ========== profiles ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  bio text default '',
  languages text[] default '{日本語}',
  prefecture text default '',
  city text default '',
  home_bonus_granted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ========== homes ==========
create table public.homes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  description text default '',
  neighborhood text default '',
  property_type text not null default 'house' check (property_type in ('house','apartment')),
  accommodation_type text not null default 'entire' check (accommodation_type in ('entire','private_room')),
  residence_type text not null default 'primary' check (residence_type in ('primary','secondary')),
  prefecture text not null default '',
  city text not null default '',
  max_guests int not null default 2 check (max_guests between 1 and 20),
  bedrooms int not null default 1 check (bedrooms between 0 and 20),
  beds int not null default 1 check (beds between 1 and 30),
  bathrooms int not null default 1 check (bathrooms between 1 and 10),
  size_m2 int,
  amenities text[] not null default '{}',
  children_welcome boolean not null default true,
  pets_welcome boolean not null default false,
  smoking_allowed boolean not null default false,
  rules_note text default '',
  photos text[] not null default '{}',
  gp_per_night int not null default 50,
  status text not null default 'draft' check (status in ('draft','online')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.homes enable row level security;
create policy "homes_select_online_or_own" on public.homes for select
  using (status = 'online' or owner_id = auth.uid());
create policy "homes_insert_own" on public.homes for insert with check (owner_id = auth.uid());
create policy "homes_update_own" on public.homes for update using (owner_id = auth.uid());
create policy "homes_delete_own" on public.homes for delete using (owner_id = auth.uid());

-- GP/泊 自動算出
create or replace function public.calc_gp_per_night(_beds int, _max_guests int, _amenities text[])
returns int language sql immutable set search_path = public as $$
  select 50
    + least(_beds * 15, 120)
    + least(_max_guests * 5, 50)
    + least((
        select count(*) from unnest(_amenities) a
        where a in ('プール','サウナ','庭','駐車場','露天風呂','ジャグジー','暖炉','ワークスペース')
      ) * 10, 40)::int
$$;

create or replace function public.homes_set_gp()
returns trigger language plpgsql set search_path = public as $$
begin
  new.gp_per_night := public.calc_gp_per_night(new.beds, new.max_guests, new.amenities);
  new.updated_at := now();
  return new;
end $$;
create trigger trg_homes_gp before insert or update on public.homes
  for each row execute function public.homes_set_gp();

-- ========== availabilities ==========
create table public.availabilities (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  exchange_type text not null default 'any' check (exchange_type in ('any','reciprocal','gp')),
  min_nights int not null default 1 check (min_nights between 1 and 30),
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);
alter table public.availabilities enable row level security;
create policy "avail_select" on public.availabilities for select using (true);
create policy "avail_modify_own" on public.availabilities for all
  using (exists (select 1 from public.homes h where h.id = home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = home_id and h.owner_id = auth.uid()));

-- ========== favorites ==========
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, home_id)
);
alter table public.favorites enable row level security;
create policy "fav_own" on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ========== conversations / messages ==========
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  guest_id uuid not null references public.profiles(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (home_id, guest_id)
);
alter table public.conversations enable row level security;
create policy "conv_select_participants" on public.conversations for select
  using (auth.uid() in (guest_id, host_id));
create policy "conv_insert_guest" on public.conversations for insert
  with check (auth.uid() = guest_id and guest_id <> host_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "msg_select_participants" on public.messages for select
  using (exists (select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.guest_id, c.host_id)));
create policy "msg_insert_participants" on public.messages for insert
  with check (sender_id = auth.uid() and exists (select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.guest_id, c.host_id)));

-- ========== exchanges ==========
create table public.exchanges (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  guests_count int not null default 1 check (guests_count between 1 and 20),
  exchange_type text not null default 'gp' check (exchange_type in ('reciprocal','gp')),
  gp_amount int not null default 0 check (gp_amount >= 0),
  status text not null default 'requested'
    check (status in ('requested','pre_approved','finalized','canceled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);
alter table public.exchanges enable row level security;
create policy "ex_select_participants" on public.exchanges for select
  using (auth.uid() in (guest_id, host_id));
create policy "ex_insert_guest" on public.exchanges for insert
  with check (auth.uid() = guest_id);

-- ========== gp_ledger ==========
create table public.gp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta int not null,
  reason text not null,
  exchange_id uuid references public.exchanges(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.gp_ledger enable row level security;
create policy "ledger_select_own" on public.gp_ledger for select using (user_id = auth.uid());

create or replace function public.gp_balance(_user uuid)
returns int language sql stable security definer set search_path = public as $$
  select case when _user = auth.uid()
    then coalesce((select sum(delta) from public.gp_ledger where user_id = _user), 0)::int
    else 0 end
$$;

-- ========== サインアップトリガー ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.gp_ledger (user_id, delta, reason)
  values (new.id, 100, '登録ボーナス');
  return new;
end $$;
create trigger trg_on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== 掲載公開ボーナス ==========
create or replace function public.handle_home_online()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'online' and old.status = 'draft' then
    if not (select home_bonus_granted from public.profiles where id = new.owner_id) then
      insert into public.gp_ledger (user_id, delta, reason)
      values (new.owner_id, 500, '自宅掲載ボーナス');
      update public.profiles set home_bonus_granted = true where id = new.owner_id;
    end if;
  end if;
  return new;
end $$;
create trigger trg_home_online after update on public.homes
  for each row execute function public.handle_home_online();

-- ========== 交換フローRPC ==========
create or replace function public.pre_approve_exchange(_exchange_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ex record;
begin
  select * into ex from public.exchanges where id = _exchange_id;
  if ex is null then raise exception '交換が見つかりません'; end if;
  if ex.host_id <> auth.uid() then raise exception 'ホストのみ事前承認できます'; end if;
  if ex.status <> 'requested' then raise exception 'リクエスト中の交換のみ事前承認できます'; end if;
  update public.exchanges set status = 'pre_approved', updated_at = now() where id = _exchange_id;
end $$;

create or replace function public.finalize_exchange(_exchange_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ex record; bal int;
begin
  select * into ex from public.exchanges where id = _exchange_id;
  if ex is null then raise exception '交換が見つかりません'; end if;
  if ex.guest_id <> auth.uid() then raise exception 'ゲストのみ最終確定できます'; end if;
  if ex.status <> 'pre_approved' then raise exception '事前承認済みの交換のみ確定できます'; end if;
  if ex.exchange_type = 'gp' and ex.gp_amount > 0 then
    bal := coalesce((select sum(delta) from public.gp_ledger where user_id = ex.guest_id), 0);
    if bal < ex.gp_amount then
      raise exception 'GuestPointsが不足しています(残高 % GP / 必要 % GP)', bal, ex.gp_amount;
    end if;
    insert into public.gp_ledger (user_id, delta, reason, exchange_id)
    values (ex.guest_id, -ex.gp_amount, '交換確定によるGP支払い', ex.id),
           (ex.host_id,  ex.gp_amount, '交換確定によるGP受け取り', ex.id);
  end if;
  update public.exchanges set status = 'finalized', updated_at = now() where id = _exchange_id;
end $$;

create or replace function public.cancel_exchange(_exchange_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ex record;
begin
  select * into ex from public.exchanges where id = _exchange_id;
  if ex is null then raise exception '交換が見つかりません'; end if;
  if auth.uid() not in (ex.guest_id, ex.host_id) then raise exception '当事者のみキャンセルできます'; end if;
  if ex.status in ('canceled','completed') then raise exception 'この交換はキャンセルできません'; end if;
  if ex.status = 'finalized' and ex.exchange_type = 'gp' and ex.gp_amount > 0 then
    insert into public.gp_ledger (user_id, delta, reason, exchange_id)
    values (ex.guest_id,  ex.gp_amount, '交換キャンセルによるGP返還', ex.id),
           (ex.host_id, -ex.gp_amount, '交換キャンセルによるGP返還', ex.id);
  end if;
  update public.exchanges set status = 'canceled', updated_at = now() where id = _exchange_id;
end $$;

-- APIからの実行権限
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.handle_home_online() from anon, authenticated, public;
revoke execute on function public.homes_set_gp() from anon, authenticated, public;
revoke execute on function public.pre_approve_exchange(uuid) from anon, public;
revoke execute on function public.finalize_exchange(uuid) from anon, public;
revoke execute on function public.cancel_exchange(uuid) from anon, public;
revoke execute on function public.gp_balance(uuid) from anon, public;

-- ========== ストレージ ==========
insert into storage.buckets (id, name, public) values ('home-photos','home-photos', true);
create policy "photos_auth_upload" on storage.objects for insert
  with check (bucket_id = 'home-photos' and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos_owner_delete" on storage.objects for delete
  using (bucket_id = 'home-photos' and (storage.foldername(name))[1] = auth.uid()::text);
