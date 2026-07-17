// Fills remaining unmapped problems (Strings, Heaps, Advanced Strings) using
// OTHER creators, preferring CodeHelp (Babbar), excluding Apna College.
// Writes proposals to scripts/_others-map.json (does NOT modify roadmap).
// Run: node --env-file=.env.local scripts/search-others.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) { console.error("Missing YOUTUBE_API_KEY"); process.exit(1); }

const roadmap = JSON.parse(readFileSync("lib/content/striver-a2z.json", "utf8"));

const HINT = {
  "Step 5: Strings [Basic and Medium]": "string",
  "Step 11: Heaps": "heap priority queue",
  "Step 18: Strings (Advanced)": "string algorithm",
};
const BANNED = /apna\s*college/i;
const PREFERRED = /codehelp|babbar/i;

async function search(q) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "6");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("key", KEY);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    const quota = res.status === 403 && /quota/i.test(body);
    const err = new Error(`search ${res.status}`);
    err.quota = quota;
    throw err;
  }
  return res.json();
}

function pick(items) {
  const clean = items.filter((it) => !BANNED.test(it.snippet?.channelTitle || ""));
  const preferred = clean.find((it) => PREFERRED.test(it.snippet?.channelTitle || ""));
  return preferred || clean[0] || null;
}

async function main() {
  const missing = [];
  for (const step of roadmap.steps)
    for (const topic of step.topics)
      for (const p of topic.problems)
        if (!p.youtube)
          missing.push({ step: step.name, id: p.id, name: p.name });

  // resume support: keep any prior proposals
  const prior = existsSync("scripts/_others-map.json")
    ? JSON.parse(readFileSync("scripts/_others-map.json", "utf8"))
    : [];
  const done = new Set(prior.filter((x) => x.videoId).map((x) => x.id));
  const proposals = [...prior.filter((x) => x.videoId)];

  console.log(`Missing: ${missing.length}, already proposed: ${done.size}`);
  for (const m of missing) {
    if (done.has(m.id)) continue;
    const hint = HINT[m.step] || "";
    try {
      const data = await search(`${m.name} ${hint}`);
      const top = pick(data.items || []);
      proposals.push({
        ...m,
        videoId: top?.id?.videoId ?? "",
        channel: top?.snippet?.channelTitle ?? "",
        foundTitle: top?.snippet?.title ?? "(no result)",
      });
    } catch (e) {
      if (e.quota) {
        console.log(`Quota reached. Stopping; ${proposals.filter((x)=>x.videoId).length} proposals so far.`);
        break;
      }
      proposals.push({ ...m, videoId: "", channel: "", foundTitle: `ERROR: ${e.message}` });
    }
  }

  writeFileSync("scripts/_others-map.json", JSON.stringify(proposals, null, 2), "utf8");
  console.log("\nProposals:");
  for (const p of proposals)
    console.log(`  [${p.step.split(":")[0]}] "${p.name}" -> (${p.channel}) ${p.foundTitle}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
