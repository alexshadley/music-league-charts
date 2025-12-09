import { MusicLeagueData, SimilarityPair, Competitor } from "./types";

export function computeSimilarities(data: MusicLeagueData): SimilarityPair[] {
  const { competitors, votes } = data;

  const userVotes = new Map<string, Map<string, number>>();
  for (const vote of votes) {
    if (!userVotes.has(vote.voterId)) {
      userVotes.set(vote.voterId, new Map());
    }
    userVotes.get(vote.voterId)!.set(vote.spotifyUri, vote.points);
  }

  const pairs: SimilarityPair[] = [];
  const userIds = competitors.map((c) => c.id);

  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      const userA = userIds[i];
      const userB = userIds[j];
      let score = 0;

      const votesA = userVotes.get(userA) || new Map();
      const votesB = userVotes.get(userB) || new Map();

      const allSongs = new Set([...votesA.keys(), ...votesB.keys()]);

      for (const song of allSongs) {
        const voteA = votesA.get(song);
        const voteB = votesB.get(song);

        if (voteA !== undefined && voteB !== undefined) {
          score += Math.min(voteA, voteB);
        }
      }

      pairs.push({ userA, userB, score });
    }
  }

  return pairs.sort((a, b) => b.score - a.score);
}

export function getUserName(userId: string, competitors: Competitor[]): string {
  return competitors.find((c) => c.id === userId)?.name || userId;
}
