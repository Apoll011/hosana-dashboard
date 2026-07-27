/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song, FolderNode } from './types';

// ---------------------------------------------------------------------------
// AST types (this is the "correct" parser shape - same as the sync-server /
// core parser, kept in sync so the desktop dashboard renders identically).
// ---------------------------------------------------------------------------

export interface SegmentAST {
  chord: string;
  text: string;
}

export interface LineAST {
  type: 'lyrics' | 'comment' | 'tab' | 'empty';
  text?: string;
  segments?: SegmentAST[];
}

export interface SectionAST {
  type: 'verse' | 'chorus' | 'tab' | 'comment';
  label?: string;
  lines: LineAST[];
}

export interface SongAST {
  metadata: {
    title?: string;
    subtitle?: string;
    artist?: string;
    composer?: string;
    copyright?: string;
    album?: string;
    key?: string;
    tempo?: string;
    capo?: string;
    songNumber?: string;
    youtube?: string;
    [key: string]: string | undefined;
  };
  sections: SectionAST[];
}

// Backwards-compatible aliases so existing imports (`ParsedSong`, `ParsedLine`,
// `ParsedSection`, `ChordSegment`) elsewhere in the desktop app keep working
// without every call site needing to change its type imports.
export type ParsedSong = SongAST;
export type ParsedLine = LineAST;
export type ParsedSection = SectionAST;
export type ChordSegment = SegmentAST;

// ---------------------------------------------------------------------------
// Chord transposition
// ---------------------------------------------------------------------------

// Map notes to their numeric values
const NOTE_TO_VAL: { [key: string]: number } = {
  'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11,
  'DO': 0, 'RE': 2, 'RÉ': 2, 'MI': 4, 'FA': 5, 'FÁ': 5, 'SOL': 7, 'LA': 9, 'LÁ': 9, 'SI': 11
};

// Two outputs: sharps and flats
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Transpose a single note (e.g., "C#", "Bb") by a number of semitones
 */
export function transposeNote(note: string, semitones: number, preferFlats = false): string {
  const upper = note.toUpperCase();
  if (NOTE_TO_VAL[upper] === undefined) return note; // Return unchanged if not found

  const val = NOTE_TO_VAL[upper];
  const newVal = (val + semitones + 24) % 12;

  const targetScale = preferFlats ? FLATS : SHARPS;
  let transposed = targetScale[newVal];

  // Preserve casing of the first letter if needed (e.g. Do -> Do)
  if (note[0] === note[0].toLowerCase()) {
    transposed = transposed.toLowerCase();
  }
  return transposed;
}

/**
 * Transpose a complex chord string (e.g., "C#m7", "D/F#", "A7sus4") by a number of semitones
 */
export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;

  // Handle slash chords, e.g., D/F#
  if (chord.includes('/')) {
    return chord
      .split('/')
      .map(part => transposeChord(part.trim(), semitones))
      .join('/');
  }

  // Find the note part at the start.
  // Note can be like C#, Db, F, G, or Portuguese like Lá, Sol, Ré
  // Matches: C#, Db, C, D, Ré, Sol, etc.
  const noteRegex = /^([A-G][#b]?|Do|Ré|Mi|Fá|Sol|Lá|Si|DO|RE|RÉ|MI|FA|FÁ|SOL|LA|LÁ|SI)/;
  const match = chord.match(noteRegex);

  if (!match) return chord;

  const note = match[1];
  const suffix = chord.slice(note.length);

  // If the chord has flat notes, we might prefer flats
  const preferFlats = chord.includes('b') || chord.includes('B');
  const transposedNote = transposeNote(note, semitones, preferFlats);

  return transposedNote + suffix;
}

// ---------------------------------------------------------------------------
// Folder tree (unrelated to ChordPro parsing - kept from the previous version)
// ---------------------------------------------------------------------------

/**
 * Parses flat lists of songs into a nested directory structure for the File Explorer.
 */
export function buildFolderTree(songs: Song[], search: string = ''): FolderNode[] {
  const root: FolderNode[] = [];
  const query = search.trim().toLowerCase();

  // Filter songs based on search query
  const filteredSongs = songs.filter(song => {
    if (!query) return true;
    const matchTitle = song.title.toLowerCase().includes(query);
    const matchArtist = song.artist.toLowerCase().includes(query);
    const matchContent = song.content.toLowerCase().includes(query);
    const matchPath = song.path.toLowerCase().includes(query);
    const matchTags = song.tags.some(t => t.toLowerCase().includes(query));
    return matchTitle || matchArtist || matchContent || matchPath || matchTags;
  });

  for (const song of filteredSongs) {
    const parts = song.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (isLast) {
        currentLevel.push({
          name: part.endsWith('.pro') ? part.slice(0, -4) : part.endsWith('.chordpro') ? part.slice(0, -9) : part,
          path: song.path,
          type: 'song',
          songId: song.id
        });
      } else {
        let folder = currentLevel.find(n => n.type === 'folder' && n.name === part);
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: []
          };
          currentLevel.push(folder);
        }
        currentLevel = folder.children!;
      }
    }
  }

  // Sort: Folders first, then files alphabetically
  const sortTree = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) {
        sortTree(node.children);
      }
    }
  };

  sortTree(root);
  return root;
}

// ---------------------------------------------------------------------------
// ChordPro parsing (this is the "same code" as the correct AST parser)
// ---------------------------------------------------------------------------

/**
 * Parses a line of ChordPro lyrics with inline chords, e.g. "Este é um [C]exemplo [G]de letra."
 */
export function parseLineSegments(lineText: string): SegmentAST[] {
  const segments: SegmentAST[] = [];

  // Find all [CHORD] matches
  const regex = /\[([^\]]+)\]/g;
  let match;
  let lastIndex = 0;
  let currentChord = '';

  while ((match = regex.exec(lineText)) !== null) {
    const chord = match[1];
    const textBefore = lineText.slice(lastIndex, match.index);

    if (lastIndex === 0 && textBefore === '') {
      // First chord is at the start
      currentChord = chord;
    } else {
      // Save previous segment
      segments.push({
        chord: currentChord,
        text: textBefore
      });
      currentChord = chord;
    }
    lastIndex = regex.lastIndex;
  }

  // Push remaining text
  const remainingText = lineText.slice(lastIndex);
  segments.push({
    chord: currentChord,
    text: remainingText
  });

  return segments;
}

/**
 * Parses raw ChordPro text into our SongAST structure
 */
export function parseChordPro(content: string): SongAST {
  const lines = content.split(/\r?\n/);
  const metadata: { [key: string]: string } = {};
  const sections: SectionAST[] = [];

  let currentSection: SectionAST | null = null;
  let isTab = false;

  for (let line of lines) {
    const trimmed = line.trim();

    // Check for directives
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const directive = trimmed.slice(1, -1).trim();
      const colonIndex = directive.indexOf(':');

      let name = directive;
      let value = '';

      if (colonIndex !== -1) {
        name = directive.substring(0, colonIndex).trim().toLowerCase();
        value = directive.substring(colonIndex + 1).trim();
      } else {
        name = name.toLowerCase();
      }

      // Handle metadata directives
      if (['title', 't'].includes(name)) {
        metadata.title = value;
      } else if (['subtitle', 'st'].includes(name)) {
        metadata.subtitle = value;
      } else if (['artist', 'a'].includes(name)) {
        metadata.artist = value;
      } else if (['composer'].includes(name)) {
        metadata.composer = value;
      } else if (['copyright'].includes(name)) {
        metadata.copyright = value;
      } else if (['album'].includes(name)) {
        metadata.album = value;
      } else if (['key', 'k'].includes(name)) {
        metadata.key = value;
      } else if (['tempo'].includes(name)) {
        metadata.tempo = value;
      } else if (['capo'].includes(name)) {
        metadata.capo = value;
      } else if (['song_number', 'number'].includes(name)) {
        metadata.songNumber = value;
      } else if (['youtube', 'yt'].includes(name)) {
        metadata.youtube = value;
      } else if (name === 'comment' || name === 'c') {
        // Comment block
        if (currentSection) {
          sections.push(currentSection);
          currentSection = null;
        }
        sections.push({
          type: 'comment',
          lines: [{ type: 'comment', text: value }]
        });
      } else if (name === 'start_of_chorus' || name === 'soc') {
        // Start chorus
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: 'chorus',
          label: value || 'Refrão',
          lines: []
        };
      } else if (name === 'end_of_chorus' || name === 'eoc') {
        // End chorus
        if (currentSection && currentSection.type === 'chorus') {
          sections.push(currentSection);
          currentSection = null;
        }
      } else if (name === 'start_of_tab' || name === 'sot') {
        isTab = true;
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: 'tab',
          label: value || 'Tablatura',
          lines: []
        };
      } else if (name === 'end_of_tab' || name === 'eot') {
        isTab = false;
        if (currentSection && currentSection.type === 'tab') {
          sections.push(currentSection);
          currentSection = null;
        }
      } else if (name === 'repeat' || name === 're') {
        // Repeat instruction
        if (currentSection) {
          currentSection.lines.push({
            type: 'comment',
            text: value ? `Repetir: ${value}` : 'Repetir'
          });
        } else {
          sections.push({
            type: 'comment',
            lines: [{ type: 'comment', text: value ? `Repetir: ${value}` : 'Repetir' }]
          });
        }
      }
      continue;
    }

    // It's a lyrics or content line
    if (trimmed === '') {
      if (currentSection) {
        currentSection.lines.push({ type: 'empty' });
      }
      continue;
    }

    // Determine line type
    let lineType: 'lyrics' | 'tab' | 'comment' = 'lyrics';
    if (isTab) {
      lineType = 'tab';
    } else if (trimmed.startsWith('#')) {
      lineType = 'comment';
    }

    const parsedLine: LineAST = lineType === 'lyrics'
      ? { type: 'lyrics', segments: parseLineSegments(line) }
      : { type: lineType, text: line };

    if (!currentSection) {
      currentSection = {
        type: 'verse',
        lines: []
      };
    }
    currentSection.lines.push(parsedLine);
  }

  // Push final active section
  if (currentSection) {
    sections.push(currentSection);
  }

  // Ensure a title exists if not parsed
  if (!metadata.title) {
    metadata.title = 'Sem Título';
  }

  return { metadata, sections };
}

/**
 * Rebuilds metadata lines + raw text for save (ChordPro file generator helper)
 */
export function buildChordProText(metadata: { [key: string]: string | undefined }, bodyContent: string): string {
  const lines: string[] = [];

  if (metadata.title) lines.push(`{title: ${metadata.title}}`);
  if (metadata.subtitle) lines.push(`{subtitle: ${metadata.subtitle}}`);
  if (metadata.artist) lines.push(`{artist: ${metadata.artist}}`);
  if (metadata.key) lines.push(`{key: ${metadata.key}}`);
  if (metadata.capo) lines.push(`{capo: ${metadata.capo}}`);
  if (metadata.tempo) lines.push(`{tempo: ${metadata.tempo}}`);
  if (metadata.songNumber) lines.push(`{song_number: ${metadata.songNumber}}`);
  if (metadata.youtube) lines.push(`{youtube: ${metadata.youtube}}`);
  if (metadata.composer) lines.push(`{composer: ${metadata.composer}}`);
  if (metadata.copyright) lines.push(`{copyright: ${metadata.copyright}}`);
  if (metadata.album) lines.push(`{album: ${metadata.album}}`);

  lines.push(''); // spacing
  lines.push(bodyContent.trim());
  return lines.join('\n');
}