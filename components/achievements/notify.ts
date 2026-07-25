import { toastRich } from "@/components/ui/toast";

export type UnlockNotice = {
  id: string;
  title: string;
  icon: string;
  category: string;
};

/**
 * Surface newly-unlocked achievements as subtle toasts (Trophy icon, title,
 * achievement name). Batches large unlock bursts into a single summary toast so
 * the user is never spammed.
 */
export function notifyUnlocks(list: UnlockNotice[]) {
  if (!list || list.length === 0) return;
  if (list.length > 3) {
    toastRich({
      icon: "Trophy",
      title: "Achievements unlocked",
      message: `${list.length} new achievements`,
      variant: "success",
    });
    return;
  }
  for (const a of list) {
    toastRich({
      icon: "Trophy",
      title: "Achievement unlocked",
      message: a.title,
      variant: "success",
    });
  }
}
