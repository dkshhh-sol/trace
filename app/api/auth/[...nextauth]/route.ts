import { handlers } from "@/lib/auth";

// Auth.js route handler — backs /api/auth/* including the Google callback,
// sign-in, and sign-out endpoints.
export const { GET, POST } = handlers;
