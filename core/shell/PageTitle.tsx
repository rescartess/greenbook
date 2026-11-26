import { SubjectSegment } from "./SubjectSegment";

/** Page title and the English/Math switch, top of every logged-in page around the exam. */
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] sm:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[15px] text-graphite">{subtitle}</p> : null}
      </div>
      <SubjectSegment />
    </header>
  );
}
