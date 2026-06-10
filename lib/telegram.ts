export async function sendTelegramMessage(chatId: string, text: string) {
  const BOT_TOKEN = process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN;

  console.log('[Telegram] sendTelegramMessage called');
  console.log('[Telegram] BOT_TOKEN present:', !!BOT_TOKEN, '| value starts with:', BOT_TOKEN?.slice(0, 10));
  console.log('[Telegram] chatId:', chatId || '(empty)');

  if (!BOT_TOKEN) {
    console.warn('[Telegram] ABORT: EXPO_PUBLIC_TELEGRAM_BOT_TOKEN is not set');
    return;
  }
  if (!chatId) {
    console.warn('[Telegram] ABORT: chatId is empty');
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: 'HTML' };
  console.log('[Telegram] POST', url.replace(BOT_TOKEN, '<TOKEN>'));
  console.log('[Telegram] body:', JSON.stringify(body).slice(0, 200));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    console.log('[Telegram] response status:', res.status);
    console.log('[Telegram] response body:', JSON.stringify(json));
  } catch (e) {
    console.error('[Telegram] fetch error:', e);
  }
}

export function ownerCancellationNotificationText(p: {
  roomName: string;
  clientName: string;
  phone: string;
  date: string;
  time: string;
}) {
  const client = p.clientName?.trim() ? `${p.clientName} · ${p.phone}` : p.phone;
  return (
    `❌ <b>Бронь отменена</b>\n\n` +
    `🏠 <b>Комната:</b> ${p.roomName}\n` +
    `👤 <b>Клиент:</b> ${client}\n` +
    `📅 <b>Дата:</b> ${p.date}\n` +
    `🕐 <b>Время:</b> ${p.time}`
  );
}

export function ownerBookingNotificationText(p: {
  roomName: string;
  clientName: string;
  phone: string;
  date: string;
  time: string;
  childName: string;
  childAge: number;
}) {
  const w = p.childAge === 1 ? 'год' : p.childAge <= 4 ? 'года' : 'лет';
  const client = p.clientName?.trim() ? `${p.clientName} · ${p.phone}` : p.phone;
  return (
    `📋 <b>Новое бронирование!</b>\n\n` +
    `🏠 <b>Комната:</b> ${p.roomName}\n` +
    `👤 <b>Клиент:</b> ${client}\n` +
    `📅 <b>Дата:</b> ${p.date}\n` +
    `🕐 <b>Время:</b> ${p.time}\n` +
    `👶 <b>Ребёнок:</b> ${p.childName}, ${p.childAge} ${w}`
  );
}

export function bookingConfirmationText(p: {
  roomName: string;
  date: string;
  time: string;
  childName: string;
  childAge: number;
  price: number;
}) {
  const w = p.childAge === 1 ? 'год' : p.childAge <= 4 ? 'года' : 'лет';
  return (
    `🎉 <b>Бронирование подтверждено!</b>\n\n` +
    `🏠 <b>Комната:</b> ${p.roomName}\n` +
    `📅 <b>Дата:</b> ${p.date}\n` +
    `🕐 <b>Время:</b> ${p.time}\n` +
    `👶 <b>Ребёнок:</b> ${p.childName}, ${p.childAge} ${w}\n` +
    `💰 <b>Стоимость:</b> ${p.price} ₽\n\n` +
    `Ждём вас! 🌟`
  );
}
