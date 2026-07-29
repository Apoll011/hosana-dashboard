import * as cheerio from 'cheerio';

export interface CifraResult {
    cifraclub_url: string;
    name?: string;
    artist?: string;
    youtube_url?: string;
    cifra?: string;
    error?: string;
}

export function parseCifraClubInput(input: string): { artist: string; song: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { artist: parts[0], song: parts[1] };
    }
  } catch {
    const parts = trimmed.split('/').filter(Boolean);
    if (parts.length === 2) {
      return { artist: parts[0], song: parts[1] };
    }
  }
  return null;
}
export async function getCifra(artist: string, song: string): Promise<CifraResult> {
    try {
        // This calls the Vercel API route we created in Step 1
        const response = await fetch(`/api/cifra?artist=${artist}&song=${song}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch from our API');
        }

        const data: CifraResult = await response.json();
        return data;
    } catch (error: any) {
        return {
            cifraclub_url: `https://www.cifraclub.com.br/${artist}/${song}/`,
            error: error.message
        };
    }
}