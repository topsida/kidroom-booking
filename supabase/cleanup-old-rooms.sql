-- ============================================================
-- cleanup-old-rooms.sql
-- Удаляет детские игровые комнаты, оставляет только квест-румы
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Шаг 1: Посмотреть что будет удалено
-- (старые комнаты = у них поле genre не заполнено)
SELECT
  name,
  address,
  price_per_hour,
  genre,
  created_at
FROM public.rooms
WHERE genre IS NULL
ORDER BY created_at;

-- Шаг 2: Удалить pricing_rules если таблица существует
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pricing_rules'
  ) THEN
    DELETE FROM public.pricing_rules
    WHERE room_id IN (SELECT id FROM public.rooms WHERE genre IS NULL);
    RAISE NOTICE 'pricing_rules очищены';
  ELSE
    RAISE NOTICE 'Таблица pricing_rules не найдена — пропущено';
  END IF;
END $$;

-- Шаг 3: Удалить старые комнаты
-- bookings и reviews удалятся автоматически (ON DELETE CASCADE)
DELETE FROM public.rooms
WHERE genre IS NULL;

-- Шаг 4: Проверка — показать только квест-румы которые остались
SELECT
  name,
  genre,
  difficulty,
  age_limit,
  min_players || '–' || max_players || ' чел' AS players,
  duration_minutes || ' мин' AS duration,
  price_per_team::int || ' ₽' AS price,
  has_actor,
  is_scary
FROM public.rooms
ORDER BY created_at;
