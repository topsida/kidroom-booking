const BOT_TOKEN = process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN;

export async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.warn('Telegram error:', e);
  }
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
