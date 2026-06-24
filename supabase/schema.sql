-- ============================================================
-- СХЕМА БАЗЫ ДАННЫХ — КвестРум
-- ДЛЯ НОВОЙ БД: выполните весь файл
-- ДЛЯ СУЩЕСТВУЮЩЕЙ БД: выполните только секцию "МИГРАЦИЯ" внизу
-- ============================================================

create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  phone text not null,
  name text not null default '',
  telegram_chat_id text,
  created_at timestamptz default now() not null
);
alter table public.users enable row level security;
create policy "select own" on public.users for select using (auth.uid() = id);
create policy "update own" on public.users for update using (auth.uid() = id);
create policy "insert own" on public.users for insert with check (auth.uid() = id);

create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null default '',
  address text not null,
  price_per_hour numeric(10,2) not null default 0,
  price_per_team numeric(10,2),                  -- основная цена (за команду)
  rating numeric(3,2) default 0,
  photos text[] default '{}',
  working_hours_start time default '10:00',
  working_hours_end time default '22:00',
  owner_telegram_chat_id text,
  latitude double precision,
  longitude double precision,
  -- Поля квест-рума
  genre text check (genre in ('хоррор','детектив','приключение','детский','VR','перформанс')),
  difficulty text check (difficulty in ('новичок','средний','опытный')),
  age_limit text check (age_limit in ('6+','12+','16+','18+')),
  min_players int default 2,
  max_players int default 6,
  duration_minutes int default 60,
  has_actor boolean default false,
  is_scary text check (is_scary in ('нет','немного','хоррор')) default 'нет',
  created_at timestamptz default now() not null
);
alter table public.rooms enable row level security;
create policy "public read" on public.rooms for select using (true);

create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  rating int check (rating between 1 and 5) not null,
  comment text default '',
  created_at timestamptz default now() not null,
  unique (room_id, user_id)
);
alter table public.reviews enable row level security;
create policy "public read" on public.reviews for select using (true);
create policy "auth insert" on public.reviews for insert with check (auth.uid() = user_id);
create policy "own update" on public.reviews for update using (auth.uid() = user_id);

create table public.quests (
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
create policy "public read" on public.quests for select using (true);

create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  room_id  uuid references public.rooms(id)  on delete cascade not null,
  quest_id uuid references public.quests(id) on delete cascade,
  date date not null,
  time_slot time not null,
  players_count int check (players_count between 1 and 20) default 2 not null,
  status text check (status in ('pending','confirmed','cancelled','completed')) default 'confirmed' not null,
  created_at timestamptz default now() not null,
  unique (quest_id, date, time_slot)
);
alter table public.bookings enable row level security;
create policy "own select" on public.bookings for select using (auth.uid() = user_id);
create policy "own insert" on public.bookings for insert with check (auth.uid() = user_id);
create policy "own update" on public.bookings for update using (auth.uid() = user_id);

-- Автосоздание профиля при регистрации
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, phone, name)
  values (new.id, coalesce(new.phone, ''), '')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Автообновление рейтинга комнаты
create or replace function public.update_room_rating()
returns trigger as $$
declare rid uuid;
begin
  rid := coalesce(new.room_id, old.room_id);
  update public.rooms set rating = (
    select coalesce(avg(rating), 0)::numeric(3,2) from public.reviews where room_id = rid
  ) where id = rid;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger rating_trigger
  after insert or update or delete on public.reviews
  for each row execute function public.update_room_rating();


-- ============================================================
-- МИГРАЦИЯ (только если таблицы уже существуют)
-- Выполните эти команды в Supabase → SQL Editor
-- ============================================================

-- Новые поля в таблице rooms
alter table public.rooms
  add column if not exists price_per_team numeric(10,2),
  add column if not exists genre text,
  add column if not exists difficulty text,
  add column if not exists age_limit text,
  add column if not exists min_players int default 2,
  add column if not exists max_players int default 6,
  add column if not exists duration_minutes int default 60,
  add column if not exists has_actor boolean default false,
  add column if not exists is_scary text default 'нет';

-- Обновление таблицы bookings: убираем обязательность child_name/child_age,
-- добавляем players_count
alter table public.bookings
  add column if not exists players_count int default 2;

alter table public.bookings
  alter column child_name drop not null;

alter table public.bookings
  alter column child_age drop not null;
