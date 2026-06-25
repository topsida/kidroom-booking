-- ============================================================
-- seed-quests.sql — дополнительный квест-рум Ростова-на-Дону
-- Supabase Dashboard → SQL Editor → Run
-- НЕ удаляет существующие квесты, только добавляет новые
-- ============================================================

insert into public.rooms
  (name, description, address,
   price_per_hour, price_per_team, rating, photos,
   working_hours_start, working_hours_end,
   genre, difficulty, age_limit,
   min_players, max_players, duration_minutes,
   has_actor, is_scary)
values

-- Детский квест — "Сказочный замок"
(
  'Сказочный замок',
  'Злой волшебник заколдовал принцессу! Вместе с командой маленьких героев пройдите через волшебные комнаты, разгадайте загадки гномов, соберите зачарованные ключи и разрушьте заклятие. Яркие декорации, простые задания, атмосфера настоящей сказки — идеально для детей и всей семьи.',
  'г. Ростов-на-Дону, ул. Пушкинская, 44',
  1500.00, 1500.00, 4.80,
  ARRAY[
    'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558008258-3256797b43f3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format&fit=crop&q=80'
  ],
  '10:00', '21:00',
  'детский', 'новичок', '6+',
  1, 4, 45,
  false, 'нет'
);

-- Проверка
select name, genre, difficulty, age_limit,
       min_players, max_players, duration_minutes,
       has_actor, is_scary, price_per_team
from public.rooms
order by created_at;
