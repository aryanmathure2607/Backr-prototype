export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  tag: string;
  creator_id: string;
  registration_enabled: boolean;
  backing_enabled: boolean;
  max_backings_per_user: number;
  created_at: string;
  profiles: Profile; // Creator's profile
  is_admin_only?: boolean;
}

export interface Participant {
  event_id: string;
  user_id: string;
  created_at: string;
  profiles: Profile;
}

export interface Backing {
  id: string;
  event_id: string;
  participant_id: string;
  backer_id: string;
  created_at: string;
}

// New type for admin-managed participants
export interface ManagedParticipant {
  id: string;
  event_id: string;
  name: string;
  points: number;
}

// Type for leaderboard data
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  backer_count: number;
}

// New type for admin leaderboard
export interface AdminLeaderboardEntry {
  id: string;
  name: string;
  points: number;
}
