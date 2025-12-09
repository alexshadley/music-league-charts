"use server";

import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import { Competitor, Submission, Vote, Round, MusicLeagueData } from "./types";

type CsvRecord = Record<string, string>;

export async function parseZipFile(
  formData: FormData
): Promise<MusicLeagueData> {
  const file = formData.get("file") as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  let competitors: Competitor[] = [];
  let submissions: Submission[] = [];
  let votes: Vote[] = [];
  let rounds: Round[] = [];

  for (const entry of entries) {
    const content = entry.getData().toString("utf8");
    const filename = entry.entryName.split("/").pop();

    if (filename === "competitors.csv") {
      const records: CsvRecord[] = parse(content, {
        columns: true,
        skip_empty_lines: true,
      });
      competitors = records.map((r) => ({
        id: r["ID"],
        name: r["Name"],
      }));
    } else if (filename === "submissions.csv") {
      const records: CsvRecord[] = parse(content, {
        columns: true,
        skip_empty_lines: true,
      });
      submissions = records.map((r) => ({
        spotifyUri: r["Spotify URI"],
        title: r["Title"],
        album: r["Album"],
        artists: r["Artist(s)"],
        submitterId: r["Submitter ID"],
        created: r["Created"],
        comment: r["Comment"],
        roundId: r["Round ID"],
      }));
    } else if (filename === "votes.csv") {
      const records: CsvRecord[] = parse(content, {
        columns: true,
        skip_empty_lines: true,
      });
      votes = records.map((r) => ({
        spotifyUri: r["Spotify URI"],
        voterId: r["Voter ID"],
        created: r["Created"],
        points: parseInt(r["Points Assigned"], 10),
        comment: r["Comment"],
        roundId: r["Round ID"],
      }));
    } else if (filename === "rounds.csv") {
      const records: CsvRecord[] = parse(content, {
        columns: true,
        skip_empty_lines: true,
      });
      rounds = records.map((r) => ({
        id: r["ID"],
        created: r["Created"],
        name: r["Name"],
        description: r["Description"],
        playlistUrl: r["Playlist URL"],
      }));
    }
  }

  return { competitors, submissions, votes, rounds };
}
