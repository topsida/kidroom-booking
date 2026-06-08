-- ============================================================
-- СХЕМА БАЗЫ ДАННЫХ — КидРум
-- SQL Editor → New query → вставьте всё → Run
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
  price_per_hour numeric(10,2) not null,
  rating numeric(3,2) default 0,
  photos text[] default '{}',
  working_hours_start time default '09:00',
  working_hours_end time default '21:00',
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

create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  room_id uuid references public.rooms(id) on delete cascade not null,
  date date not null,
  time_slot time not null,
  child_name text not null,
  child_age int check (child_age between 1 and 18) not null,
  status text check (status in ('pending','confirmed','cancelled','completed')) default 'confirmed' not null,
  created_at timestamptz default now() not null,
  unique (room_id, date, time_slot)
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

-- Тестовые данные
insert into public.rooms (name, description, address, price_per_hour, rating, photos, working_hours_start, working_hours_end) values
('Радуга', 'Просторная комната с батутами, горками и мягкими модулями. Для детей от 1 до 7 лет.', 'г. Москва, ул. Ленина, 15', 800, 4.8, ARRAY['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'], '09:00', '21:00'),
('Звёздочка', 'Тематические зоны: космос, лес, пиратский корабль. Для детей от 2 до 10 лет.', 'г. Москва, пр. Мира, 42', 1000, 4.9, ARRAY['https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800'], '10:00', '22:00'),
('Весёлый мир', 'Творческие мастер-классы, LEGO и настольные игры. Для детей от 3 до 12 лет.', 'г. Москва, ул. Садовая, 8', 700, 4.6, ARRAY['https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800'], '09:00', '20:00'),
('Кидландия', 'Бассейн с шариками, детский скалодром и кафе для родителей.', 'г. Москва, Новый Арбат, 20', 1200, 4.7, ARRAY['https://images.unsplash.com/photo-1526634332515-d56c5fd16991?w=800'], '10:00', '22:00');
