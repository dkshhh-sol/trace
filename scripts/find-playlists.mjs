// Lists playlists on Striver's channel matching topic queries, to find the
// dedicated Heaps / Strings / pattern-matching playlists.
// Run: node --env-file=.env.local scripts/find-playlists.mjs
const KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL = "UCJskGeByzRRSvmOyZOz61ig";
if (!KEY) {
  console.error("Missing YOUTUBE_API_KEY");
  process.exit(1);
}

async function api(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${endpoint} ${res.status}: ${await res.text()}`);
  return res.json();
}

const queries = ["heap", "strings", "string matching", "pattern matching KMP"];

async function main() {
  for (const q of queries) {
    const data = await api("search", {
      part: "snippet",
      type: "playlist",
      channelId: CHANNEL,
      q,
      maxResults: "5",
    });
    console.log(`\n=== query: "${q}" ===`);
    for (const it of data.items ?? []) {
      console.log(`  ${it.id?.playlistId}  |  ${it.snippet?.title}`);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
