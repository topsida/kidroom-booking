// ─── Справочные типы для квест-румов ─────────────────────────────────────────

export type Genre      = 'хоррор' | 'детектив' | 'приключение' | 'детский' | 'VR' | 'перформанс';
export type Difficulty = 'новичок' | 'средний' | 'опытный';
export type AgeLimit   = '6+' | '12+' | '16+' | '18+';
export type IsScary    = 'нет' | 'немного' | 'хоррор';

// ─── Интерфейсы ───────────────────────────────────────────────────────────────

// Организация (квест-клуб) — одна точка на карте, несколько квестов
export interface Room {
  id: string;
  name: string;
  description: string;
  address: string;
  price_per_hour: number;
  price_per_team?: number;
  rating: number;
  photos: string[];
  working_hours_start: string;
  working_hours_end: string;
  owner_telegram_chat_id?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  quests?: Quest[];             // заполняется при select('*, quests(...)')
}

// Конкретный квест внутри организации
export interface Quest {
  id: string;
  room_id: string;
  name: string;
  description: string;
  genre?: Genre;
  difficulty?: Difficulty;
  age_limit?: AgeLimit;
  min_players?: number;
  max_players?: number;
  duration_minutes?: number;
  has_actor?: boolean;
  is_scary?: IsScary;
  price_per_team: number;
  photos: string[];
  is_active?: boolean;
  created_at: string;
  rooms?: Room;                 // заполняется при select('*, rooms(...)')
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
  quest_id?: string;
  date: string;
  time_slot: string;
  players_count: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  rooms?: Room;
  quests?: Quest;
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
