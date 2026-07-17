// Applies vetted proposals from scripts/_missing-map.json to the roadmap,
// ONLY for the allow-listed steps whose search results were verified accurate.
// Run: node scripts/apply-missing.mjs
import { readFileSync, writeFileSync } from "node:fs";

const ALLOW = new Set(["Step 8: Bit Manipulation", "Step 17: Tries"]);

const proposals = JSON.parse(readFileSync("scripts/_missing-map.json", "utf8"));
const roadmap = JSON.parse(readFileSync("lib/content/striver-a2z.json", "utf8"));

const byId = new Map();
for (const p of proposals) {
  if (ALLOW.has(p.step) && p.videoId) byId.set(p.id, p.videoId);
}

let applied = 0;
for (const step of roadmap.steps)
  for (const topic of step.topics)
    for (const p of topic.problems) {
      const vid = byId.get(p.id);
      if (vid) {
        p.youtube = `https://www.youtube.com/watch?v=${vid}`;
        applied++;
      }
    }

writeFileSync("lib/content/striver-a2z.json", JSON.stringify(roadmap, null, 2), "utf8");
console.log(`Applied ${applied} lecture mappings (Bit Manipulation + Tries).`);
