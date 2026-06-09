-- ============================================================
-- ТЕСТОВЫЕ ДАННЫЕ — КидРум
-- Запустить в: Supabase Dashboard → SQL Editor → Run
-- Все фото проверены (HTTP 200, images.unsplash.com)
-- ============================================================

-- ── 5 игровых комнат Ростова-на-Дону ────────────────────────────────────────
INSERT INTO public.rooms
  (name, description, address, price_per_hour, rating, photos, working_hours_start, working_hours_end)
VALUES

(
  'Весёлые горки',
  'Просторный игровой центр в самом центре Ростова. Сухой бассейн с 50 000 шаров, многоуровневый лабиринт, батуты и горки высотой до 4 метров. Отдельная тихая зона для малышей до 3 лет с мягкими модулями. Кафе для родителей с Wi-Fi и свежей выпечкой.',
  'г. Ростов-на-Дону, ул. Большая Садовая, 73',
  900.00, 4.80,
  ARRAY[
    'https://images.unsplash.com/photo-1600821986515-3ef5b0f29f39?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1656850713613-e4b663338bff?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80'
  ],
  '09:00', '21:00'
),
(
  'Пиратский остров',
  'Двухуровневый пиратский корабль с верёвочными мостиками, пушкой для поролоновых ядер и сундуком с «сокровищами». По выходным — аниматоры в костюмах пиратов, квесты и морские сражения. Организуем детский день рождения «под ключ» в морском стиле.',
  'г. Ростов-на-Дону, пр. Нагибина, 32/2, ТЦ «Мегамаг», 3 этаж',
  1200.00, 4.90,
  ARRAY[
    'https://images.unsplash.com/photo-1619044184157-ac27e414c532?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600173868911-23137600bed9?w=800&auto=format&fit=crop&q=80'
  ],
  '10:00', '22:00'
),
(
  'Лесная сказка',
  'Волшебный лес с деревянными домиками гномов, горкой-деревом и поролоновыми зверюшками. Творческая мастерская: лепка из глины, рисование по стеклу, аппликации из природных материалов. Каждый ребёнок уносит домой свою поделку. Идеально для малышей 2–7 лет.',
  'г. Ростов-на-Дону, ул. Стачки, 18б',
  800.00, 4.70,
  ARRAY[
    'https://images.unsplash.com/photo-1613950190144-4f2a84c75e8c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=800&auto=format&fit=crop&q=80'
  ],
  '09:00', '21:00'
),
(
  'Детская галактика',
  'Технологичный центр будущего: VR-аттракционы в шлемах, LEGO-зона с 200 наборами, интерактивный пол с играми и робот-гид «Коперник». Обучающие программы по программированию и робототехнике для детей 5–14 лет. Корпоративные экскурсии для школьных классов.',
  'г. Ростов-на-Дону, Театральный пр., 68, ТЦ «Горизонт», 4 этаж',
  1400.00, 4.90,
  ARRAY[
    'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563823263008-ec7877629ba0?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1543878636-41918458581d?w=800&auto=format&fit=crop&q=80'
  ],
  '10:00', '22:00'
),
(
  'Маленькая страна',
  'Ролевой «Городок профессий»: мини-кухня с безопасными настоящими продуктами, кабинет врача с реквизитом, супермаркет с кассой, строительная площадка и мини-телестудия с камерой. Дети учатся взрослым профессиям через игру. Еженедельные тематические дни.',
  'г. Ростов-на-Дону, ул. Красноармейская, 45',
  850.00, 4.60,
  ARRAY[
    'https://images.unsplash.com/photo-1617117206620-b01f2919ff86?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605627079912-97c3810a11a4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1609446154807-d56805f0e007?w=800&auto=format&fit=crop&q=80'
  ],
  '09:00', '20:00'
);

-- ── Обновить фото у московских комнат (если они уже были добавлены) ──────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1656850713613-e4b663338bff?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621054392284-e4cab544f1ea?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600821986515-3ef5b0f29f39?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Радуга';

UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1548096027-926a68d14d95?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1619044184157-ac27e414c532?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Звёздочка';

UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1563823251941-b9989d1e8d97?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527689638836-411945a2b57c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526505262320-81542978f63b?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Весёлый мир';

UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1760727408754-c5c9ef169f8d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1561861879-010ba01e6c45?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557124816-e9b7d5440de2?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Кидландия';

-- Проверка
SELECT name, array_length(photos, 1) AS photos, left(photos[1], 60) AS first_photo
FROM public.rooms ORDER BY created_at;
