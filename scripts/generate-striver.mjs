import pkg from "xlsx";
import { writeFileSync, mkdirSync } from "node:fs";
const XLSX = pkg;

const wb = XLSX.readFile("Striver_A2Z_Complete.xlsx");
const ws = wb.Sheets["Striver A2Z DSA"];
const range = XLSX.utils.decode_range(ws["!ref"]);

const text = (r, c) => ws[XLSX.utils.encode_cell({ r, c })]?.v ?? "";
const link = (r, c) => ws[XLSX.utils.encode_cell({ r, c })]?.l?.Target ?? "";

// Column indices
const COL = { num: 0, step: 1, topic: 2, problem: 3, leetcode: 4, gfg: 5, youtube: 6 };

const stepsMap = new Map();

for (let r = 1; r <= range.e.r; r++) {
  const num = text(r, COL.num);
  if (num === "") continue;
  const stepName = String(text(r, COL.step)).trim();
  const topicName = String(text(r, COL.topic)).trim();
  const problem = {
    id: String(num),
    name: String(text(r, COL.problem)).trim(),
    leetcode: link(r, COL.leetcode) || "",
    gfg: link(r, COL.gfg) || "",
    youtube: link(r, COL.youtube) || "",
  };

  if (!stepsMap.has(stepName)) stepsMap.set(stepName, new Map());
  const topics = stepsMap.get(stepName);
  if (!topics.has(topicName)) topics.set(topicName, []);
  topics.get(topicName).push(problem);
}

const steps = [...stepsMap.entries()].map(([name, topics]) => ({
  name,
  topics: [...topics.entries()].map(([tName, problems]) => ({
    name: tName,
    problems,
  })),
}));

const totalProblems = steps.reduce(
  (s, st) => s + st.topics.reduce((t, tp) => t + tp.problems.length, 0),
  0,
);

const roadmap = {
  slug: "striver-a2z",
  title: "Striver A2Z DSA",
  description:
    "The complete A2Z DSA course — from basics to advanced, step by step.",
  totalProblems,
  steps,
};

mkdirSync("lib/content", { recursive: true });
writeFileSync(
  "lib/content/striver-a2z.json",
  JSON.stringify(roadmap, null, 2),
  "utf8",
);
console.log(
  `Wrote lib/content/striver-a2z.json — ${steps.length} steps, ${totalProblems} problems.`,
);
