-- Миграция: исправить московские адреса на ростовские
-- Supabase SQL Editor → New query → Run

update public.rooms set
  address   = 'г. Ростов-на-Дону, ул. Пушкинская, 30',
  latitude  = 47.2237,
  longitude = 39.7138
where name = 'Радуга';

update public.rooms set
  address   = 'г. Ростов-на-Дону, пр. Ворошиловский, 55',
  latitude  = 47.2295,
  longitude = 39.7220
where name = 'Звёздочка';

update public.rooms set
  address   = 'г. Ростов-на-Дону, ул. Сокольническая, 22',
  latitude  = 47.2175,
  longitude = 39.7048
where name = 'Весёлый мир';

update public.rooms set
  address   = 'г. Ростов-на-Дону, пл. Карла Маркса, 8, ТЦ «Западный»',
  latitude  = 47.2320,
  longitude = 39.6978
where name = 'Кидландия';

-- Проверка
select name, address, latitude, longitude from public.rooms order by name;
