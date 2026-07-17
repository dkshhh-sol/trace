// Fetches the Recursion & Backtracking playlist and prints items in order.
// Run: node --env-file=.env.local scripts/fetch-recursion.mjs
import { writeFileSync } from "node:fs";
const KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST = "PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9";
if (!KEY) { console.error("Missing YOUTUBE_API_KEY"); process.exit(1); }

async function main() {
  const items = [];
  let pageToken = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", PLAYLIST);
    url.searchParams.set("key", KEY);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = await res.json();
    for (const it of data.items ?? [])
      items.push({
        position: it.snippet?.position,
        title: it.snippet?.title,
        videoId: it.contentDetails?.videoId,
      });
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  items.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  writeFileSync("scripts/_recursion-items.json", JSON.stringify(items, null, 2), "utf8");
  console.log(`Fetched ${items.length} items.`);
  items.forEach((i, idx) => console.log(idx, "|", i.videoId, "|", i.title));
}
main().catch((e) => { console.error(e.message); process.exit(1); });
