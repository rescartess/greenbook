"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/core/config/supabase";
import type { Database } from "./types";

/**
 * Database client for the browser, signed in as the current user (same cookies as the server).
 * Used only where the browser must talk to Supabase directly, e.g. uploading pictures in Admin,
 * which would be too large to pass through the website's own server.
 */
export function createBrowserDbClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
