/**
 * Обновление организации "Тёмный лабиринт" + 3 квеста
 * Запуск: node scripts/seed-dark-labyrinth.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const SUPA_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY      = process.env.SUPABASE_SERVICE_KEY;

if (!KEY) {
  console.error('Нужен SUPABASE_SERVICE_KEY в .env');
  process.exit(1);
}

const Q = (s) => encodeURIComponent(s);

function img(id) {
  return `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80`;
}

// ── Фото организации ──────────────────────────────────────────────────────────
const ORG_PHOTOS = [
  'photo-1707552246192-eeb45c6e782d', // тёмный коридор с лавками
  'photo-1716447338820-277141a14251', // тёмный коридор со светом в конце
  'photo-1536154800961-9920ffae73e3', // заброшенный объект
].map(img);

// ── Квест 1 — Проклятие Доктора Морро (хоррор) ───────────────────────────────
const HORROR_PHOTOS = [
  'photo-1649578474199-59d8f6d4c03e', // тёмный коридор
  'photo-1687715997916-4030568eda97', // коридор с чемоданом
  'photo-1453967854176-7e6e8270b0b8', // пустая палата
  'photo-1498938684035-eb4e78131735', // заброшенный переулок
  'photo-1770557545129-f04433e9af92', // брошенная комната
  'photo-1758607235408-555a82671263', // граффити заброшенная комната
  'photo-1707552246192-eeb45c6e782d', // коридор с лавками
  'photo-1716447338820-277141a14251', // тёмный длинный коридор
  'photo-1536154800961-9920ffae73e3', // заброшенный объект
  'photo-1560684033-2a9ff3d2a03e',    // таинственная фигура
].map(img);

// ── Квест 2 — Код Люцифера (детектив) ────────────────────────────────────────
const DETECTIVE_PHOTOS = [
  'photo-1781665790125-81ffedbdbecc', // доска расследования с красной нитью
  'photo-1774535852012-0c634d8f2da0', // разбросанные документы
  'photo-1708101698996-3d4ebdfaa29a', // женщина читает газету у свечи
  'photo-1708101698991-b4be1bb95706', // женщина с книгой у свечи
  'photo-1708101699020-1284fefca2a6', // женщина за столом с книгой
  'photo-1560005490-8ce6d5357ffa',    // лампа и книга
  'photo-1570839872119-18e88f95d57a', // лупа в руках
  'photo-1600465102847-f5aa86d9b026', // детектив в шляпе
  'photo-1560684033-2a9ff3d2a03e',    // таинственная фигура
  'photo-1720273238003-079301a7e9b1', // тёмная гостиная с камином
].map(img);

// ── Квест 3 — Корабль призраков (приключение) ─────────────────────────────────
const SHIP_PHOTOS = [
  'photo-1761442663911-94b543328ce2', // старый парусник в тумане
  'photo-1612428978467-80244027cc2b', // корабль в море (ч/б)
  'photo-1601191464587-79bee075cae9', // чёрный корабль под серым небом
  'photo-1515593761628-37c272a009f9', // галеон
  'photo-1608936511952-11bd2edde695', // корабль ночью
  'photo-1590880449155-b54f958ce314', // коричневый корабль на закате
  'photo-1527287993547-b5d3ad9ca875', // старая лодка
  'photo-1561508539-d46a8ac4b20a',    // заброшенный кораблекрушение
  'photo-1675945013347-015129cca174', // ржавый корабль
  'photo-1568048298963-3f548a3eeada', // корабль на берегу
].map(img);

// ── REST API helpers ──────────────────────────────────────────────────────────

async function patch(path, body) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        KEY,
      'Authorization': `Bearer ${KEY}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PATCH ${path} → ${r.status}: ${t}`);
  }
}

async function get(path) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`GET ${path} → ${r.status}: ${t}`);
  }
  return r.json();
}

// ── Основная логика ───────────────────────────────────────────────────────────

async function run() {
  console.log('\n── 1. Обновление организации ────────────────────────────────\n');

  // Обновляем по любому из возможных названий
  await patch(
    `rooms?or=(name.eq.${Q('Квестиум')},name.eq.${Q('Тёмный лабиринт')})`,
    {
      name:    'Тёмный лабиринт',
      address: 'г. Ростов-на-Дону, ул. Большая Садовая, 55',
      photos:  ORG_PHOTOS,
    }
  );
  console.log('  ✓  Организация обновлена');

  console.log('\n── 2. Получение ID организации ──────────────────────────────\n');
  const rooms = await get(`rooms?name=eq.${Q('Тёмный лабиринт')}&select=id`);
  if (!rooms.length) throw new Error('Организация не найдена');
  const roomId = rooms[0].id;
  console.log(`  ✓  ID: ${roomId}`);

  console.log('\n── 3. Получение квестов ─────────────────────────────────────\n');
  const quests = await get(`quests?room_id=eq.${roomId}&select=id,name&order=created_at.asc`);
  if (quests.length < 3) throw new Error(`Найдено только ${quests.length} квест(ов), ожидалось 3`);
  console.log(`  ✓  Квестов: ${quests.length} (${quests.map(q => q.name).join(', ')})`);

  console.log('\n── 4. Обновление квеста 1 ───────────────────────────────────\n');
  await patch(`quests?id=eq.${quests[0].id}`, {
    name:             'Проклятие Доктора Морро',
    description:      'В заброшенной психиатрической клинике исчезают люди. Вы — последняя надежда найти правду о безумном докторе Морро и его жутких экспериментах. У вас есть 60 минут чтобы выбраться живыми.',
    genre:            'хоррор',
    difficulty:       'опытный',
    age_limit:        '16+',
    min_players:      2,
    max_players:      6,
    duration_minutes: 60,
    has_actor:        false,
    is_scary:         'хоррор',
    price_per_team:   3500,
    photos:           HORROR_PHOTOS,
  });
  console.log('  ✓  "Проклятие Доктора Морро" обновлён');

  console.log('\n── 5. Обновление квеста 2 ───────────────────────────────────\n');
  await patch(`quests?id=eq.${quests[1].id}`, {
    name:             'Код Люцифера',
    description:      'Секретный агент убит. В его руках — зашифрованный диск с данными которые изменят мир. Вы — элитная группа детективов. Взломайте код, найдите предателя, спасите операцию.',
    genre:            'детектив',
    difficulty:       'опытный',
    age_limit:        '12+',
    min_players:      2,
    max_players:      6,
    duration_minutes: 60,
    has_actor:        false,
    is_scary:         'нет',
    price_per_team:   3200,
    photos:           DETECTIVE_PHOTOS,
  });
  console.log('  ✓  "Код Люцифера" обновлён');

  console.log('\n── 6. Обновление квеста 3 ───────────────────────────────────\n');
  await patch(`quests?id=eq.${quests[2].id}`, {
    name:             'Корабль призраков',
    description:      'Заброшенный корабль дрейфует в открытом море уже 50 лет. Никто не знает что случилось с командой. Вы поднялись на борт — и обратного пути нет.',
    genre:            'приключение',
    difficulty:       'средний',
    age_limit:        '12+',
    min_players:      2,
    max_players:      6,
    duration_minutes: 60,
    has_actor:        false,
    is_scary:         'немного',
    price_per_team:   3000,
    photos:           SHIP_PHOTOS,
  });
  console.log('  ✓  "Корабль призраков" обновлён');

  console.log('\n── Итог ─────────────────────────────────────────────────────\n');
  const updated = await get(`quests?room_id=eq.${roomId}&select=name,genre,photos&order=created_at.asc`);
  updated.forEach(q => {
    console.log(`  ${q.name.padEnd(30)} ${q.genre.padEnd(12)} ${q.photos?.length ?? 0} фото`);
  });
  console.log();
}

run().catch(e => { console.error('\n✗', e.message); process.exit(1); });
