// Remaps Step 7 (Recursion) to the Recursion & Backtracking playlist using
// GLOBAL best-match per problem (sheet order != playlist order here).
// Run: node scripts/map-recursion.mjs
import { readFileSync, writeFileSync } from "node:fs";

const items = JSON.parse(readFileSync("scripts/_recursion-items.json", "utf8"));
const roadmap = JSON.parse(readFileSync("lib/content/striver-a2z.json", "utf8"));

const STOP = new Set([
  "the","of","a","an","in","to","and","or","for","on","with","is","it",
  "problem","problems","using","from","all","recursion","strivers","striver",
  "dsa","a2z","course","c","java","python","cpp","leetcode","approach",
]);
function norm(s) {
  return (s || "")
    .toLowerCase()
    .replace(/strivers?\s*a2z\s*dsa\s*course/g, " ")
    .replace(/\b(l|re)\s*[-]?\s*\d+\s*[.:]?/gi, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function toks(s) {
  return norm(s).split(" ").filter((t) => t.length > 1 && !STOP.has(t));
}
const vTok = items.map((i) => new Set(toks(i.title)));
function score(pt, idx) {
  const set = vTok[idx];
  if (!set || !set.size || !pt.length) return 0;
  let m = 0;
  for (const t of pt) if (set.has(t)) m++;
  return m / pt.length;
}

// Explicit overrides (by problem name) for items the fuzzy matcher misses,
// based on manual verification against the playlist order.
const OVERRIDE = {
  "Generate all binary strings": 5, // L6 Subsequences
  "Generate Parentheses": 5,
  "Print all subsequences/Power Set": 5,
  "Learn All Patterns of Subsequences (Theory)": 6, // L7 Patterns
  "Count all subsequences with sum K": 5,
  "Check if there exists a subsequence with sum K": 5,
  "N Queen": 15, // L14 N-Queens
};

const step = roadmap.steps.find((s) => s.name === "Step 7: Recursion");
const THRESHOLD = 0.4;
let lastAssigned = 0; // default to Re 1 (basics) for early unmatched problems
const out = [];
for (const topic of step.topics) {
  for (const p of topic.problems) {
    let chosen;
    if (p.name in OVERRIDE) {
      chosen = OVERRIDE[p.name];
      lastAssigned = chosen;
    } else {
      const pt = toks(p.name);
      let best = 0,
        bestIdx = -1;
      for (let i = 0; i < items.length; i++) {
        const s = score(pt, i);
        if (s > best) {
          best = s;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1 && best >= THRESHOLD) {
        chosen = bestIdx;
        lastAssigned = bestIdx;
      } else {
        chosen = lastAssigned;
      }
    }
    p.youtube = `https://www.youtube.com/watch?v=${items[chosen].videoId}`;
    out.push(`"${p.name}" -> ${items[chosen].title}`);
  }
}

writeFileSync("lib/content/striver-a2z.json", JSON.stringify(roadmap, null, 2), "utf8");
out.forEach((o) => console.log("  " + o));
