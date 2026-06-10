-- ============================================================
-- Миграция: произвольные дни недели в тарифах
-- Supabase → SQL Editor → New query → Run
-- ============================================================

-- 0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб (совпадает с JS getDay())
alter table public.pricing_rules
  add column if not exists days_of_week integer[]
    default '{0,1,2,3,4,5,6}'
    not null;

-- Перенос существующих данных из day_type → days_of_week
update public.pricing_rules set days_of_week = '{1,2,3,4,5}'   where day_type = 'weekday';
update public.pricing_rules set days_of_week = '{0,6}'         where day_type = 'weekend';
update public.pricing_rules set days_of_week = '{0,1,2,3,4,5,6}' where day_type = 'all';

-- Проверка
select name, day_type, days_of_week from public.pricing_rules;
