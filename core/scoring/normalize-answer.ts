/**
 * Typed (student-produced) math answers.
 * "3/2", "1.5", "1.50" and " +1.5 " are the same answer; "2/3" only matches
 * "0.666" or "0.667" if the question lists those as accepted.
 */

/** Turn what a student typed into a number, or null if it is not a valid answer. */
export function parseAnswer(raw: string): number | null {
  const text = raw.trim().replace(/\s+/g, "").replace(/^\+/, "");
  if (text === "") return null;

  const fraction = /^(-?\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }

  if (/^-?(\d+\.?\d*|\.\d+)$/.test(text)) return Number(text);
  return null;
}

/** True when the typed answer equals any accepted answer. */
export function isAnswerCorrect(typed: string, accepted: readonly string[]): boolean {
  const value = parseAnswer(typed);
  if (value === null) return false;
  return accepted.some((answer) => {
    const target = parseAnswer(answer);
    return target !== null && Math.abs(target - value) < 1e-9;
  });
}
