import "server-only";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { createDbClient } from "@/core/db/server";

export type DashboardData = {
  resume: { title: string; detail: string; progress: number; done: number; total: number; href: string } | null;
  score: {
    value: number;
    /** The first full test's score, when there is more than one. */
    first: number | null;
    changeSinceFirst: number | null;
    trend: number[];
    /** Which test and when, e.g. "Practice test 1, November 26". */
    latest: string;
    estimated: boolean;
    detail: string;
  } | null;
  domains: { name: string; accuracy: number | null; answered: number }[];
  next: { title: string; detail: string; href: string; primary?: boolean }[];
  mistakeCount: number;
};

const dateText = (iso: string) => new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long" }).format(new Date(iso));

/** Everything the dashboard shows for one subject, from the student's own activity. */
export async function getDashboard(subject: SubjectSlug): Promise<DashboardData> {
  const supabase = await createDbClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const empty: DashboardData = {
    resume: null,
    score: null,
    domains: SUBJECTS[subject].domains.map((name) => ({ name, accuracy: null, answered: 0 })),
    next: [],
    mistakeCount: 0,
  };
  if (!userId) return empty;

  const [attemptsRes, answersRes, mistakesRes, fullTestsRes, monthlyRes] = await Promise.all([
    supabase
      .from("attempts")
      .select("id, mode, status, scaled_score, raw_correct, started_at, finished_at, question_sets(title), attempt_modules(question_ids, submitted_at, started_at, paused_remaining_sec, modules(module_number), responses(answer, is_correct))")
      .eq("user_id", userId)
      .eq("subject", subject)
      .order("started_at", { ascending: true }),
    supabase
      .from("responses")
      .select("is_correct, questions!inner(subject, skills(domains(name)))")
      .not("is_correct", "is", null)
      .eq("questions.subject", subject)
      .limit(5000),
    supabase
      .from("question_progress")
      .select("question_id, questions!inner(subject)")
      .gt("times_wrong", 0)
      .eq("mastered", false)
      .eq("questions.subject", subject),
    supabase.from("question_sets").select("id, title").eq("kind", "full_test").eq("subject", subject).eq("published", true).order("created_at"),
    supabase.from("question_sets").select("id, title, month").eq("kind", "monthly").eq("subject", subject).eq("published", true).order("month", { ascending: false }).limit(1),
  ]);

  const attempts = attemptsRes.data ?? [];

  // Continue where you left off: the most recent unfinished test or practice.
  const open = [...attempts].reverse().find((a) => a.status === "in_progress");
  let resume: DashboardData["resume"] = null;
  if (open) {
    const running = [...open.attempt_modules].sort((a, b) => a.started_at.localeCompare(b.started_at)).find((m) => !m.submitted_at) ?? open.attempt_modules[0];
    const total = running?.question_ids.length ?? 0;
    const answered = running ? running.responses.filter((r) => (open.mode === "practice" ? r.is_correct !== null : r.answer)).length : 0;
    const title = open.question_sets?.title ?? "Your test";
    resume =
      open.mode === "practice"
        ? { title, detail: `${answered} of ${total} checked`, progress: total ? answered / total : 0, done: answered, total, href: `/practice/${open.id}` }
        : {
            title: `${title}, module ${running?.modules?.module_number ?? 1}`,
            detail:
              running?.paused_remaining_sec != null
                ? `${answered} of ${total} answered. Paused with ${Math.max(1, Math.round(running.paused_remaining_sec / 60))} minutes left.`
                : `${answered} of ${total} answered. The timer is still running.`,
            progress: total ? answered / total : 0,
            done: answered,
            total,
            href: `/test/${open.id}`,
          };
  }

  // Latest estimated score and its trend.
  const scored = attempts.filter((a) => a.mode === "timed" && a.status === "completed" && a.scaled_score !== null);
  let score: DashboardData["score"] = null;
  if (scored.length) {
    const last = scored[scored.length - 1];
    score = {
      value: last.scaled_score!,
      first: scored.length > 1 ? scored[0].scaled_score! : null,
      latest: `${last.question_sets?.title ?? "Full test"}${last.finished_at ? `, ${dateText(last.finished_at)}` : ""}`,
      estimated: ESTIMATED_SCORES,
      changeSinceFirst: scored.length > 1 ? last.scaled_score! - scored[0].scaled_score! : null,
      trend: scored.slice(-8).map((a) => a.scaled_score!),
      detail: `${last.question_sets?.title ?? "Full test"}, ${last.finished_at ? dateText(last.finished_at) : ""}.${ESTIMATED_SCORES ? " Estimated, not an official score." : ""}`,
    };
  }

  // Accuracy by area from every checked answer.
  const tally = new Map<string, { right: number; total: number }>();
  for (const r of answersRes.data ?? []) {
    const area = r.questions?.skills?.domains?.name;
    if (!area) continue;
    const t = tally.get(area) ?? { right: 0, total: 0 };
    t.total += 1;
    if (r.is_correct) t.right += 1;
    tally.set(area, t);
  }
  const domains = SUBJECTS[subject].domains.map((name) => {
    const t = tally.get(name);
    return { name, answered: t?.total ?? 0, accuracy: t && t.total ? Math.round((t.right / t.total) * 100) : null };
  });

  const mistakeCount = mistakesRes.data?.length ?? 0;

  // What to do next.
  const next: DashboardData["next"] = [];
  const takenSets = new Set(attempts.filter((a) => a.mode === "timed").map((a) => a.question_sets?.title));
  const untaken = (fullTestsRes.data ?? []).find((t) => !takenSets.has(t.title));
  if (untaken && !open) next.push({ title: untaken.title, detail: "A full timed section with a score", href: `/${subject}/full-tests`, primary: true });
  const measured = domains.filter((d) => d.accuracy !== null && d.answered >= 5);
  if (measured.length) {
    const weakest = measured.reduce((a, b) => (b.accuracy! < a.accuracy! ? b : a));
    next.push({ title: `Practice ${weakest.name}`, detail: `Your weakest area right now, ${weakest.accuracy}% correct`, href: `/${subject}/topics`, primary: next.length === 0 });
  }
  if (mistakeCount) next.push({ title: "Review mistakes", detail: `${mistakeCount} question${mistakeCount === 1 ? "" : "s"} waiting`, href: `/${subject}/mistakes` });
  const monthly = monthlyRes.data?.[0];
  if (monthly) next.push({ title: monthly.title, detail: "The latest monthly questions", href: `/${subject}/monthly` });
  if (next.length === 0) next.push({ title: "Practice by topic", detail: "Untimed sets for one skill at a time", href: `/${subject}/topics`, primary: true });

  return { resume, score, domains, next, mistakeCount };
}

export type Banner = {
  joined: string | null;
  bio: string | null;
  seconds: number;
  answered: number;
  bestScore: number | null;
  rank: number;
  students: number;
};

/** The numbers for the profile banner at the top of the dashboard (migration 0021). */
export async function getBanner(subject: SubjectSlug): Promise<Banner> {
  const empty: Banner = { joined: null, bio: null, seconds: 0, answered: 0, bestScore: null, rank: 1, students: 1 };
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("get_my_banner", { p_subject: subject });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return empty;
  const d = data as Record<string, unknown>;
  const num = (v: unknown, f: number) => (typeof v === "number" && Number.isFinite(v) ? v : f);
  return {
    joined: typeof d.joined === "string" ? d.joined : null,
    bio: typeof d.bio === "string" ? d.bio : null,
    seconds: num(d.seconds, 0),
    answered: num(d.answered, 0),
    bestScore: typeof d.bestScore === "number" ? d.bestScore : null,
    rank: num(d.rank, 1),
    students: Math.max(1, num(d.students, 1)),
  };
}
