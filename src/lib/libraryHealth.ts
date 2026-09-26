/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SongScore } from "@hosanna/chordpro";
import type { Song } from "../types";

export type ScoreMissingCriterion = SongScore["missing"][number];

export const SCORE_CRITERIA: ScoreMissingCriterion[] = [
  "errors",
  "sections",
  "chords",
  "title",
  "artist",
  "key",
  "tempo",
  "songNumber",
  "youtube",
  "duration",
];

export interface LibraryHealthIssueSong {
  id: string;
  title: string;
  artist: string;
  score: number;
}

export interface LibraryHealthCategory {
  criterion: ScoreMissingCriterion;
  songs: LibraryHealthIssueSong[];
}

export interface LibraryHealthSummary {
  /** Average song score across the library (0–100). Empty library → 100. */
  healthPercentage: number;
  songCount: number;
  issueCount: number;
  averageScore: number;
  healthyCount: number;
  categories: LibraryHealthCategory[];
}

function songScoreValue(song: Song): number {
  return song.score?.score ?? 0;
}

function songMissing(song: Song): ScoreMissingCriterion[] {
  if (!song.score) return [...SCORE_CRITERIA];
  return song.score.missing;
}

/**
 * Aggregate library quality from the existing per-song score system.
 * Reactive callers should pass the latest songs from `useAllSongs()`.
 */
export function computeLibraryHealth(songs: Song[]): LibraryHealthSummary {
  const songCount = songs.length;

  if (songCount === 0) {
    return {
      healthPercentage: 100,
      songCount: 0,
      issueCount: 0,
      averageScore: 100,
      healthyCount: 0,
      categories: [],
    };
  }

  const totalScore = songs.reduce((sum, s) => sum + songScoreValue(s), 0);
  const averageScore = totalScore / songCount;
  const healthPercentage = Math.round(averageScore);

  const byCriterion = new Map<
    ScoreMissingCriterion,
    LibraryHealthIssueSong[]
  >();

  for (const criterion of SCORE_CRITERIA) {
    byCriterion.set(criterion, []);
  }

  let issueCount = 0;
  let healthyCount = 0;

  for (const song of songs) {
    const missing = songMissing(song);
    if (missing.length === 0) {
      healthyCount += 1;
      continue;
    }
    issueCount += 1;
    const entry: LibraryHealthIssueSong = {
      id: song.id,
      title: song.title || "Untitled",
      artist: song.artist || "",
      score: songScoreValue(song),
    };
    for (const criterion of missing) {
      byCriterion.get(criterion)?.push(entry);
    }
  }

  const categories: LibraryHealthCategory[] = SCORE_CRITERIA.map(
    (criterion) => ({
      criterion,
      songs: (byCriterion.get(criterion) ?? []).sort(
        (a, b) => a.score - b.score || a.title.localeCompare(b.title),
      ),
    }),
  ).filter((c) => c.songs.length > 0);

  return {
    healthPercentage,
    songCount,
    issueCount,
    averageScore,
    healthyCount,
    categories,
  };
}
