export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: object) {
  const BOT_TOKEN = process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: replyMarkup }),
    });
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
    `🎩 <b>Квест:</b> ${p.roomName}\n` +
    `👤 <b>Клиент:</b> ${client}\n` +
    `📅 <b>Дата:</b> ${p.date}\n` +
    `🕐 <b>Время:</b> ${p.time}`
  );
}

export function userBookingRejectedText(p: { roomName: string; date: string; time: string }) {
  return (
    `😔 <b>Заявка отклонена</b>\n\n` +
    `🎩 <b>Квест:</b> ${p.roomName}\n` +
    `📅 <b>Дата:</b> ${p.date}\n` +
    `🕐 <b>Время:</b> ${p.time}\n\n` +
    `К сожалению, это время недоступно. Попробуйте выбрать другое.`
  );
}

export function ownerBookingNotificationText(p: {
  roomName: string;
  clientName: string;
  phone: string;
  date: string;
  time: string;
  playersCount: number;
  price: number;
  bookingId?: string;
}) {
  const client = p.clientName?.trim() ? `${p.clientName} · ${p.phone}` : p.phone;
  const text = (
    `🔔 <b>Новое бронирование!</b>\n\n` +
    `🎩 <b>Квест:</b> ${p.roomName}\n` +
    `👤 <b>Клиент:</b> ${client}\n` +
    `📅 <b>Дата:</b> ${p.date}\n` +
    `🕐 <b>Время:</b> ${p.time}\n` +
    `👥 <b>Игроков:</b> ${p.playersCount} чел\n` +
    `💰 <b>Сумма:</b> ${p.price.toLocaleString('ru-RU')} ₽`
  );

  const replyMarkup = p.bookingId ? {
    inline_keyboard: [[
      { text: '✅ Подтвердить', callback_data: `confirm:${p.bookingId}` },
      { text: '❌ Отклонить', callback_data: `reject:${p.bookingId}` },
    ]],
  } : undefined;

  return { text, replyMarkup };
}

export function bookingConfirmationText(p: {
  roomName: string;
  date: string;
  time: string;
  playersCount: number;
  price: number;
}) {
  return (
    `🎉 <b>Бронирование подтверждено!</b>\n\n` +
    `🎩 <b>Квест:</b> ${p.roomName}\n` +
    `📅 <b>Дата:</b> ${p.date}\n` +
    `🕐 <b>Время:</b> ${p.time}\n` +
    `👥 <b>Игроков:</b> ${p.playersCount} чел\n` +
    `💰 <b>Стоимость:</b> ${p.price.toLocaleString('ru-RU')} ₽\n\n` +
    `Ждём вас! 🌟`
  );
}