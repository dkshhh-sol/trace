/**
 * Content types for Sanity documents. Kept minimal for the foundation; the full
 * educational content schemas (roadmap, topic, lecture, problem) arrive with
 * their module specs.
 */

export type Announcement = {
  _id: string;
  title: string;
  publishedAt?: string;
};
