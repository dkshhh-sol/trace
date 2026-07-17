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

import type { StriverProblem } from "./types";

export type LocatedProblem = {
  problem: StriverProblem;
  stepName: string;
  topicName: string;
  prevId: string | null;
  nextId: string | null;
};

/** Locate a problem by id within a roadmap, with step/topic context and neighbors. */
export function locateProblem(
  slug: string,
  problemId: string,
): LocatedProblem | null {
  const roadmap = getRoadmap(slug);
  if (!roadmap) return null;

  const flat: { problem: StriverProblem; stepName: string; topicName: string }[] =
    [];
  for (const step of roadmap.steps) {
    for (const topic of step.topics) {
      for (const problem of topic.problems) {
        flat.push({ problem, stepName: step.name, topicName: topic.name });
      }
    }
  }

  const idx = flat.findIndex((f) => f.problem.id === problemId);
  if (idx === -1) return null;

  return {
    problem: flat[idx].problem,
    stepName: flat[idx].stepName,
    topicName: flat[idx].topicName,
    prevId: idx > 0 ? flat[idx - 1].problem.id : null,
    nextId: idx < flat.length - 1 ? flat[idx + 1].problem.id : null,
  };
}
