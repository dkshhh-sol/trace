"use server";

import { signIn, signOut } from "./index";

/**
 * Server actions driving the auth flows. Kept in a `"use server"` module so
 * they can be invoked from forms in Server Components.
 */

/** Start the Google OAuth flow, returning to `callbackUrl` (default dashboard). */
export async function signInWithGoogle(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";
  await signIn("google", { redirectTo: callbackUrl });
}

/** Sign out and return to the public homepage (Requirements 3.3, 3.4, 3.6). */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
