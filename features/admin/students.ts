import "server-only";
import { avatarUrl } from "@/core/shell";
import { createDbClient } from "@/core/db/server";
import { isUuid } from "./schema";

// Students area of the admin (migration 0026). Both functions refuse anyone who isn't an admin.

export type SignIn = "google" | "code" | "email";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  admin: boolean;
  joined: string;
  lastActive: string | null;
  seconds: number;
  answered: number;
  correct: number;
  finished: number;
  bestEnglish: number | null;
  bestMath: number | null;
  via: SignIn;
};

export type StudentsOverview = {
  totals: { students: number; newThisWeek: number; activeToday: number; activeWeek: number; seconds: number; answered: number };
  rows: StudentRow[];
};

type RawRow = Omit<StudentRow, "avatarUrl" | "admin"> & { avatar: string | null; role: string };

export async function listStudents(): Promise<StudentsOverview> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("admin_list_students");
  if (error) throw new Error(`Could not load students: ${error.message}`);
  const raw = data as unknown as { totals: StudentsOverview["totals"]; rows: RawRow[] };
  return {
    totals: raw.totals,
    rows: raw.rows.map(({ avatar, role, ...r }) => ({ ...r, avatarUrl: avatarUrl(avatar), admin: role === "admin" })),
  };
}

export type StudentAttempt = {
  id: string;
  title: string;
  kind: "full" | "topic" | "monthly" | "mistakes";
  subject: string;
  mode: "timed" | "practice";
  status: "in_progress" | "completed" | "abandoned";
  started: string;
  finished: string | null;
  seconds: number;
  answered: number;
  correct: number;
  total: number;
  score: number | null;
};

export type StudentDetail = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  admin: boolean;
  via: SignIn;
  bio: string | null;
  targetScore: number | null;
  testDate: string | null;
  joined: string;
  lastActive: string | null;
  seconds: number;
  answered: number;
  correct: number;
  finished: number;
  started: number;
  rank: number | null;
  students: number;
  subjects: { subject: string; seconds: number; answered: number; correct: number; best: number | null; latest: number | null; fullTests: number }[];
  days: { day: string; seconds: number }[];
  skills: { subject: string; skill: string; answered: number; correct: number; accuracy: number }[];
  attempts: StudentAttempt[];
};

export async function getStudent(id: string): Promise<StudentDetail | null> {
  if (!isUuid(id)) return null;
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("admin_get_student", { p_user: id });
  if (error) throw new Error(`Could not load the student: ${error.message}`);
  if (!data) return null;
  const { avatar, role, ...rest } = data as unknown as Omit<StudentDetail, "avatarUrl" | "admin"> & { avatar: string | null; role: string };
  return { ...rest, avatarUrl: avatarUrl(avatar), admin: role === "admin" };
}
