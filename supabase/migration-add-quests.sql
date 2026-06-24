-- ============================================================
-- migration-add-quests.sql
-- Новая архитектура: rooms = организации, quests = конкретные квесты
-- Supabase Dashboard → SQL Editor → Run
-- Идемпотентна: безопасно запускать повторно
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. Таблица quests
-- ──────────────────────────────────────────────────────────────
create table if not exists public.quests (
  id               uuid    default gen_random_uuid() primary key,
  room_id          uuid    references public.rooms(id) on delete cascade not null,
  name             text    not null,
  description      text    not null default '',
  genre            text    check (genre in ('хоррор','детектив','приключение','детский','VR','перформанс')),
  difficulty       text    check (difficulty in ('новичок','средний','опытный')),
  age_limit        text    check (age_limit in ('6+','12+','16+','18+')),
  min_players      int     default 2,
  max_players      int     default 6,
  duration_minutes int     default 60,
  has_actor        boolean default false,
  is_scary         text    check (is_scary in ('нет','немного','хоррор')) default 'нет',
  price_per_team   numeric(10,2) not null default 0,
  photos           text[]  default '{}',
  is_active        boolean default true,
  created_at       timestamptz default now() not null
);

alter table public.quests enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quests' and policyname = 'public read'
  ) then
    create policy "public read" on public.quests for select using (true);
  end if;
end $$;


-- ──────────────────────────────────────────────────────────────
-- 2. Перенести данные: каждая комната → один квест
--    (genre is not null = уже квест-рум, не детская комната)
-- ──────────────────────────────────────────────────────────────
insert into public.quests
  (room_id, name, description, genre, difficulty, age_limit,
   min_players, max_players, duration_minutes,
   has_actor, is_scary, price_per_team, photos)
select
  id, name, description, genre, difficulty, age_limit,
  min_players, max_players, duration_minutes,
  has_actor, is_scary,
  coalesce(price_per_team, price_per_hour, 0),
  photos
from public.rooms
where genre is not null
  -- не дублировать если уже перенесено
  and id not in (select room_id from public.quests);


-- ──────────────────────────────────────────────────────────────
-- 3. Добавить quest_id в bookings
-- ──────────────────────────────────────────────────────────────
alter table public.bookings
  add column if not exists quest_id uuid references public.quests(id) on delete cascade;


-- ──────────────────────────────────────────────────────────────
-- 4. Привязать существующие брони к квестам
-- ──────────────────────────────────────────────────────────────
update public.bookings b
set quest_id = q.id
from public.quests q
where q.room_id = b.room_id
  and b.quest_id is null;


-- ──────────────────────────────────────────────────────────────
-- 5. Уникальность слотов: per-room → per-quest
-- ──────────────────────────────────────────────────────────────
alter table public.bookings
  drop constraint if exists bookings_room_id_date_time_slot_key;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_quest_id_date_time_slot_key'
  ) then
    alter table public.bookings
      add constraint bookings_quest_id_date_time_slot_key
      unique (quest_id, date, time_slot);
  end if;
end $$;


-- ──────────────────────────────────────────────────────────────
-- 6. Проверка результата
-- ──────────────────────────────────────────────────────────────
select
  r.name                                            as organization,
  q.name                                            as quest,
  q.genre,
  q.difficulty,
  q.age_limit,
  q.min_players || '–' || q.max_players || ' чел'  as players,
  q.duration_minutes || ' мин'                      as duration,
  q.price_per_team::int || ' ₽'                     as price,
  q.has_actor,
  q.is_scary
from public.quests q
join public.rooms  r on r.id = q.room_id
order by r.name, q.name;
