// ─── Справочные типы для квест-румов ─────────────────────────────────────────

export type Genre     = 'хоррор' | 'детектив' | 'приключение' | 'детский' | 'VR' | 'перформанс';
export type Difficulty = 'новичок' | 'средний' | 'опытный';
export type AgeLimit  = '6+' | '12+' | '16+' | '18+';
export type IsScary   = 'нет' | 'немного' | 'хоррор';

// ─── Интерфейсы ───────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  name: string;
  description: string;
  address: string;
  price_per_hour: number;       // оставляем для совместимости
  price_per_team?: number;      // основная цена квеста (за команду)
  rating: number;
  photos: string[];
  working_hours_start: string;
  working_hours_end: string;
  owner_telegram_chat_id?: string;
  latitude?: number;
  longitude?: number;
  // Поля квест-рума
  genre?: Genre;
  difficulty?: Difficulty;
  age_limit?: AgeLimit;
  min_players?: number;
  max_players?: number;
  duration_minutes?: number;
  has_actor?: boolean;
  is_scary?: IsScary;
  created_at: string;
}

export interface RoomFilters {
  genre:      Genre | null;
  difficulty: Difficulty | null;
  age_limit:  AgeLimit | null;
  players:    '1-2' | '3-4' | '5+' | null;
  has_actor:  'да' | 'нет' | null;
  is_scary:   IsScary | null;
}

export interface Review {
  id: string;
  room_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  users?: { name: string };
}

export interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  date: string;
  time_slot: string;
  players_count: number;        // было: child_name + child_age
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  rooms?: Room;
}

export interface PricingRule {
  id: string;
  room_id: string;
  name: string;
  day_type: 'weekday' | 'weekend' | 'all';
  days_of_week: number[];
  time_from: string;
  time_to: string;
  price_modifier: number;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  telegram_chat_id?: string;
}
