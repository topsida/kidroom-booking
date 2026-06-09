/**
 * Seed + update photos script
 *
 * Требуется: SUPABASE_SERVICE_KEY в .env
 * Получить: Supabase Dashboard → Settings → API → service_role (secret)
 *
 * Запуск: node scripts/seed-rooms.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!KEY) {
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║  Нужен SUPABASE_SERVICE_KEY в файле .env                     ║
║                                                              ║
║  1. https://supabase.com/dashboard/project/                  ║
║     swzgdczbipgnsbxjcrgn/settings/api                        ║
║  2. Скопируй ключ «service_role» (secret)                    ║
║  3. Добавь в .env:  SUPABASE_SERVICE_KEY=eyJ...              ║
║  4. Запусти скрипт снова                                     ║
╚══════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

// ── 1. Новые ростовские комнаты ───────────────────────────────────────────────
const NEW_ROOMS = [
  {
    name: 'Весёлые горки',
    description:
      'Просторный игровой центр в самом центре Ростова. Сухой бассейн с 50 000 шаров, ' +
      'многоуровневый лабиринт, батуты и горки высотой до 4 метров. Отдельная тихая зона ' +
      'для малышей до 3 лет с мягкими модулями. Кафе для родителей с Wi-Fi и свежей выпечкой.',
    address: 'г. Ростов-на-Дону, ул. Большая Садовая, 73',
    price_per_hour: 900,
    rating: 4.80,
    photos: [
      'https://images.unsplash.com/photo-1600821986515-3ef5b0f29f39?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1656850713613-e4b663338bff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80',
    ],
    working_hours_start: '09:00',
    working_hours_end:   '21:00',
  },
  {
    name: 'Пиратский остров',
    description:
      'Двухуровневый пиратский корабль с верёвочными мостиками, пушкой для поролоновых ядер ' +
      'и сундуком с «сокровищами». По выходным — аниматоры в костюмах пиратов, квесты и морские ' +
      'сражения. Организуем детский день рождения «под ключ» в морском стиле.',
    address: 'г. Ростов-на-Дону, пр. Нагибина, 32/2, ТЦ «Мегамаг», 3 этаж',
    price_per_hour: 1200,
    rating: 4.90,
    photos: [
      'https://images.unsplash.com/photo-1619044184157-ac27e414c532?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600173868911-23137600bed9?w=800&auto=format&fit=crop&q=80',
    ],
    working_hours_start: '10:00',
    working_hours_end:   '22:00',
  },
  {
    name: 'Лесная сказка',
    description:
      'Волшебный лес с деревянными домиками гномов, горкой-деревом и поролоновыми зверюшками. ' +
      'Творческая мастерская: лепка из глины, рисование по стеклу, аппликации из природных ' +
      'материалов. Каждый ребёнок уносит домой свою поделку. Идеально для малышей 2–7 лет.',
    address: 'г. Ростов-на-Дону, ул. Стачки, 18б',
    price_per_hour: 800,
    rating: 4.70,
    photos: [
      'https://images.unsplash.com/photo-1613950190144-4f2a84c75e8c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=800&auto=format&fit=crop&q=80',
    ],
    working_hours_start: '09:00',
    working_hours_end:   '21:00',
  },
  {
    name: 'Детская галактика',
    description:
      'Технологичный центр будущего: VR-аттракционы в шлемах, LEGO-зона с 200 наборами, ' +
      'интерактивный пол с играми и робот-гид «Коперник». Обучающие программы по программированию ' +
      'и робототехнике для детей 5–14 лет. Корпоративные экскурсии для школьных классов.',
    address: 'г. Ростов-на-Дону, Театральный пр., 68, ТЦ «Горизонт», 4 этаж',
    price_per_hour: 1400,
    rating: 4.90,
    photos: [
      'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563823263008-ec7877629ba0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543878636-41918458581d?w=800&auto=format&fit=crop&q=80',
    ],
    working_hours_start: '10:00',
    working_hours_end:   '22:00',
  },
  {
    name: 'Маленькая страна',
    description:
      'Ролевой «Городок профессий»: мини-кухня с безопасными настоящими продуктами, кабинет врача ' +
      'с реквизитом, супермаркет с кассой, строительная площадка и мини-телестудия с камерой. ' +
      'Дети учатся взрослым профессиям через игру. Еженедельные тематические дни.',
    address: 'г. Ростов-на-Дону, ул. Красноармейская, 45',
    price_per_hour: 850,
    rating: 4.60,
    photos: [
      'https://images.unsplash.com/photo-1617117206620-b01f2919ff86?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1605627079912-97c3810a11a4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609446154807-d56805f0e007?w=800&auto=format&fit=crop&q=80',
    ],
    working_hours_start: '09:00',
    working_hours_end:   '20:00',
  },
];

// ── 2. Обновления фото для всех комнат (включая московские) ──────────────────
const PHOTO_UPDATES = [
  {
    name: 'Радуга',
    photos: [
      'https://images.unsplash.com/photo-1656850713613-e4b663338bff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621054392284-e4cab544f1ea?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600821986515-3ef5b0f29f39?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    name: 'Звёздочка',
    photos: [
      'https://images.unsplash.com/photo-1548096027-926a68d14d95?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1619044184157-ac27e414c532?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    name: 'Весёлый мир',
    photos: [
      'https://images.unsplash.com/photo-1563823251941-b9989d1e8d97?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527689638836-411945a2b57c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526505262320-81542978f63b?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    name: 'Кидландия',
    photos: [
      'https://images.unsplash.com/photo-1760727408754-c5c9ef169f8d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561861879-010ba01e6c45?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1557124816-e9b7d5440de2?w=800&auto=format&fit=crop&q=80',
    ],
  },
];

async function req(method, path, body) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'apikey':        KEY,
      'Authorization': `Bearer ${KEY}`,
      'Prefer':        'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function run() {
  console.log('\n── Добавление ростовских комнат ─────────────────────────────\n');
  for (const room of NEW_ROOMS) {
    const res = await req('POST', 'rooms', room);
    if (res.ok) console.log(`  ✓  Добавлена: ${room.name}`);
    else if (res.status === 409) console.log(`  —  Уже есть:  ${room.name}`);
    else console.error(`  ✗  Ошибка ${res.status}: ${room.name} — ${await res.text()}`);
  }

  console.log('\n── Обновление фото (все комнаты) ────────────────────────────\n');
  for (const upd of [...PHOTO_UPDATES, ...NEW_ROOMS.map(r => ({ name: r.name, photos: r.photos }))]) {
    const res = await req('PATCH', `rooms?name=eq.${encodeURIComponent(upd.name)}`, { photos: upd.photos });
    if (res.ok) console.log(`  ✓  Фото обновлены: ${upd.name}`);
    else console.error(`  ✗  Ошибка ${res.status}: ${upd.name}`);
  }

  console.log('\n── Итог ─────────────────────────────────────────────────────\n');
  const res = await fetch(`${URL}/rest/v1/rooms?select=name,array_length(photos,1)&order=created_at.asc`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
  });
  const rooms = await res.json();
  rooms.forEach(r => console.log(`  ${r.name.padEnd(22)} ${r.array_length ?? 0} фото`));
  console.log();
}

run().catch(e => { console.error(e); process.exit(1); });
