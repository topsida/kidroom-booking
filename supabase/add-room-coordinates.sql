-- Миграция: координаты игровых комнат для отображения на карте
-- Supabase SQL Editor → New query → Run

alter table public.rooms
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

-- Ростовские комнаты
update public.rooms set latitude = 47.2213, longitude = 39.7190 where name = 'Весёлые горки';
update public.rooms set latitude = 47.2464, longitude = 39.7008 where name = 'Пиратский остров';
update public.rooms set latitude = 47.2100, longitude = 39.6856 where name = 'Лесная сказка';
update public.rooms set latitude = 47.2249, longitude = 39.7179 where name = 'Детская галактика';
update public.rooms set latitude = 47.2264, longitude = 39.7100 where name = 'Маленькая страна';

-- Проверка
select name, latitude, longitude from public.rooms order by name;
