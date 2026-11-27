const MONTH = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** "September 2025" for a month test, otherwise its title. */
export function monthName(test: { month: string | null; title: string }): string {
  return test.month ? MONTH.format(new Date(`${test.month}T00:00:00Z`)) : test.title;
}
