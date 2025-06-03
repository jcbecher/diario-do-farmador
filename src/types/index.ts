export interface User {
  id: string;
  email: string;
  character_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface Monster {
  name: string;
  count: number;
}

export interface KilledMonster {
  name: string;
  count: number;
}

export interface LootedItem {
  name: string;
  count: number;
  quantity?: number;
  value?: number;
}

export interface Session {
  id: string;
  user_id: string;
  start_datetime: Date;
  end_datetime: Date;
  duration_minutes: number;
  raw_xp_gain: number;
  total_xp_gain: number;
  raw_xp_per_hour: number;
  total_xp_per_hour: number;
  loot_value: number;
  supplies_value: number;
  balance: number;
  damage_dealt: number;
  damage_per_hour: number;
  healing_done: number;
  healing_per_hour: number;
  killed_monsters: KilledMonster[];
  looted_items: LootedItem[];
  created_at: Date;
}

export interface SessionStats {
  total_sessions: number;
  total_duration_minutes: number;
  total_xp_gain: number;
  average_xp_per_hour: number;
  total_loot_value: number;
  total_supplies_value: number;
  total_balance: number;
  total_monsters_killed: number;
  most_killed_monsters: { name: string; count: number }[];
  most_valuable_items: LootedItem[];
} 