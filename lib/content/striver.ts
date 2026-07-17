import data from "./striver-a2z.json";
import type { StriverRoadmap } from "./types";

/**
 * Striver A2Z roadmap content, generated from the source sheet via
 * `scripts/generate-striver.mjs`. This is seed content for the MVP; it can be
 * migrated into Sanity later without changing the UI contract.
 */
export const striverA2Z = data as StriverRoadmap;

export const roadmaps: StriverRoadmap[] = [striverA2Z];

export function getRoadmap(slug: string): StriverRoadmap | null {
  return roadmaps.find((r) => r.slug === slug) ?? null;
}

/** Count problems in a step (for per-step progress display). */
export function stepProblemCount(step: StriverRoadmap["steps"][number]): number {
  return step.topics.reduce((n, t) => n + t.problems.length, 0);
}
