export interface Room {
  id: string;
  name: string;
  description: string;
  address: string;
  price_per_hour: number;
  rating: number;
  photos: string[];
  working_hours_start: string;
  working_hours_end: string;
  owner_telegram_chat_id?: string;
  created_at: string;
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
  child_name: string;
  child_age: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  rooms?: Room;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  telegram_chat_id?: string;
}
