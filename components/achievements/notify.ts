import { toast } from "@/components/ui/toast";

export type UnlockNotice = {
  id: string;
  title: string;
  icon: string;
  category: string;
};

/**
 * Surface newly-unlocked achievements as subtle toasts. Batches large unlock
 * bursts (e.g. an existing user's first sync) into a single summary toast so
 * the user is never spammed.
 */
export function notifyUnlocks(list: UnlockNotice[]) {
  if (!list || list.length === 0) return;
  if (list.length > 3) {
    toast(`🏆 ${list.length} achievements unlocked`, "success");
    return;
  }
  for (const a of list) {
    toast(`🏆 Achievement Unlocked — ${a.title}`, "success");
  }
}
