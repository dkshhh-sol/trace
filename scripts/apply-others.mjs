// Applies proposals from scripts/_others-map.json (other-creator lectures) to
// the roadmap. Run: node scripts/apply-others.mjs
import { readFileSync, writeFileSync } from "node:fs";

const proposals = JSON.parse(readFileSync("scripts/_others-map.json", "utf8"));
const roadmap = JSON.parse(readFileSync("lib/content/striver-a2z.json", "utf8"));

const byId = new Map(proposals.filter((p) => p.videoId).map((p) => [p.id, p.videoId]));

let applied = 0;
for (const step of roadmap.steps)
  for (const topic of step.topics)
    for (const p of topic.problems) {
      const vid = byId.get(p.id);
      if (vid && !p.youtube) {
        p.youtube = `https://www.youtube.com/watch?v=${vid}`;
        applied++;
      }
    }

writeFileSync("lib/content/striver-a2z.json", JSON.stringify(roadmap, null, 2), "utf8");

// Report any problems still without a lecture.
let remaining = 0;
for (const step of roadmap.steps)
  for (const topic of step.topics)
    for (const p of topic.problems) if (!p.youtube) remaining++;

console.log(`Applied ${applied} other-creator lectures. Remaining unmapped: ${remaining}`);
