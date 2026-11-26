import { Btn } from "@/core/shell";
import { setTestPublished } from "../actions";

/** Publish or hide a test. When something is missing, explains what instead of offering the button. */
export function PublishTestButton({
  setId,
  published,
  problems,
}: {
  setId: string;
  published: boolean;
  problems: string[];
}) {
  if (published) {
    return (
      <form action={setTestPublished.bind(null, setId, false)}>
        <Btn type="submit" tone="quiet">
          Hide from students
        </Btn>
      </form>
    );
  }
  if (problems.length > 0) {
    return (
      <div className="max-w-md rounded-panel border border-hairline bg-paper px-5 py-4">
        <p className="text-[15px] font-bold">Not ready to publish</p>
        <ul className="mt-1.5 list-disc pl-5 text-[15px] text-ink-soft">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <form action={setTestPublished.bind(null, setId, true)}>
      <Btn type="submit">Publish to students</Btn>
    </form>
  );
}
