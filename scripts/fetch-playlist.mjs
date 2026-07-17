// Fetches all items of a YouTube playlist and saves them (in order) to
// scripts/_playlist-items.json. Run: node --env-file=.env.local scripts/fetch-playlist.mjs
import { writeFileSync } from "node:fs";

const KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_ID = "PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz";

if (!KEY) {
  console.error("Missing YOUTUBE_API_KEY. Add it to .env.local.");
  process.exit(1);
}

async function main() {
  const items = [];
  let pageToken = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", PLAYLIST_ID);
    url.searchParams.set("key", KEY);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube API ${res.status}: ${body}`);
    }
    const data = await res.json();
    for (const it of data.items ?? []) {
      items.push({
        position: it.snippet?.position,
        title: it.snippet?.title,
        videoId: it.contentDetails?.videoId ?? it.snippet?.resourceId?.videoId,
      });
    }
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  items.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  writeFileSync(
    "scripts/_playlist-items.json",
    JSON.stringify(items, null, 2),
    "utf8",
  );

  console.log(`Fetched ${items.length} playlist items.`);
  console.log("First 5 titles:");
  items.slice(0, 5).forEach((i) => console.log("  -", i.title));
  console.log("Last 3 titles:");
  items.slice(-3).forEach((i) => console.log("  -", i.title));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
