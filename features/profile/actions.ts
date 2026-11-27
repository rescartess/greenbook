"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/core/db/server";
import { avatarUrl } from "@/core/shell";
import { parseBio, parseColor, parseName, parseTarget, parseTestDate, type ProfileFormState } from "./schema";

async function userId() {
  const supabase = await createDbClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, id: data?.claims?.sub ?? null };
}

/** Saves the name shown in the menu and on the test screen. */
export async function saveName(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = parseName(formData.get("name"));
  if (!parsed.ok) return { ok: false, message: parsed.message };
  const { supabase, id } = await userId();
  if (!id) return { ok: false, message: "Log in again to save." };
  const { error } = await supabase.from("profiles").update({ display_name: parsed.name }).eq("id", id);
  if (error) return { ok: false, message: "It couldn’t be saved. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved" };
}

/** Saves the student's target SAT total (empty clears it). */
export async function saveTarget(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = parseTarget(formData.get("target"));
  if (!parsed.ok) return { ok: false, message: parsed.message };
  const { supabase, id } = await userId();
  if (!id) return { ok: false, message: "Log in again to save." };
  const { error } = await supabase.from("profiles").update({ target_score: parsed.target }).eq("id", id);
  if (error) return { ok: false, message: "It couldn’t be saved. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: parsed.target ? "Saved" : "Goal cleared" };
}

/** Saves the two site colors (null = RainbowPrep's own). */
export async function saveColors(main: string | null, background: string | null): Promise<ProfileFormState> {
  const m = parseColor(main);
  const b = parseColor(background);
  if (!m.ok || !b.ok) return { ok: false, message: "Pick a color from the palette." };
  const { supabase, id } = await userId();
  if (!id) return { ok: false, message: "Log in again to save." };
  const { error } = await supabase.from("profiles").update({ accent_color: m.color, background_color: b.color }).eq("id", id);
  if (error) return { ok: false, message: "It couldn’t be saved. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Colors saved" };
}

/** Saves the SAT date (empty clears it). */
export async function saveTestDate(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = parseTestDate(formData.get("testDate"));
  if (!parsed.ok) return { ok: false, message: parsed.message };
  const { supabase, id } = await userId();
  if (!id) return { ok: false, message: "Log in again to save." };
  const { error } = await supabase.from("profiles").update({ test_date: parsed.date }).eq("id", id);
  if (error) return { ok: false, message: "It couldn’t be saved. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: parsed.date ? "Saved" : "Date cleared" };
}

const MAX_PHOTO_BYTES = 500_000;

/**
 * Saves a profile photo. The browser has already cut it to a 256 px square (WebP, or JPEG from Safari), so it is small.
 * It goes into the student's own folder in the "avatars" bucket; the old photo is removed.
 */
export async function saveAvatar(formData: FormData): Promise<ProfileFormState & { url?: string }> {
  const file = formData.get("photo");
  const ext = file instanceof File ? (file.type === "image/webp" ? "webp" : file.type === "image/jpeg" ? "jpg" : null) : null;
  if (!(file instanceof File) || !ext || file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    return { ok: false, message: "Use a JPG, PNG or WebP picture." };
  }
  const { supabase, id } = await userId();
  if (!id) return { ok: false, message: "Log in again to save." };
  const { data: before } = await supabase.from("profiles").select("avatar_path").eq("id", id).maybeSingle();
  const path = `${id}/${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}.${ext}`;
  const up = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
  if (up.error) return { ok: false, message: "The photo couldn’t be uploaded. Try again." };
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", id);
  if (error) {
    await supabase.storage.from("avatars").remove([path]);
    return { ok: false, message: "The photo couldn’t be saved. Try again." };
  }
  if (before?.avatar_path) await supabase.storage.from("avatars").remove([before.avatar_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo saved", url: avatarUrl(path) ?? undefined };
}

/** Removes the profile photo; initials show again. */
export async function removeAvatar(): Promise<ProfileFormState> {
  const { supabase, id } = await userId();
  if (!id) return { ok: false, message: "Log in again to save." };
  const { data: before } = await supabase.from("profiles").select("avatar_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", id);
  if (error) return { ok: false, message: "It couldn’t be removed. Try again." };
  if (before?.avatar_path) await supabase.storage.from("avatars").remove([before.avatar_path]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo removed" };
}

/** Saves the short bio shown in the dashboard banner (empty clears it). */
export async function saveBio(text: string): Promise<ProfileFormState & { bio?: string | null }> {
  const parsed = parseBio(text);
  if (!parsed.ok) return { ok: false, message: parsed.message };
  const { supabase, id } = await userId();
  if (!id) return { ok: false, message: "Log in again to save." };
  const { error } = await supabase.from("profiles").update({ bio: parsed.bio }).eq("id", id);
  if (error) return { ok: false, message: "It couldn’t be saved. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved", bio: parsed.bio };
}
