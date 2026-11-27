import { Suspense } from "react";
import { Btn, Card } from "@/core/shell";
import { cn } from "@/core/design/ui";
import { signOut } from "@/features/auth";
import { getProfile, type Profile } from "../queries";
import { AppearanceSwitch } from "./AppearanceSwitch";
import { AvatarPicker } from "./AvatarPicker";
import { ColorSettings } from "./ColorSettings";
import { NameForm, TargetForm, TestDateForm } from "./ProfileForms";

/** Profile: the student's name, goal, look of the site and account details. */
export function ProfilePage() {
  return (
    <>
      <header className="mb-7">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] sm:text-[32px]">Profile</h1>
        <p className="mt-1 text-[15px] text-graphite">Your name, goal and settings</p>
      </header>
      <Suspense fallback={<div className="h-96 rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper" />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

async function ProfileContent() {
  const profile = await getProfile();
  return <ProfileView profile={profile} signOutAction={signOut} />;
}

const weekday = (day: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

export function ProfileView({ profile, signOutAction }: { profile: Profile; signOutAction?: () => Promise<void> }) {
  const practiced = profile.week.filter((d) => d.practiced).length;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="grid gap-4">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <AvatarPicker initials={profile.initials} url={profile.avatarUrl} />
            <div className="min-w-0 text-right">
              <p className="truncate text-[17px] font-bold">{profile.name}</p>
              <p className="truncate text-[14px] text-ink-soft">{profile.email}</p>
            </div>
          </div>
          <NameForm name={profile.name} />
          <div className="grid gap-1.5 border-t border-hairline py-4">
            <p className="text-[14px] font-semibold">Email</p>
            <p className="flex h-10 items-center truncate rounded-[10px] border border-hairline bg-mist px-3 text-[15px] text-ink-soft">
              {profile.email}
            </p>
            <p className="text-[13px] text-graphite">
              You log in with this email{profile.role === "student" ? " and the invite code" : ""}. To change it, ask your teacher.
            </p>
          </div>
          <TargetForm target={profile.target} />
          <TestDateForm date={profile.testDate} today={profile.today} />
        </Card>

        <Card>
          <h2 className="text-[17px] font-bold">Your practice so far</h2>
          <dl className="mt-3.5 grid grid-cols-3 gap-4 tabular-nums">
            {[
              ["Questions answered", profile.stats.answered],
              ["Mistakes cleared", profile.stats.cleared],
              ["Full tests", profile.stats.fullTests],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col-reverse justify-end gap-1.5">
                <dt className="text-[14px] font-medium leading-snug text-ink-soft">{label}</dt>
                <dd className="text-[28px] font-bold leading-none">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[14px] font-medium text-ink-soft">
            Last 7 days: practiced on {practiced} {practiced === 1 ? "day" : "days"}
          </p>
          <ul className="mt-3 flex gap-3">
            {profile.week.map((d) => (
              <li key={d.day} className="flex flex-col items-center gap-1.5">
                <span
                  aria-label={`${weekday(d.day)}: ${d.practiced ? "practiced" : "no practice"}`}
                  className={cn("h-3.5 w-3.5 rounded-full", d.practiced ? "bg-pine" : "border-[1.5px] border-graphite/45")}
                />
                <span className="text-[12px] text-graphite">{weekday(d.day)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <h2 className="text-[17px] font-bold">Appearance</h2>
          <AppearanceSwitch />
          <ColorSettings initial={profile.colors} />
        </Card>
        <Card>
          <h2 className="text-[17px] font-bold">Account</h2>
          <dl className="mt-2 text-[15px]">
            {[
              ["Role", profile.role === "admin" ? "Admin" : "Student"],
              ["Member since", profile.memberSince ?? "Not known"],
              ["Login", profile.role === "admin" ? "Emailed link" : "Email and invite code"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-hairline py-3 first:border-t-0">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {signOutAction ? (
            <form action={signOutAction} className="mt-3">
              <Btn type="submit" tone="quiet">
                Log out
              </Btn>
            </form>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
