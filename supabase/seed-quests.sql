-- ============================================================
-- seed-quests.sql — 3 дополнительных квест-рума Ростова-на-Дону
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

-- 1. Детский квест — "Сказочный замок"
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
),

-- 2. Детективный квест — "Звонок из прошлого"
(
  'Звонок из прошлого',
  'В Ростове 1970-х пропал известный журналист — его последний репортаж касался опасной тайны. Вы проникаете в его кабинет, находите зашифрованные записи и плёночные фотографии. Распутайте клубок советских секретов, пока за вами самими не начали следить.',
  'г. Ростов-на-Дону, ул. М. Горького, 3',
  2200.00, 2200.00, 4.75,
  ARRAY[
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1453301109223-3dbbb7ccc0f7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'
  ],
  '10:00', '22:00',
  'детектив', 'новичок', '12+',
  2, 5, 60,
  false, 'нет'
),

-- 3. Хоррор с актёром — "Санаторий"
(
  'Санаторий',
  'Заброшенный санаторий на окраине города закрыт уже 30 лет. Говорят, последний главврач так и не вышел из подвала. Живой актёр в роли «пациента» появляется неожиданно — в темноте, из-за угла, вплотную. Самый пугающий квест Ростова. Строго 18+, без возврата.',
  'г. Ростов-на-Дону, ул. Шаумяна, 55',
  3600.00, 3600.00, 4.65,
  ARRAY[
    'https://images.unsplash.com/photo-1535356760845-24b27d40fce7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533371452382-d45a9da51ad9?w=800&auto=format&fit=crop&q=80'
  ],
  '17:00', '23:00',
  'хоррор', 'опытный', '18+',
  2, 4, 60,
  true, 'хоррор'
);

-- Проверка — должны появиться 3 новых квеста
select name, genre, difficulty, age_limit,
       min_players, max_players, duration_minutes,
       has_actor, is_scary, price_per_team
from public.rooms
order by created_at desc
limit 3;
