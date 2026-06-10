import { PricingRule } from '@/types';

// Возвращает итоговую цену для конкретного слота
// slotTime — строка вида "10:00"
// date      — строка вида "2025-07-04"
export function getSlotPrice(
  basePrice: number,
  slotTime: string,
  date: string,
  rules: PricingRule[],
): number {
  const hour = parseInt(slotTime.split(':')[0], 10);
  // Используем T12:00 чтобы не попасть в ловушку часовых поясов
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType = isWeekend ? 'weekend' : 'weekday';

  const match = rules.find(r => {
    if (!r.is_active) return false;
    if (r.day_type !== 'all' && r.day_type !== dayType) return false;
    const fromH = parseInt(r.time_from.split(':')[0], 10);
    const toH   = parseInt(r.time_to.split(':')[0], 10);
    return hour >= fromH && hour < toH;
  });

  if (!match) return basePrice;
  return Math.round(basePrice * match.price_modifier);
}

// Возвращает минимально возможную цену с учётом всех активных скидок
// Используется для "от X ₽/час" в карточке комнаты
export function getMinPrice(basePrice: number, rules: PricingRule[]): number {
  const discounts = rules.filter(r => r.is_active && r.price_modifier < 1);
  if (discounts.length === 0) return basePrice;
  const minModifier = Math.min(...discounts.map(r => r.price_modifier));
  return Math.round(basePrice * minModifier);
}
