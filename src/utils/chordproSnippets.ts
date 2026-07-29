export const CHORDPRO_SNIPPETS = `
snippet yt
	{youtube: \${1:editing_here}}
snippet youtube
	{youtube: \${1:editing_here}}
`;

let registered = false;

export function registerChordProSnippets() {
  if (registered) return;
  // @ts-expect-error - ace global vem do bundle importado no Editor.tsx
  const aceLib = window.ace ?? require('ace-builds/src-noconflict/ace');
  const snippetManager = aceLib.require('ace/snippets').snippetManager;
  const parsed = snippetManager.parseSnippetFile(CHORDPRO_SNIPPETS);
  snippetManager.register(parsed, 'chordpro');
  registered = true;
}