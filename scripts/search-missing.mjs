// Searches Striver's (takeUforward) channel for lectures matching the problems
// that have no video mapped yet, and writes proposals to scripts/_missing-map.json.
// Does NOT modify the roadmap. Run: node --env-file=.env.local scripts/search-missing.mjs
import { readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) {
  console.error("Missing YOUTUBE_API_KEY");
  process.exit(1);
}

const roadmap = JSON.parse(readFileSync("lib/content/striver-a2z.json", "utf8"));

async function api(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${endpoint} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function resolveChannelId() {
  const data = await api("channels", { part: "id", forHandle: "takeUforward" });
  const id = data.items?.[0]?.id;
  if (!id) throw new Error("Could not resolve takeUforward channel id");
  return id;
}

async function main() {
  const channelId = await resolveChannelId();
  console.log("channelId:", channelId);

  const missing = [];
  for (const step of roadmap.steps)
    for (const topic of step.topics)
      for (const p of topic.problems)
        if (!p.youtube)
          missing.push({ step: step.name, topic: topic.name, id: p.id, name: p.name });

  console.log(`Missing problems: ${missing.length}`);
  const proposals = [];

  for (const m of missing) {
    try {
      const data = await api("search", {
        part: "snippet",
        type: "video",
        channelId,
        q: m.name,
        maxResults: "1",
      });
      const top = data.items?.[0];
      proposals.push({
        ...m,
        videoId: top?.id?.videoId ?? "",
        foundTitle: top?.snippet?.title ?? "(no result)",
      });
    } catch (e) {
      proposals.push({ ...m, videoId: "", foundTitle: `ERROR: ${e.message}` });
    }
  }

  writeFileSync("scripts/_missing-map.json", JSON.stringify(proposals, null, 2), "utf8");
  console.log("\nProposals (problem -> found lecture):");
  for (const p of proposals) console.log(`  [${p.step.split(":")[0]}] "${p.name}" -> ${p.foundTitle}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
