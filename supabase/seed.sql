-- ============================================================
-- ТЕСТОВЫЕ ДАННЫЕ — QuestPoint (квест-румы Ростова-на-Дону)
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Очистить старые данные (детские комнаты)
delete from public.bookings;
delete from public.reviews;
delete from public.rooms;

-- 5 квест-румов Ростова-на-Дону
insert into public.rooms
  (name, description, address,
   price_per_hour, price_per_team, rating, photos,
   working_hours_start, working_hours_end,
   genre, difficulty, age_limit,
   min_players, max_players, duration_minutes,
   has_actor, is_scary)
values

(
  'Призрак Оперы',
  'Вы — детективы, расследующие загадочную гибель примадонны. Старинный театр, призрачная музыка, живой актёр-призрак, который следит за каждым вашим шагом. Погрузитесь в атмосферу викторианского ужаса — только для смелых. Квест с профессиональным актёром в роли Призрака.',
  'г. Ростов-на-Дону, пер. Соборный, 12',
  4000.00, 4000.00, 4.90,
  ARRAY[
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&auto=format&fit=crop&q=80'
  ],
  '12:00', '23:00',
  'хоррор', 'опытный', '16+',
  2, 5, 60,
  true, 'хоррор'
),

(
  'Дело Шерлока',
  'Лондон, 1895 год. Профессор Мориарти похитил секретные документы и скрылся. У вас 60 минут, чтобы найти улики, разгадать шифры и поймать злодея раньше, чем он покинет страну. Квест в стиле детективного романа — логика и наблюдательность важнее силы.',
  'г. Ростов-на-Дону, ул. Большая Садовая, 51',
  2800.00, 2800.00, 4.80,
  ARRAY[
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80'
  ],
  '10:00', '22:00',
  'детектив', 'средний', '12+',
  2, 6, 60,
  false, 'нет'
),

(
  'Подземелье Минотавра',
  'Вы заблудились в лабиринте древнего Крита, и где-то в темноте рычит Минотавр. Время отсчитывается — ищите выход через головоломки, тайные рычаги и криптографические надписи на стенах. Финальная встреча с Минотавром заставит сердце биться чаще.',
  'г. Ростов-на-Дону, пр. Нагибина, 14',
  3200.00, 3200.00, 4.70,
  ARRAY[
    'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533856498553-8f8e3f0d0e57?w=800&auto=format&fit=crop&q=80'
  ],
  '11:00', '22:00',
  'приключение', 'опытный', '12+',
  2, 5, 60,
  false, 'немного'
),

(
  'Галактика VR',
  'Первый в Ростове полностью VR-квест без физических реквизитов. Шлемы виртуальной реальности переносят вас на орбитальную станцию — нужно устранить утечку реактора и вернуться до взрыва. Подходит даже тем, кто никогда не играл в VR — всё интуитивно.',
  'г. Ростов-на-Дону, Театральный пр., 68, ТЦ «Горизонт», 3 этаж',
  2500.00, 2500.00, 4.60,
  ARRAY[
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617802690658-1173a812650d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&auto=format&fit=crop&q=80'
  ],
  '10:00', '22:00',
  'VR', 'новичок', '6+',
  1, 4, 45,
  false, 'нет'
),

(
  'Последний банк',
  'Перформанс-квест в духе «Бумажного дома». Профессиональные актёры играют банкиров и охранников — вам нужно войти в доверие, найти коды, вскрыть хранилище и уйти незамеченными. Импровизация, переговоры и актёрская игра важнее пазлов. Каждый сеанс уникален.',
  'г. Ростов-на-Дону, ул. Красноармейская, 36',
  4500.00, 4500.00, 4.85,
  ARRAY[
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop&q=80'
  ],
  '13:00', '23:00',
  'перформанс', 'средний', '16+',
  3, 8, 90,
  true, 'немного'
);

-- Проверка
select name, genre, difficulty, age_limit,
       min_players, max_players, duration_minutes,
       has_actor, is_scary, price_per_team
from public.rooms order by created_at;
