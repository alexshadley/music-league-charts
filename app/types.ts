export interface Competitor {
  id: string;
  name: string;
}

export interface Submission {
  spotifyUri: string;
  title: string;
  album: string;
  artists: string;
  submitterId: string;
  created: string;
  comment: string;
  roundId: string;
}

export interface Vote {
  spotifyUri: string;
  voterId: string;
  created: string;
  points: number;
  comment: string;
  roundId: string;
}

export interface Round {
  id: string;
  created: string;
  name: string;
  description: string;
  playlistUrl: string;
}

export interface MusicLeagueData {
  competitors: Competitor[];
  submissions: Submission[];
  votes: Vote[];
  rounds: Round[];
}

export interface SimilarityPair {
  userA: string;
  userB: string;
  score: number;
}
