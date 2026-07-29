import { Builder, By } from 'selenium-webdriver';
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
    const url = `${CIFRACLUB_URL}${artist}/${song}`;
    const result: CifraResult = { cifraclub_url: url };

    let driver;
    try {
        driver = await new Builder()
            .usingServer('http://selenium:4444/wd/hub')
            .forBrowser('firefox')
            .build();

        await driver.get(url);

        const cifraElement = await driver.findElement(By.className('cifra'));
        const detailsHtml = await cifraElement.getAttribute('outerHTML');
        if (!detailsHtml) throw new Error()
        const $details = cheerio.load(detailsHtml);

        result.name = $details('h1.t1').text().trim();
        result.artist = $details('h2.t3').text().trim();

        const imgYoutubeSrc = $details('div.player-placeholder img').attr('src');
        if (imgYoutubeSrc && imgYoutubeSrc.includes('/vi/')) {
            const videoId = imgYoutubeSrc.split('/vi/')[1]?.split('/')[0];
            if (videoId) {
                result.youtube_url = `https://www.youtube.com/watch?v=${videoId}`;
            }
        }

        const cifraCntElement = await driver.findElement(By.className('cifra_cnt'));
        const cifraHtml = await cifraCntElement.getAttribute('outerHTML');
        if (!cifraHtml) throw new Error('Failed to get cifra');
        const $cifra = cheerio.load(cifraHtml);

        result.cifra = $cifra('pre').text();

    } catch (err: any) {
        result.error = err.message || "Error fetching song details";
    } finally {
        if (driver) {
            await driver.quit();
        }
    }

    return result;
}