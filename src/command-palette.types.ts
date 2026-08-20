import React from "react";

export type ActionSection = string;

export interface CommandAction {
  id: string;
  name: string;
  subtitle?: string;
  badge?: string;
  shortcut?: string[]; // e.g., ["g", "d"] or ["c", "s"] or ["Ctrl", "k"]
  keywords?: string;
  section?: ActionSection;
  icon?: string | React.ReactElement | React.ReactNode;
  parent?: string; // ID of parent for nested actions (e.g., "search-songs-sub")
  perform?: () => void | Promise<void>;
  isLoading?: boolean;
}

export interface SongItem {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  tags?: string[];
  folderId?: string | null;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
  songCount?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  date: string | number | Date;
  notes?: string;
}
