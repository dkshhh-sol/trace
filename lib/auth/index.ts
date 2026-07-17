import NextAuth from "next-auth";

import { authConfig } from "./config";

/**
 * The single Auth.js instance for the app. `auth` verifies sessions on the
 * server, `handlers` back the route handler, and `signIn`/`signOut` drive the
 * server-action auth flows. Server-only — never import into client components.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
