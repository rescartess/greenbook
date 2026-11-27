import type { ReactNode } from "react";
import { cn } from "@/core/design/ui";
import { ordinal, practiceTime, topPercent } from "../banner";
import type { Banner } from "../queries";

const SCALE_MIN = 200;
const SCALE_MAX = 800;
const joinedText = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/**
 * The top of the dashboard, in the spirit of a typing-site profile (owner reference, 27 Nov 2026):
 * photo, name and latest score bar; time practicing, questions answered, best full test;
 * the bio; and a strip with the student's place among all QuantumTest students by time practicing.
 */
export function ProfileBanner({
  name,
  initials,
  avatarUrl,
  banner,
  score,
  scoreLabel = "latest",
  bio,
}: {
  name: string;
  initials: string;
  avatarUrl: string | null;
  banner: Banner;
  score: { value: number; changeSinceFirst: number | null } | null;
  /** Word next to the score bar: "latest" on your own dashboard, "best" on someone else's profile. */
  scoreLabel?: string;
  bio: ReactNode;
}) {
  const share = score ? (score.value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN) : 0;
  return (
    <div className="grid gap-4 lg:col-span-2">
      <section className="grid gap-6 rounded-[14px] bg-paper p-5 font-mono sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,0.9fr)_auto_minmax(0,1.1fr)] lg:gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist text-[24px] font-bold text-ink-soft ring-2 ring-pine/60">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- small public photo
                <img src={avatarUrl} alt="" width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[26px] leading-tight text-ink sm:text-[30px]">{name}</p>
              {banner.joined ? <p className="mt-1 text-[13px] text-graphite">Joined {joinedText(banner.joined)}</p> : null}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 text-[14px] tabular-nums">
            <span className="text-[18px] text-ink">{score ? score.value : "–"}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist" role="img" aria-label={score ? `Latest score ${score.value} of 800` : "No full test yet"}>
              <div className="h-full rounded-full bg-pine" style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }} />
            </div>
            <span className="text-graphite">
              {score ? `${scoreLabel}${score.changeSinceFirst ? ` ${score.changeSinceFirst > 0 ? "+" : ""}${score.changeSinceFirst}` : ""}/800` : "no test yet"}
            </span>
          </div>
        </div>

        <Divider />

        <dl className="grid content-center gap-4">
          <Stat label="time practicing" value={practiceTime(banner.seconds)} />
          <Stat label="questions answered" value={banner.answered.toLocaleString("en-US")} />
          <Stat label="best full test" value={banner.bestScore === null ? "–" : String(banner.bestScore)} />
        </dl>

        <Divider />

        <div className="min-w-0 self-center">
          <p className="mb-1.5 text-[13px] text-graphite">bio</p>
          {bio}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-x-10 gap-y-3 rounded-[14px] bg-paper px-5 py-5 font-mono sm:px-9">
        <p className="text-[18px] text-graphite sm:text-[20px]">All-time QuantumTest ranking</p>
        <div className="flex items-center gap-4">
          <div className="text-right text-[13px] leading-tight text-graphite">
            <p>time practicing</p>
            <p>Top {topPercent(banner.rank, banner.students)}%</p>
          </div>
          <p className="text-[36px] leading-none text-ink tabular-nums sm:text-[44px]">{ordinal(banner.rank)}</p>
          <p className="text-[13px] text-graphite tabular-nums">of {banner.students}</p>
        </div>
      </section>
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className={cn("hidden w-1.5 rounded-full bg-canvas lg:block")} />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[13px] text-graphite">{label}</dt>
      <dd className="text-[26px] leading-tight text-ink tabular-nums sm:text-[30px]">{value}</dd>
    </div>
  );
}
