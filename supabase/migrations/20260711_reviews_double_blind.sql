-- ========== reviews(ダブルブラインドレビュー)==========
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchanges(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_role text not null check (reviewer_role in ('guest','host')),
  rating int not null check (rating between 1 and 5),
  cleanliness int check (cleanliness between 1 and 5),
  communication int check (communication between 1 and 5),
  accuracy int check (accuracy between 1 and 5),
  body text not null check (char_length(body) between 1 and 2000),
  reply text check (char_length(reply) <= 500),
  created_at timestamptz not null default now(),
  unique (exchange_id, reviewer_id)
);
create index idx_reviews_home on public.reviews(home_id);
create index idx_reviews_reviewee on public.reviews(reviewee_id);
alter table public.reviews enable row level security;

-- 公開判定: 双方が投稿済み、または交換終了から40日経過
-- (RLSポリシー内で自テーブルを参照すると再帰するため security definer 関数に切り出す)
create or replace function public.review_published(_exchange_id uuid, _reviewer_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
      select 1 from public.reviews r
      where r.exchange_id = _exchange_id and r.reviewer_id <> _reviewer_id
    )
    or exists (
      select 1 from public.exchanges e
      where e.id = _exchange_id and e.end_date + 40 <= current_date
    )
$$;

-- 自分が書いたレビューは常に見える。他人のレビューは公開後のみ(未ログインでも公開分は閲覧可)
create policy "reviews_select_published_or_own" on public.reviews for select
  using (reviewer_id = auth.uid() or public.review_published(exchange_id, reviewer_id));

-- 投稿・返信はRPC経由のみ(直接insert/updateのポリシーは作らない)

-- ========== レビュー投稿RPC ==========
create or replace function public.submit_review(
  _exchange_id uuid, _rating int, _cleanliness int, _communication int, _accuracy int, _body text
) returns void language plpgsql security definer set search_path = public as $$
declare ex record; _reviewee uuid; _role text;
begin
  select * into ex from public.exchanges where id = _exchange_id;
  if ex is null then raise exception '交換が見つかりません'; end if;
  if auth.uid() not in (ex.guest_id, ex.host_id) then raise exception '当事者のみレビューできます'; end if;
  if ex.status not in ('finalized','completed') then raise exception '確定済みの交換のみレビューできます'; end if;
  if ex.end_date > current_date then raise exception '滞在終了後にレビューできます'; end if;
  if exists (select 1 from public.reviews where exchange_id = _exchange_id and reviewer_id = auth.uid()) then
    raise exception 'この交換にはすでにレビューを投稿済みです';
  end if;
  if _rating not between 1 and 5 then raise exception '評価は1〜5で入力してください'; end if;

  if auth.uid() = ex.guest_id then
    _reviewee := ex.host_id; _role := 'guest';
  else
    _reviewee := ex.guest_id; _role := 'host';
  end if;

  insert into public.reviews (exchange_id, home_id, reviewer_id, reviewee_id, reviewer_role,
    rating, cleanliness, communication, accuracy, body)
  values (_exchange_id, ex.home_id, auth.uid(), _reviewee, _role,
    _rating, _cleanliness, _communication, _accuracy, _body);

  -- 滞在が終わった交換は「完了」へ
  if ex.status = 'finalized' then
    update public.exchanges set status = 'completed', updated_at = now() where id = _exchange_id;
  end if;
end $$;

-- ========== レビュー返信RPC(公開後・1回のみ)==========
create or replace function public.reply_review(_review_id uuid, _reply text)
returns void language plpgsql security definer set search_path = public as $$
declare rv record;
begin
  select * into rv from public.reviews where id = _review_id;
  if rv is null then raise exception 'レビューが見つかりません'; end if;
  if rv.reviewee_id <> auth.uid() then raise exception 'レビューを受けた本人のみ返信できます'; end if;
  if rv.reply is not null then raise exception '返信は1回のみです'; end if;
  if not public.review_published(rv.exchange_id, rv.reviewer_id) then
    raise exception '公開後のレビューにのみ返信できます';
  end if;
  if char_length(_reply) not between 1 and 500 then raise exception '返信は500文字以内で入力してください'; end if;
  update public.reviews set reply = _reply where id = _review_id;
end $$;

-- 滞在終了した確定済み交換を「完了」に自動遷移
create or replace function public.complete_finished_exchanges()
returns void language sql security definer set search_path = public as $$
  update public.exchanges set status = 'completed', updated_at = now()
  where status = 'finalized' and end_date <= current_date
$$;

-- 権限
revoke execute on function public.review_published(uuid, uuid) from anon, public;
grant execute on function public.review_published(uuid, uuid) to anon, authenticated;
revoke execute on function public.submit_review(uuid, int, int, int, int, text) from anon, public;
revoke execute on function public.reply_review(uuid, text) from anon, public;
revoke execute on function public.complete_finished_exchanges() from anon, authenticated, public;

-- 日次ジョブ(毎日 0:10 UTC)
create extension if not exists pg_cron;
select cron.schedule('complete-finished-exchanges', '10 0 * * *', 'select public.complete_finished_exchanges()');
