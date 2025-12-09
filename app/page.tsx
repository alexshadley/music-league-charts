"use client";

import { useState, useMemo } from "react";
import { parseZipFile } from "./actions";
import { computeSimilarities } from "./similarity";
import { MusicLeagueData, SimilarityPair, Competitor } from "./types";

interface CommonVote {
  spotifyUri: string;
  title: string;
  artists: string;
  pointsA: number;
  pointsB: number;
}

export default function Home() {
  const [data, setData] = useState<MusicLeagueData | null>(null);
  const [similarities, setSimilarities] = useState<SimilarityPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState<{
    userA: Competitor;
    userB: Competitor;
  } | null>(null);

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const pair of similarities) {
      map.set(`${pair.userA}-${pair.userB}`, pair.score);
      map.set(`${pair.userB}-${pair.userA}`, pair.score);
    }
    return map;
  }, [similarities]);

  const maxScore = useMemo(() => {
    return Math.max(...similarities.map((p) => p.score), 1);
  }, [similarities]);

  const commonVotes = useMemo(() => {
    if (!selectedPair || !data) return [];
    const { userA, userB } = selectedPair;
    const votesA = new Map<string, number>();
    const votesB = new Map<string, number>();
    for (const vote of data.votes) {
      if (vote.voterId === userA.id) votesA.set(vote.spotifyUri, vote.points);
      if (vote.voterId === userB.id) votesB.set(vote.spotifyUri, vote.points);
    }
    const common: CommonVote[] = [];
    for (const [uri, pointsA] of votesA) {
      const pointsB = votesB.get(uri);
      if (pointsB !== undefined) {
        const sub = data.submissions.find((s) => s.spotifyUri === uri);
        common.push({
          spotifyUri: uri,
          title: sub?.title || "Unknown",
          artists: sub?.artists || "Unknown",
          pointsA,
          pointsB,
        });
      }
    }
    return common.sort(
      (a, b) => Math.min(b.pointsA, b.pointsB) - Math.min(a.pointsA, a.pointsB)
    );
  }, [selectedPair, data]);

  function spotifyUrl(uri: string) {
    const id = uri.split(":")[2];
    return `https://open.spotify.com/track/${id}`;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const parsed = await parseZipFile(formData);
    setData(parsed);
    setSimilarities(computeSimilarities(parsed));
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-5xl font-bold tracking-tight text-amber-900">
          Music League Charts
        </h1>
        <p className="mb-8 text-amber-700 text-lg">
          Upload your Music League export to see who shares your taste
        </p>

        <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-400 p-12 transition-all hover:border-amber-600 hover:bg-amber-100">
          <input
            type="file"
            accept=".zip"
            onChange={handleUpload}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center gap-3">
            <svg
              className="h-12 w-12 text-amber-400 group-hover:text-amber-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-amber-700 group-hover:text-amber-900">
              {loading ? "Processing..." : "Drop your Music League .zip here"}
            </span>
          </div>
        </label>

        {data && (
          <div className="mt-10">
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-amber-300 p-4">
                <div className="text-3xl font-bold text-amber-800">
                  {data.competitors.length}
                </div>
                <div className="text-sm text-amber-600">Players</div>
              </div>
              <div className="rounded-xl border border-amber-300 p-4">
                <div className="text-3xl font-bold text-amber-800">
                  {data.rounds.length}
                </div>
                <div className="text-sm text-amber-600">Rounds</div>
              </div>
              <div className="rounded-xl border border-amber-300 p-4">
                <div className="text-3xl font-bold text-amber-800">
                  {data.votes.length}
                </div>
                <div className="text-sm text-amber-600">Votes</div>
              </div>
            </div>

            <h2 className="mb-4 text-2xl font-semibold text-amber-900">
              Taste Similarity
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border border-amber-700">
                <thead>
                  <tr>
                    <th className="p-2 border border-amber-700 w-40"></th>
                    {data.competitors.map((c) => (
                      <th
                        key={c.id}
                        className="p-2 text-xs font-medium text-amber-900 border border-amber-700"
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.competitors.map((rowUser, rowIdx) => (
                    <tr key={rowUser.id}>
                      <td className="p-2 text-xs font-medium text-amber-900 whitespace-nowrap border border-amber-700">
                        {rowUser.name}
                      </td>
                      {data.competitors.map((colUser, colIdx) => {
                        if (colIdx === rowIdx) {
                          return (
                            <td
                              key={colUser.id}
                              className="p-1 border border-amber-700"
                            ></td>
                          );
                        }
                        const score =
                          scoreMap.get(`${rowUser.id}-${colUser.id}`) || 0;
                        const intensity = score / maxScore;
                        const r = Math.round(220 - intensity * 186);
                        const g = Math.round(38 + intensity * 159);
                        const b = Math.round(38 + intensity * 56);
                        return (
                          <td
                            key={colUser.id}
                            className="p-1 border border-amber-700 text-center text-xs font-mono text-white font-bold cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: `rgb(${r}, ${g}, ${b})`,
                            }}
                            title={`${rowUser.name} & ${colUser.name}`}
                            onClick={() =>
                              setSelectedPair({
                                userA: rowUser,
                                userB: colUser,
                              })
                            }
                          >
                            {score}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedPair && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelectedPair(null)}
          >
            <div
              className="bg-amber-50 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-amber-900">
                  {selectedPair.userA.name} & {selectedPair.userB.name}
                </h3>
                <button
                  onClick={() => setSelectedPair(null)}
                  className="text-amber-700 hover:text-amber-900 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-amber-700 mb-4">
                {commonVotes.length} songs voted in common
              </p>
              <table className="w-full border border-amber-700">
                <thead>
                  <tr>
                    <th className="p-2 border border-amber-700 text-left text-sm text-amber-900">
                      Song
                    </th>
                    <th className="p-2 border border-amber-700 text-center text-sm text-amber-900 w-16">
                      {selectedPair.userA.name.split(" ")[0]}
                    </th>
                    <th className="p-2 border border-amber-700 text-center text-sm text-amber-900 w-16">
                      {selectedPair.userB.name.split(" ")[0]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commonVotes.map((vote) => (
                    <tr key={vote.spotifyUri} className="hover:bg-amber-100">
                      <td className="p-2 border border-amber-700">
                        <a
                          href={spotifyUrl(vote.spotifyUri)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          <div className="font-medium text-amber-900">
                            {vote.title}
                          </div>
                          <div className="text-xs text-amber-700">
                            {vote.artists}
                          </div>
                        </a>
                      </td>
                      <td className="p-2 border border-amber-700 text-center text-amber-900">
                        {vote.pointsA}
                      </td>
                      <td className="p-2 border border-amber-700 text-center text-amber-900">
                        {vote.pointsB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
