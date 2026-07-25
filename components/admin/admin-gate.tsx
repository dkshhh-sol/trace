"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { adminUnlock } from "@/lib/admin/actions";

/** Second-factor password gate for the Trace Console. */
export function AdminGate() {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(false);
    try {
      const res = await adminUnlock(password);
      if (res.ok) router.refresh();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <form
        onSubmit={submit}
        className="surface w-full max-w-sm rounded-2xl p-6 text-center"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-4 text-lg font-medium text-foreground">Trace Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the console password to continue.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="Password"
          className="mt-5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {error && (
          <p className="mt-2 text-xs text-destructive">Incorrect password.</p>
        )}
        <button
          type="submit"
          disabled={pending || password.length === 0}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Unlock
        </button>
      </form>
    </div>
  );
}
