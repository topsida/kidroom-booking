-- ============================================================
-- seed-kvestium.sql — организация Квестиум + 3 квеста
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ── Шаг 1: расширить CHECK age_limit — добавить '8+' ─────────────────────────

ALTER TABLE public.rooms
  DROP CONSTRAINT IF EXISTS rooms_age_limit_check;
ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_age_limit_check
  CHECK (age_limit IN ('6+','8+','12+','16+','18+'));

ALTER TABLE public.quests
  DROP CONSTRAINT IF EXISTS quests_age_limit_check;
ALTER TABLE public.quests
  ADD CONSTRAINT quests_age_limit_check
  CHECK (age_limit IN ('6+','8+','12+','16+','18+'));


-- ── Шаг 2: добавить поле phone в rooms (контакт организации) ─────────────────

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS phone text;


-- ── Шаг 3: вставить организацию и сразу её 3 квеста ─────────────────────────
-- CTE гарантирует что квесты получат правильный room_id

WITH new_org AS (
  INSERT INTO public.rooms
    (name, address, phone, price_per_hour, rating,
     photos, working_hours_start, working_hours_end)
  VALUES (
    'Квестиум',
    'г. Ростов-на-Дону, пер. Семашко, 103',
    '+79185583626',
    0, 5.0,
    ARRAY[]::text[],
    '10:00', '22:00'
  )
  RETURNING id
)
INSERT INTO public.quests
  (room_id, name, description,
   genre, difficulty, age_limit,
   min_players, max_players, duration_minutes,
   has_actor, is_scary, price_per_team, photos)
SELECT
  new_org.id,
  q.name, q.description,
  q.genre, q.difficulty, q.age_limit,
  q.min_players, q.max_players, q.duration_minutes,
  q.has_actor, q.is_scary, q.price_per_team,
  ARRAY[]::text[]
FROM new_org,
(VALUES
  (
    'Иллюзия обмана',
    'Вы иллюзионисты, команда лучших в мире! Вам предстоит провернуть аферу и разоблачить жестокого техномагната. Украсть чип из хранилища Окты — вот ваша миссия. 5 разных комнат, 25+ загадок, потайные проходы.',
    'приключение', 'средний', '8+',
    2, 10, 60, true, 'нет', 3000.00
  ),
  (
    'Ограбление мафии',
    'В тёмных переулках города есть отель — логово мафии, где спрятан бриллиант за $1 000 000. Раскрыть тайну, выкрасть реликвию и уйти незамеченными. 6 комнат, 35+ загадок.',
    'детектив', 'средний', '8+',
    2, 10, 60, true, 'нет', 3000.00
  ),
  (
    'Монополия',
    'Экшн-игра Монополия — захватывающее командное приключение для большой компании. Купите, постройте, победите!',
    'приключение', 'новичок', '8+',
    6, 16, 90, true, 'нет', 4000.00
  )
) AS q(name, description, genre, difficulty, age_limit,
       min_players, max_players, duration_minutes,
       has_actor, is_scary, price_per_team);


-- ── Шаг 4: проверка ───────────────────────────────────────────────────────────

SELECT
  r.name                                            AS organization,
  r.phone,
  q.name                                            AS quest,
  q.genre, q.difficulty, q.age_limit,
  q.min_players || '–' || q.max_players || ' чел'  AS players,
  q.duration_minutes || ' мин'                      AS duration,
  q.price_per_team::int || ' ₽'                     AS price,
  q.has_actor
FROM public.quests q
JOIN public.rooms  r ON r.id = q.room_id
WHERE r.name = 'Квестиум'
ORDER BY q.price_per_team;
