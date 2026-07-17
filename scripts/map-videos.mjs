// Order-aware, SECTION-CONSTRAINED mapping of playlist videos to sheet problems.
// The playlist is out of order vs the sheet and missing several steps, so we
// pin each step to its video range and match problems only within that range.
// Run: node scripts/map-videos.mjs
import { readFileSync, writeFileSync } from "node:fs";

const items = JSON.parse(readFileSync("scripts/_playlist-items.json", "utf8"));
const roadmap = JSON.parse(readFileSync("lib/content/striver-a2z.json", "utf8"));

// step name -> [startIdx, endIdx] inclusive in the playlist, or null if missing.
const STEP_RANGE = {
  "Step 1: Learn the Basics": [2, 12],
  "Step 2: Learn Important Sorting Techniques": [13, 15],
  "Step 3: Arrays": [16, 43],
  "Step 4: Binary Search": [44, 71],
  "Step 5: Strings [Basic and Medium]": null,
  "Step 6: Learn LinkedList": [236, 263],
  "Step 7: Recursion": [7, 11],
  "Step 8: Bit Manipulation": null,
  "Step 9: Stack and Queues": [296, 313],
  "Step 10: Sliding Window & Two Pointer": [271, 282],
  "Step 11: Heaps": null,
  "Step 12: Greedy Algorithms": [283, 295],
  "Step 13: Binary Trees": [72, 109],
  "Step 14: Binary Search Trees": [110, 124],
  "Step 15: Graphs": [125, 180],
  "Step 16: Dynamic Programming": [181, 235],
  "Step 17: Tries": null,
  "Step 18: Strings (Advanced)": null,
};

const STOP = new Set([
  "the","of","a","an","in","to","and","or","for","on","with","is","it","its",
  "problem","problems","using","from","one","video","intro","introduction",
  "course","approach","part","algorithm","code","c","java","python","cpp",
  "brute","better","optimal","multiple","approaches","playlist","strivers",
  "striver","dsa","a2z","number","array","element",
]);

function norm(s) {
  return (s || "")
    .toLowerCase()
    .replace(/strivers?\s*a2z\s*dsa\s*course/g, " ")
    .replace(/2 pointers? (and|&) sliding window playlist/g, " ")
    .replace(/stack (and|&) queue.?( playlist)?/g, " ")
    .replace(/greedy algorithms? playlist/g, " ")
    .replace(/maths playlist/g, " ")
    .replace(/\b(l|re|dp|bs|g|st)\s*[-]?\s*\d+\s*[.:]?/gi, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function toks(s) {
  return norm(s).split(" ").filter((t) => t.length > 1 && !STOP.has(t));
}

const videoToks = items.map((it) => new Set(toks(it.title)));
function score(pTok, idx) {
  const set = videoToks[idx];
  if (!set || !set.size || !pTok.length) return 0;
  let m = 0;
  for (const t of pTok) if (set.has(t)) m++;
  return m / pTok.length;
}

const THRESHOLD = 0.5;
const report = [];

for (const step of roadmap.steps) {
  const range = STEP_RANGE[step.name] ?? null;
  let direct = 0, carried = 0, unmapped = 0;

  if (!range) {
    for (const t of step.topics) for (const p of t.problems) {
      p.youtube = ""; // no lecture available in this playlist
      unmapped++;
    }
    report.push(`  ${step.name}: NO VIDEOS in playlist (${unmapped} problems unmapped)`);
    continue;
  }

  const [start, end] = range;
  let cursor = start;
  for (const t of step.topics) {
    for (const p of t.problems) {
      const pTok = toks(p.name);
      let bestIdx = -1, best = 0;
      for (let i = cursor; i <= end; i++) {
        const s = score(pTok, i);
        if (s > best) { best = s; bestIdx = i; }
      }
      if (bestIdx !== -1 && best >= THRESHOLD) {
        cursor = bestIdx; direct++;
        p.youtube = `https://www.youtube.com/watch?v=${items[bestIdx].videoId}`;
      } else {
        carried++;
        p.youtube = `https://www.youtube.com/watch?v=${items[cursor].videoId}`;
      }
    }
  }
  report.push(`  ${step.name}: ${direct} matched, ${carried} carried (videos ${start}-${end})`);
}

writeFileSync("lib/content/striver-a2z.json", JSON.stringify(roadmap, null, 2), "utf8");
console.log("Per-step result:");
report.forEach((r) => console.log(r));
