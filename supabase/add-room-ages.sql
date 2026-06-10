-- Миграция: возрастные ограничения для игровых комнат
-- Supabase SQL Editor → New query → Run

alter table public.rooms
  add column if not exists min_age int default 1,
  add column if not exists max_age int default 18;

-- Ростовские комнаты
update public.rooms set min_age = 1,  max_age = 10 where name = 'Весёлые горки';
update public.rooms set min_age = 4,  max_age = 14 where name = 'Пиратский остров';
update public.rooms set min_age = 2,  max_age = 7  where name = 'Лесная сказка';
update public.rooms set min_age = 5,  max_age = 14 where name = 'Детская галактика';
update public.rooms set min_age = 2,  max_age = 12 where name = 'Маленькая страна';

-- Остальные комнаты
update public.rooms set min_age = 1,  max_age = 7  where name = 'Радуга';
update public.rooms set min_age = 2,  max_age = 10 where name = 'Звёздочка';
update public.rooms set min_age = 3,  max_age = 12 where name = 'Весёлый мир';
update public.rooms set min_age = 2,  max_age = 12 where name = 'Кидландия';

-- Проверка
select name, min_age, max_age from public.rooms order by min_age;
