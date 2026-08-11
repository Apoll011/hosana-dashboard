import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

export interface CifraResult {
  cifraclub_url: string;
  name?: string;
  artist?: string;
  youtube_url?: string;
  cifra?: string;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Get artist and song from the query URL
  const { artist, song } = req.query;

  if (
    !artist ||
    !song ||
    typeof artist !== "string" ||
    typeof song !== "string"
  ) {
    return res.status(400).json({ error: "Missing artist or song parameters" });
  }

  const url = `https://www.cifraclub.com.br/${artist}/${song}/`;
  const result: CifraResult = { cifraclub_url: url };

  try {
    // 2. Fetch the page (This works because it runs on Vercel's servers, bypassing browser CORS)
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page (Status ${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Title & Artist
    result.name = $("h1.t1").text().trim();
    result.artist = $("h2.t3").text().trim();

    // Extract YouTube URL
    const imgYoutubeSrc = $("div.player-placeholder img").attr("src");
    if (imgYoutubeSrc && imgYoutubeSrc.includes("/vi/")) {
      const videoId = imgYoutubeSrc.split("/vi/")[1]?.split("/")[0];
      if (videoId) {
        result.youtube_url = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    // Extract Cifra Text Sheet
    result.cifra = $("pre").text();

    // 3. Return the scraped data to your frontend
    return res.status(200).json(result);
  } catch (err: unknown) {
    result.error = (err as Error)?.message || "Error fetching song details";
    return res.status(500).json(result);
  }
}
