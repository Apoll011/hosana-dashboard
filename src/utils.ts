/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song, FolderNode } from './types';

export interface ChordSegment {
  chord?: string;
  text: string;
}

export interface ParsedLine {
  type: 'directive' | 'comment' | 'lyrics' | 'empty';
  directiveName?: string;
  directiveValue?: string;
  segments?: ChordSegment[];
  rawText: string;
}

export interface ParsedSection {
  type: 'verse' | 'chorus' | 'tab' | 'comment';
  label?: string;
  lines: ParsedLine[];
}

export interface ParsedSong {
  title: string;
  artist: string;
  key?: string;
  tempo?: string;
  songNumber?: string;
  capo?: string;
  lines: ParsedLine[];
  sections: ParsedSection[];
}

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

/**
 * Parses full ChordPro document contents into lines and aligns lyrics with inline chords.
 */
export function parseChordPro(content: string): ParsedSong {
  const result: ParsedSong = {
    title: '',
    artist: '',
    lines: [],
    sections: []
  };

  const rawLines = content.split('\n');
  
  let currentSection: ParsedSection = { type: 'verse', lines: [] };
  
  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    
    // Empty Line
    if (!trimmed) {
      const line: ParsedLine = { type: 'empty', rawText: rawLine };
      result.lines.push(line);
      currentSection.lines.push(line);
      continue;
    }

    // Directive, e.g. {title: Amazing Grace}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1).trim();
      const colonIdx = inner.indexOf(':');
      let name = inner;
      let value = '';
      if (colonIdx >= 0) {
        name = inner.slice(0, colonIdx).trim().toLowerCase();
        value = inner.slice(colonIdx + 1).trim();
      }

      // Core metadata mappings
      if (name === 'title' || name === 't') {
        result.title = value || result.title;
        result.lines.push({ type: 'directive', directiveName: 'title', directiveValue: value, rawText: rawLine });
      } else if (name === 'artist' || name === 'a') {
        result.artist = value || result.artist;
        result.lines.push({ type: 'directive', directiveName: 'artist', directiveValue: value, rawText: rawLine });
      } else if (name === 'key' || name === 'k') {
        result.key = value;
        result.lines.push({ type: 'directive', directiveName: 'key', directiveValue: value, rawText: rawLine });
      } else if (name === 'tempo') {
        result.tempo = value;
        result.lines.push({ type: 'directive', directiveName: 'tempo', directiveValue: value, rawText: rawLine });
      } else if (name === 'song_number' || name === 'number') {
        result.songNumber = value;
        result.lines.push({ type: 'directive', directiveName: 'song_number', directiveValue: value, rawText: rawLine });
      } else if (name === 'capo') {
        result.capo = value;
        result.lines.push({ type: 'directive', directiveName: 'capo', directiveValue: value, rawText: rawLine });
      } else if (name === 'start_of_chorus' || name === 'soc') {
        if (currentSection.lines.length > 0) {
          result.sections.push(currentSection);
        }
        currentSection = { type: 'chorus', label: value || 'Chorus', lines: [] };
        result.lines.push({ type: 'directive', directiveName: name, directiveValue: value, rawText: rawLine });
      } else if (name === 'end_of_chorus' || name === 'eoc') {
        result.sections.push(currentSection);
        currentSection = { type: 'verse', lines: [] };
        result.lines.push({ type: 'directive', directiveName: name, directiveValue: value, rawText: rawLine });
      } else if (name === 'comment' || name === 'c') {
        const line: ParsedLine = { type: 'comment', directiveName: 'comment', directiveValue: value, rawText: rawLine };
        result.lines.push(line);
        currentSection.lines.push(line);
        // Sometimes comments are used as section headers, so we can also set the label if it's the first line
        if (currentSection.lines.length === 1 && currentSection.type === 'verse') {
           currentSection.label = value;
        }
      } else {
        result.lines.push({ type: 'directive', directiveName: name, directiveValue: value, rawText: rawLine });
      }
      continue;
    }

    // Lyrics with chords [C]
    const segments: ChordSegment[] = [];
    let lastIndex = 0;
    const chordRegex = /\[([^\]]+)\]/g;
    let match;

    while ((match = chordRegex.exec(rawLine)) !== null) {
      const matchIndex = match.index;
      const chordText = match[1];

      // Add leading text if any
      if (matchIndex > lastIndex) {
        const textBefore = rawLine.slice(lastIndex, matchIndex);
        if (segments.length === 0) {
          segments.push({ text: textBefore });
        } else {
          segments[segments.length - 1].text = textBefore;
        }
      }

      // Add new segment with the chord
      segments.push({ chord: chordText, text: '' });
      lastIndex = chordRegex.lastIndex;
    }

    // Add trailing text if any
    if (lastIndex < rawLine.length) {
      const textAfter = rawLine.slice(lastIndex);
      if (segments.length === 0) {
        segments.push({ text: textAfter });
      } else {
        segments[segments.length - 1].text = textAfter;
      }
    }

    const line: ParsedLine = {
      type: 'lyrics',
      segments: segments.length > 0 ? segments : [{ text: rawLine }],
      rawText: rawLine
    };
    
    result.lines.push(line);
    currentSection.lines.push(line);
  }

  // Push the final section if it has any lines
  if (currentSection.lines.length > 0) {
    result.sections.push(currentSection);
  }

  // Clean up empty trailing/leading lines from sections
  result.sections = result.sections.filter(s => s.lines.some(l => l.type !== 'empty'));

  // Fallbacks if no directives were specified
  if (!result.title) {
    const titleLine = rawLines.find(l => l.trim() && !l.trim().startsWith('{'));
    result.title = titleLine ? titleLine.replace(/\[[^\]]+\]/g, '').trim() : 'Untitled Song';
  }

  return result;
}

export function buildChordProText(metadata: any, bodyText: string): string {
  let text = '';
  if (metadata.title) text += `{title: ${metadata.title}}\n`;
  if (metadata.artist) text += `{artist: ${metadata.artist}}\n`;
  if (metadata.key) text += `{key: ${metadata.key}}\n`;
  if (metadata.capo && metadata.capo !== '0') text += `{capo: ${metadata.capo}}\n`;
  if (metadata.songNumber) text += `{song_number: ${metadata.songNumber}}\n`;
  if (metadata.youtube) text += `{youtube: ${metadata.youtube}}\n`;
  if (metadata.composer) text += `{composer: ${metadata.composer}}\n`;
  if (metadata.copyright) text += `{copyright: ${metadata.copyright}}\n`;
  text += '\n';
  text += bodyText.trim();
  return text.trim();
}
