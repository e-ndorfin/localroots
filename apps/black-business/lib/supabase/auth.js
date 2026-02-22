import { createClient } from "./server";

/**
 * Verifies the current user is authenticated.
 * Throws an object with { status, message } if not.
 * Returns the authenticated user object.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw { status: 401, message: "Unauthorized" };
  }

  return user;
}
