import * as cheerio from 'cheerio';

const CIFRACLUB_URL = "https://www.cifraclub.com.br/";

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
    const url = `https://www.cifraclub.com.br/${artist}/${song}/`;
    const result: CifraResult = { cifraclub_url: url };

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page (Status ${response.status})`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract Title & Artist
        result.name = $('h1.t1').text().trim();
        result.artist = $('h2.t3').text().trim();

        // Extract YouTube URL
        const imgYoutubeSrc = $('div.player-placeholder img').attr('src');
        if (imgYoutubeSrc && imgYoutubeSrc.includes('/vi/')) {
            const videoId = imgYoutubeSrc.split('/vi/')[1]?.split('/')[0];
            if (videoId) {
                result.youtube_url = `https://www.youtube.com/watch?v=${videoId}`;
            }
        }

        // Extract Cifra Text Sheet
        result.cifra = $('pre').text();

    } catch (err: any) {
        result.error = err?.message || "Error fetching song details";
    }

    return result;
}