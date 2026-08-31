/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getApiClient } from "@/src/api";
import { Song } from "@/src/types";
import { CifraResult, FolderNode } from "../types";

// ---------------------------------------------------------------------------
// Folder tree
// ---------------------------------------------------------------------------

export function buildFolderTree(
  songs: Song[],
  search: string = "",
): FolderNode[] {
  const root: FolderNode[] = [];
  const query = search.trim().toLowerCase();

  const filteredSongs = songs.filter((song) => {
    if (!query) return true;
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.content.toLowerCase().includes(query) ||
      song.path.toLowerCase().includes(query) ||
      song.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  for (const song of filteredSongs) {
    const parts = song.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (isLast) {
        currentLevel.push({
          name: part.endsWith(".pro")
            ? part.slice(0, -4)
            : part.endsWith(".chordpro")
              ? part.slice(0, -9)
              : part,
          path: song.path,
          type: "song",
          songId: song.id,
        });
      } else {
        let folder = currentLevel.find(
          (n) => n.type === "folder" && n.name === part,
        );
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            type: "folder",
            children: [],
          };
          currentLevel.push(folder);
        }
        currentLevel = folder.children!;
      }
    }
  }

  const sortTree = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortTree(node.children);
    }
  };

  sortTree(root);
  return root;
}

export function printHtmlDirectly(html: string) {
  const iframe = document.createElement("iframe");

  // Hide it completely from view
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";

  // Add the iframe to the page body
  document.body.appendChild(iframe);

  if (!iframe.contentWindow) return;

  // Write your HTML content inside the iframe
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  iframe.contentWindow.print();

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
}

export function parseCifraClubInput(
  input: string,
): { artist: string; song: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const urlObj = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );
    const parts = urlObj.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { artist: parts[0], song: parts[1] };
    }
  } catch {
    const parts = trimmed.split("/").filter(Boolean);
    if (parts.length === 2) {
      return { artist: parts[0], song: parts[1] };
    }
  }
  return null;
}

export async function getCifra(url: string): Promise<CifraResult> {
  try {
    const params = new URLSearchParams({ url });

    const client = getApiClient();
    const res = await client.request<CifraResult>(
      `/cifra?${params.toString()}`,
    );
    return res;
  } catch (error) {
    return {
      url,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "from-sky-500 to-cyan-400",
  "from-violet-500 to-purple-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-teal-400",
  "from-rose-500 to-pink-400",
  "from-indigo-500 to-blue-400",

  "from-red-500 to-rose-400",
  "from-fuchsia-500 to-pink-400",
  "from-purple-500 to-fuchsia-400",
  "from-blue-600 to-indigo-400",
  "from-cyan-500 to-blue-400",
  "from-teal-500 to-emerald-400",
  "from-green-500 to-lime-400",
  "from-lime-500 to-green-400",
  "from-yellow-500 to-amber-400",
  "from-orange-500 to-red-400",

  "from-slate-500 to-slate-400",
  "from-zinc-500 to-neutral-400",
  "from-stone-500 to-orange-300",

  "from-blue-500 to-violet-400",
  "from-indigo-500 to-purple-400",
  "from-purple-500 to-pink-400",
  "from-pink-500 to-rose-400",
  "from-red-500 to-orange-400",
  "from-orange-500 to-yellow-400",

  "from-emerald-600 to-cyan-400",
  "from-teal-600 to-sky-400",
  "from-cyan-600 to-indigo-400",
  "from-violet-600 to-fuchsia-400",
];

export function getAvatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
