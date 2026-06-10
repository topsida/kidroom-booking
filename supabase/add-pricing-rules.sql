-- ============================================================
-- Миграция: динамическое ценообразование (тарифы)
-- Supabase → SQL Editor → New query → Run
-- ============================================================

create table public.pricing_rules (
  id            uuid default gen_random_uuid() primary key,
  room_id       uuid references public.rooms(id) on delete cascade not null,
  name          text not null default '',
  day_type      text not null default 'all'
                  check (day_type in ('weekday', 'weekend', 'all')),
  time_from     time not null default '00:00',
  time_to       time not null default '23:00',
  price_modifier numeric(4,2) not null default 1.0
                  check (price_modifier > 0 and price_modifier <= 5),
  is_active     boolean not null default true,
  created_at    timestamptz default now() not null
);

alter table public.pricing_rules enable row level security;

-- Все могут читать тарифы (нужно мобильному приложению для расчёта цены)
create policy "public read"
  on public.pricing_rules for select using (true);

-- Владелец комнаты управляет своими тарифами
create policy "owner insert"
  on public.pricing_rules for insert
  with check (room_id in (
    select id from public.rooms where owner_id = auth.uid()
  ));

create policy "owner update"
  on public.pricing_rules for update
  using (room_id in (
    select id from public.rooms where owner_id = auth.uid()
  ));

create policy "owner delete"
  on public.pricing_rules for delete
  using (room_id in (
    select id from public.rooms where owner_id = auth.uid()
  ));

-- Пример тарифов (необязательно — для тестирования)
-- Раскомментируйте и подставьте реальный room_id:
-- insert into public.pricing_rules (room_id, name, day_type, time_from, time_to, price_modifier, is_active)
-- values
--   ('<room_id>', 'Утренняя скидка',    'weekday', '09:00', '12:00', 0.80, true),
--   ('<room_id>', 'Вечерний час-пик',   'weekday', '17:00', '21:00', 1.30, true),
--   ('<room_id>', 'Выходной наценка',   'weekend', '10:00', '20:00', 1.20, true);
