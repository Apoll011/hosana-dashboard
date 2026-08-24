const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function extractMeta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return decodeHtml(match[1].trim());
    }
  }

  return undefined;
}

function extractJsonLd(html) {
  const scripts = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  );

  if (!scripts) return undefined;

  for (const script of scripts) {
    const json = script
      .replace(/^<script[^>]*>/i, "")
      .replace(/<\/script>$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(json);

      const items = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed["@graph"])
          ? parsed["@graph"]
          : [parsed];

      for (const item of items) {
        if (
          item &&
          typeof item === "object" &&
          (item["@type"] === "MusicRecording" ||
            item["@type"] === "MusicComposition" ||
            item["@type"] === "CreativeWork")
        ) {
          return item;
        }
      }
    } catch {
      // Some websites contain invalid JSON-LD.
    }
  }

  return undefined;
}

function extractYouTubeUrl(html) {
  const patterns = [
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/vi\/([a-zA-Z0-9_-]{11})\//,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
  }

  return undefined;
}

function detectSource(url) {
  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "cifraclub.com.br" ||
    hostname.endsWith(".cifraclub.com.br")
  ) {
    return "cifraclub";
  }

  if (
    hostname === "tabs.ultimate-guitar.com" ||
    hostname.endsWith(".ultimate-guitar.com")
  ) {
    return "ultimate-guitar";
  }

  return undefined;
}

function extractTitleArtist(html, source) {
  const jsonLd = extractJsonLd(html);

  let name;
  let artist;

  if (jsonLd?.name) {
    name = jsonLd.name;
  }

  if (typeof jsonLd?.byArtist === "string") {
    artist = jsonLd.byArtist;
  } else if (jsonLd?.byArtist && typeof jsonLd.byArtist === "object") {
    artist = jsonLd.byArtist.name;
  }

  // OpenGraph fallback
  const ogTitle = extractMeta(html, "og:title");

  if (!name && ogTitle) {
    if (source === "cifraclub") {
      const match = ogTitle.match(/^(.+?)\s*-\s*Cifra Club/i);

      name = match?.[1]?.trim() ?? ogTitle;
    } else {
      const match = ogTitle.match(/^(.+?)\s*by\s+(.+?)(?:\s*[-|].*)?$/i);

      if (match) {
        name = match[1].trim();
        artist = artist ?? match[2].trim();
      } else {
        name = ogTitle;
      }
    }
  }

  // Generic <title> fallback
  if (!name) {
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

    if (title) {
      const cleanTitle = stripHtml(title);

      if (source === "cifraclub") {
        const match = cleanTitle.match(/^(.+?)\s*-\s*Cifra Club/i);
        name = match?.[1]?.trim() ?? cleanTitle;
      } else {
        const match = cleanTitle.match(/^(.+?)\s+by\s+(.+?)(?:\s*[-|].*)?$/i);

        if (match) {
          name = match[1].trim();
          artist = artist ?? match[2].trim();
        } else {
          name = cleanTitle;
        }
      }
    }
  }

  return {
    name,
    artist,
  };
}

function extractCifraClub(html) {
  const pre = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);

  if (pre?.[1]) {
    return stripHtml(pre[1]);
  }

  const cifra = html.match(
    /<div[^>]+class=["'][^"']*(?:cifra|tablatura)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  );

  return cifra?.[1] ? stripHtml(cifra[1]) : undefined;
}

function extractUltimateGuitar(html) {
  const patterns = [
    /"content"\s*:\s*"((?:\\.|[^"\\])*)"/g,
    /"tab_view"\s*:\s*"((?:\\.|[^"\\])*)"/g,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);

    if (!match?.[1]) continue;

    try {
      const content = JSON.parse(`"${match[1]}"`);

      if (content.trim()) {
        return content.trim();
      }
    } catch {
      // Continue to next strategy.
    }
  }

  return undefined;
}

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const target = requestUrl.searchParams.get("url");

  if (!target) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let url;

  try {
    url = new URL(target);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }

  const source = detectSource(url);

  if (!source) {
    return Response.json(
      {
        error:
          "Unsupported source. Supported sources: Cifra Club and Ultimate Guitar.",
      },
      { status: 400 },
    );
  }

  const result = {
    source,
    source_url: url.toString(),
  };

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page (Status ${response.status})`);
    }

    const html = await response.text();

    const metadata = extractTitleArtist(html, source);

    result.name = metadata.name;
    result.artist = metadata.artist;
    result.youtube_url = extractYouTubeUrl(html);

    if (source === "cifraclub") {
      result.cifra = extractCifraClub(html);
    } else {
      result.cifra = extractUltimateGuitar(html);
    }

    return Response.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (error) {
    result.error =
      error instanceof Error ? error.message : "Error fetching song details";

    return Response.json(result, {
      status: 502,
    });
  }
}