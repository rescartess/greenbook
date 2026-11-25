import { SUPABASE_URL } from "@/core/config/supabase";

/** Storage bucket for question pictures (tables and graphs). Admins upload; anyone signed in can view. */
export const QUESTION_IMAGE_BUCKET = "question-images";

/** The public web address of a question picture stored as `image_path` (e.g. "dovudprep/ii/130.webp"). */
export function questionImageUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${QUESTION_IMAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
