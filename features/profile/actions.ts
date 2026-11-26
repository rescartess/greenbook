"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/core/db/server";
import { parseName, parseTarget, type ProfileFormState } from "./schema";

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
