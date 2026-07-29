/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song, FolderNode } from './types';


// ---------------------------------------------------------------------------
// Folder tree
// ---------------------------------------------------------------------------

export function buildFolderTree(songs: Song[], search: string = ''): FolderNode[] {
  const root: FolderNode[] = [];
  const query = search.trim().toLowerCase();

  const filteredSongs = songs.filter(song => {
    if (!query) return true;
    return song.title.toLowerCase().includes(query) || 
           song.artist.toLowerCase().includes(query) || 
           song.content.toLowerCase().includes(query) || 
           song.path.toLowerCase().includes(query) || 
           song.tags.some(t => t.toLowerCase().includes(query));
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
          folder = { name: part, path: currentPath, type: 'folder', children: [] };
          currentLevel.push(folder);
        }
        currentLevel = folder.children!;
      }
    }
  }

  const sortTree = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortTree(node.children);
    }
  };

  sortTree(root);
  return root;
}

