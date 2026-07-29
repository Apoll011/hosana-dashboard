export interface SegmentAST {
  chord: string;
  text: string;
}

export interface MeasureAST {
  chords: SegmentAST[];
  endBarline: string;
}

export interface LineAST {
  type: 'lyrics' | 'comment' | 'tab' | 'empty' | 'chord-section';
  text?: string;
  segments?: SegmentAST[];
  measures?: MeasureAST[];
  startBarline?: string;
}

export interface SectionAST {
  type: 'verse' | 'chorus' | 'bridge' | 'tab' | 'comment';
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


// ---------------------------------------------------------------------------
// ChordPro parsing
// ---------------------------------------------------------------------------

export function parseLineSegments(lineText: string): SegmentAST[] {
  const segments: SegmentAST[] = [];
  const regex = /\[([^\]]+)\]/g;
  let match;
  let lastIndex = 0;
  let currentChord = '';

  while ((match = regex.exec(lineText)) !== null) {
    const chord = match[1];
    const textBefore = lineText.slice(lastIndex, match.index);

    if (lastIndex === 0 && textBefore === '') {
      currentChord = chord;
    } else {
      segments.push({ chord: currentChord, text: textBefore });
      currentChord = chord;
    }
    lastIndex = regex.lastIndex;
  }

  const remainingText = lineText.slice(lastIndex);
  segments.push({ chord: currentChord, text: remainingText });

  return segments;
}

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

      // Parsing robust structure tags + metadata 
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
      } else if (name === 'start_of_chorus' || name === 'soc') {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'chorus', label: value || 'Refrão', lines: [] };
      } else if (name === 'end_of_chorus' || name === 'eoc') {
        if (currentSection && currentSection.type === 'chorus') {
          sections.push(currentSection);
          currentSection = null;
        }
      } else if (name === 'start_of_verse' || name === 'sov') {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'verse', label: value || 'Verso', lines: [] };
      } else if (name === 'end_of_verse' || name === 'eov') {
        if (currentSection && currentSection.type === 'verse') {
          sections.push(currentSection);
          currentSection = null;
        }
      } else if (name === 'start_of_bridge' || name === 'sob') {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'bridge', label: value || 'Ponte', lines: [] };
      } else if (name === 'end_of_bridge' || name === 'eob') {
        if (currentSection && currentSection.type === 'bridge') {
          sections.push(currentSection);
          currentSection = null;
        }
      } else if (name === 'verse' || name === 'v') {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'verse', label: value || 'Verso', lines: [] };
      } else if (name === 'chorus' || name === 'ch') {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'chorus', label: value || 'Refrão', lines: [] };
      } else if (name === 'bridge' || name === 'b') {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'bridge', label: value || 'Ponte', lines: [] };
      } else if (name === 'comment' || name === 'c' || name === 'ci' || name === 'cb') {
        if (currentSection) {
          sections.push(currentSection);
          currentSection = null;
        }
        sections.push({ type: 'comment', lines: [{ type: 'comment', text: value }] });
      } else if (name === 'start_of_tab' || name === 'sot') {
        isTab = true;
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'tab', label: value || 'Tablatura', lines: [] };
      } else if (name === 'end_of_tab' || name === 'eot') {
        isTab = false;
        if (currentSection && currentSection.type === 'tab') {
          sections.push(currentSection);
          currentSection = null;
        }
      } else if (name === 'repeat' || name === 're') {
        const payload = { type: 'comment' as const, text: value ? `Repetir: ${value}` : 'Repetir' };
        if (currentSection) {
          currentSection.lines.push(payload);
        } else {
          sections.push({ type: 'comment', lines: [payload] });
        }
      }
      continue;
    }

    if (trimmed === '') {
      if (currentSection) currentSection.lines.push({ type: 'empty' });
      continue;
    }

    // Determine line type & pre-parse segments
    let lineType: LineAST['type'] = 'lyrics';
    let parsedSegments: SegmentAST[] = [];

    if (isTab) {
      lineType = 'tab';
    } else if (trimmed.startsWith('#')) {
      lineType = 'comment';
    } else {
      parsedSegments = parseLineSegments(line);
      const textContent = parsedSegments.map(s => s.text).join('');
      // Checks for typical chord section formats composed merely of structural notation markers
      const onlyBarsAndSpaces = /^[\s|:\-]*$/.test(textContent);
      const hasBars = textContent.includes('|');
      
      if (onlyBarsAndSpaces && hasBars) {
         lineType = 'chord-section';
      }
    }

    const parsedLine: LineAST = { type: lineType };

    if (lineType === 'tab' || lineType === 'comment') {
      parsedLine.text = line;
    } else if (lineType === 'lyrics') {
      parsedLine.segments = parsedSegments;
    } else if (lineType === 'chord-section') {
      parsedLine.segments = parsedSegments; 
      
      // Organize chord segments into structural measure bins dynamically based on barlines
      const measures: MeasureAST[] = [];
      let currentChords: SegmentAST[] = [];
      let startBarline = '';
      let hasSeenChord = false;
      let startBarlineFound = false;

      for (let i = 0; i < parsedSegments.length; i++) {
        const seg = parsedSegments[i];
        
        if (seg.chord) {
          currentChords.push({ chord: seg.chord, text: '' });
          hasSeenChord = true;
        }

        const barlineMatches = seg.text.match(/\|\||:\||\|:|\|/g);
        if (barlineMatches) {
          for (let j = 0; j < barlineMatches.length; j++) {
            const b = barlineMatches[j];
            
            // Register start vs terminating structure constraints sequentially 
            if (!hasSeenChord && !startBarlineFound) {
              startBarline = b;
              startBarlineFound = true;
            } else {
              measures.push({ chords: currentChords, endBarline: b });
              currentChords = [];
            }
          }
        }
      }

      // Handle unclosed lingering constraints
      if (currentChords.length > 0) {
        measures.push({ chords: currentChords, endBarline: '' });
      }

      parsedLine.measures = measures;
      parsedLine.startBarline = startBarline;
    }

    if (!currentSection) {
      currentSection = { type: 'verse', lines: [] };
    }
    currentSection.lines.push(parsedLine);
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  if (!metadata.title) {
    metadata.title = 'Sem Título';
  }

  return { metadata, sections };
}

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

  lines.push(''); 
  lines.push(bodyContent.trim());
  return lines.join('\n');
}