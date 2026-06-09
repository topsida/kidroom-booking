-- ============================================================
-- ОБНОВЛЕНИЕ ФОТОГРАФИЙ КОМНАТ — реальные фото с Unsplash
-- Все URL проверены (HTTP 200). Формат: ?w=800&auto=format&fit=crop&q=80
--
-- Запустить в: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Москва: Радуга (батуты, горки, бассейн с шарами) ─────────────────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1656850713613-e4b663338bff?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621054392284-e4cab544f1ea?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600821986515-3ef5b0f29f39?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Радуга';

-- ── Москва: Звёздочка (тематические зоны: космос, лес, пираты) ───────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1548096027-926a68d14d95?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1619044184157-ac27e414c532?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Звёздочка';

-- ── Москва: Весёлый мир (творчество, LEGO, настолки) ─────────────────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1563823251941-b9989d1e8d97?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527689638836-411945a2b57c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526505262320-81542978f63b?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Весёлый мир';

-- ── Москва: Кидландия (бассейн с шарами, скалодром, кафе) ────────────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1760727408754-c5c9ef169f8d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1561861879-010ba01e6c45?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557124816-e9b7d5440de2?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Кидландия';

-- ── Ростов: Весёлые горки (батуты, горки, лабиринт) ─────────────────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1600821986515-3ef5b0f29f39?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1656850713613-e4b663338bff?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Весёлые горки';

-- ── Ростов: Пиратский остров (корабль, верёвки, аниматоры) ───────────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1619044184157-ac27e414c532?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600173868911-23137600bed9?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Пиратский остров';

-- ── Ростов: Лесная сказка (лес, домики, творческая мастерская) ───────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1613950190144-4f2a84c75e8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Лесная сказка';

-- ── Ростов: Детская галактика (VR, LEGO, роботы) ─────────────────────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563823263008-ec7877629ba0?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543878636-41918458581d?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Детская галактика';

-- ── Ростов: Маленькая страна (ролевые игры, профессии) ───────────────────────
UPDATE public.rooms SET photos = ARRAY[
  'https://images.unsplash.com/photo-1617117206620-b01f2919ff86?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1605627079912-97c3810a11a4?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1609446154807-d56805f0e007?w=800&auto=format&fit=crop&q=80'
] WHERE name = 'Маленькая страна';

-- Проверка результата
SELECT name, array_length(photos, 1) AS photo_count, photos[1] AS first_photo
FROM public.rooms
ORDER BY created_at;
