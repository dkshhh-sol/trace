export type StriverProblem = {
  id: string;
  name: string;
  leetcode: string;
  gfg: string;
  youtube: string;
};

export type StriverTopic = {
  name: string;
  problems: StriverProblem[];
};

export type StriverStep = {
  name: string;
  topics: StriverTopic[];
};

export type StriverRoadmap = {
  slug: string;
  title: string;
  description: string;
  totalProblems: number;
  steps: StriverStep[];
};
