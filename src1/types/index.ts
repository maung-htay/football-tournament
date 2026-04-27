export interface Team {
  _id?: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  groupId?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  createdAt?: Date;
}

export interface Group {
  _id?: string;
  name: string;
  teams: string[];
  createdAt?: Date;
}

export interface Match {
  _id?: string;
  homeTeam: string | Team;
  awayTeam: string | Team;
  homeScore: number | null;
  awayScore: number | null;
  groupId?: string;
  round: 'group' | 'round16' | 'quarter' | 'semi' | 'final' | 'third';
  venue: string;
  matchDate: Date;
  matchTime: string;
  status: 'scheduled' | 'live' | 'completed';
  createdAt?: Date;
}

export interface Tournament {
  _id?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'registration' | 'group_stage' | 'knockout' | 'completed';
  teamsPerGroup: number;
  totalGroups: number;
}
