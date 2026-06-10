import { PricingRule } from '@/types';

// Returns 'YYYY-MM-DD' in local time (avoids UTC offset causing wrong date in UTC+3..+12)
export function localDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// slotTime — "10:00", date — "2025-07-04"
export function getSlotPrice(
  basePrice: number,
  slotTime: string,
  date: string,
  rules: PricingRule[],
): number {
  const hour = parseInt(slotTime.split(':')[0], 10);
  // T12:00 — защита от смещения часового пояса
  const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // 0=Вс..6=Сб

  const match = rules.find(r => {
    if (!r.is_active) return false;

    // days_of_week приоритетнее устаревшего day_type
    if (r.days_of_week?.length) {
      if (!r.days_of_week.includes(dayOfWeek)) return false;
    } else {
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayType   = isWeekend ? 'weekend' : 'weekday';
      if (r.day_type !== 'all' && r.day_type !== dayType) return false;
    }

    const fromH = parseInt(r.time_from.split(':')[0], 10);
    const toH   = parseInt(r.time_to.split(':')[0], 10);
    return hour >= fromH && hour < toH;
  });

  if (!match) return basePrice;
  return Math.round(basePrice * match.price_modifier);
}

export function getMinPrice(basePrice: number, rules: PricingRule[]): number {
  const discounts = rules.filter(r => r.is_active && r.price_modifier < 1);
  if (discounts.length === 0) return basePrice;
  const minModifier = Math.min(...discounts.map(r => r.price_modifier));
  return Math.round(basePrice * minModifier);
}
