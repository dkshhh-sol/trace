"use client";

import { useEffect } from "react";
import { toast } from "@/components/ui/toast";

/**
 * After the GitHub OAuth redirect returns to the originating page, surface the
 * outcome as a toast and strip the `?github=` param from the URL without a
 * navigation (so the workspace state is preserved and the user can retry).
 */
export function GitHubReturnToast() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("github");
    if (!status) return;

    if (status === "connected") toast("GitHub connected", "success");
    else if (status === "error") toast("GitHub connection failed.", "error");
    else if (status === "unconfigured")
      toast("GitHub isn't configured on this deployment.", "error");

    params.delete("github");
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, []);

  return null;
}
