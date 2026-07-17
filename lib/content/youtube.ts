export type YouTubeRef =
  | { kind: "video"; id: string }
  | { kind: "playlist"; id: string }
  | null;

/** Parse a YouTube URL into a video id or playlist id. */
export function parseYouTube(url: string): YouTubeRef {
  if (!url) return null;
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v) return { kind: "video", id: v };
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? { kind: "video", id } : null;
    }
    const list = u.searchParams.get("list");
    if (list) return { kind: "playlist", id: list };
    return null;
  } catch {
    return null;
  }
}

/** Build a privacy-friendly embed URL for the given reference. */
export function youTubeEmbedUrl(ref: YouTubeRef): string | null {
  if (!ref) return null;
  const base = "https://www.youtube-nocookie.com/embed";
  return ref.kind === "video"
    ? `${base}/${ref.id}?rel=0`
    : `${base}/videoseries?list=${ref.id}&rel=0`;
}
