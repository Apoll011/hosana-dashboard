import { Folder, Service, Song } from "../types";
import { getApiClient } from "./http";

export const backupApi = {
  downloadBackup: async (): Promise<void> => {
    const backup = await getApiClient().request<{
      version: string;
      exportedAt: string;
      folders: Folder[];
      songs: Song[];
      services: Service[];
    }>("/backup");

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `hosanna_backup_${new Date().toISOString().split("T")[0]}.hosanna`;

    a.click();
    URL.revokeObjectURL(url);
  },

  restoreBackup: async (
    backupData: unknown,
  ): Promise<{ message: string; counts: Record<string, number> }> => {
    return getApiClient().request<{
      message: string;
      counts: Record<string, number>;
    }>("/backup/restore", {
      method: "POST",
      body: JSON.stringify(backupData),
    });
  },
};
