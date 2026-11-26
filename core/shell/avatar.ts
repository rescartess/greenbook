import { SUPABASE_URL } from "@/core/config/supabase";

/** Public address of a profile photo in the "avatars" bucket (migration 0020). */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path.split("/").map(encodeURIComponent).join("/")}`;
}
