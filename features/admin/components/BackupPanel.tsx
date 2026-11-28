"use client";

import { useState } from "react";
import { strToU8, zip, type Zippable } from "fflate";
import { createBrowserDbClient } from "@/core/db/browser";
import { Panel } from "@/core/design/ui";
import { Btn } from "@/core/shell";
import { QUESTION_IMAGE_BUCKET } from "@/core/question";
import { backupReadme, planBackup, type BackupRows } from "../backup";

type Step = { label: string; done: number; total: number };
type Db = ReturnType<typeof createBrowserDbClient>;
type Table = "domains" | "skills" | "question_sets" | "modules" | "module_questions" | "questions" | "question_answers";

const PAGE = 1000;

/** Reads every row of a table, 1,000 at a time (the most the database sends in one go). */
async function readAll(db: Db, table: Table, order: string[]): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = db.from(table).select("*");
    for (const column of order) query = query.order(column);
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) throw new Error(`Couldn’t read ${table}: ${error.message}`);
    rows.push(...(data as Record<string, unknown>[]));
    if (data.length < PAGE) return rows;
  }
}

/** A picture as base64, the way import files carry it. */
async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}

/** Admin: download every question, answer, explanation and picture as one zip file. */
export function BackupPanel() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<string[] | null>(null);

  const run = async () => {
    setRunning(true);
    setProblem(null);
    setDone(null);
    try {
      const db = createBrowserDbClient();
      const tables: [Table, string[]][] = [
        ["domains", ["id"]],
        ["skills", ["id"]],
        ["question_sets", ["id"]],
        ["modules", ["id"]],
        ["module_questions", ["module_id", "position"]],
        ["questions", ["id"]],
        ["question_answers", ["question_id"]],
      ];
      const raw: Record<string, Record<string, unknown>[]> = {};
      for (const [i, [table, order]] of tables.entries()) {
        setStep({ label: "Reading questions and answers", done: i, total: tables.length });
        raw[table] = await readAll(db, table, order);
      }
      const rows = {
        sets: raw.question_sets,
        modules: raw.modules,
        links: raw.module_questions,
        questions: raw.questions,
        answers: raw.question_answers,
        skills: raw.skills,
      } as unknown as BackupRows;
      const made = new Date();
      const plan = planBackup(rows, made);

      const paths = [...new Set(plan.files.flatMap((f) => f.images))];
      const pictures = new Map<string, string>();
      for (const [i, path] of paths.entries()) {
        setStep({ label: "Copying pictures", done: i, total: paths.length });
        const { data, error } = await db.storage.from(QUESTION_IMAGE_BUCKET).download(path);
        if (error || !data) throw new Error(`Picture ${path} couldn’t be copied: ${error?.message ?? "empty"}`);
        pictures.set(path, await toBase64(data));
      }

      setStep({ label: "Packing the zip file", done: 0, total: 1 });
      const files: Zippable = {
        "README.txt": strToU8(backupReadme(plan)),
        "manifest.json": strToU8(JSON.stringify(plan.manifest, null, 2)),
        "raw.json": strToU8(JSON.stringify({ format: "quantumtest-raw-1", made: made.toISOString(), tables: raw })),
      };
      for (const f of plan.files) {
        const images = Object.fromEntries(f.images.map((p) => [p, pictures.get(p) ?? ""]));
        files[`${f.name}.json`] = strToU8(JSON.stringify({ ...f.book, images }));
      }
      const zipped = await new Promise<Uint8Array>((resolve, reject) =>
        zip(files, { level: 6 }, (error, data) => (error ? reject(error) : resolve(data))),
      );

      const name = `QuantumTest backup ${made.toISOString().slice(0, 10)}.zip`;
      const url = URL.createObjectURL(new Blob([zipped as BlobPart], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setDone([
        `${name} is in your Downloads (${(zipped.length / 1024 / 1024).toFixed(1)} MB).`,
        `${plan.manifest.questions} questions, ${plan.manifest.answers} answers and ${paths.length} pictures.`,
        "Keep a copy in your Google Drive. The README inside says how to restore it.",
      ]);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setRunning(false);
      setStep(null);
    }
  };

  return (
    <Panel className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-lg font-bold">All questions</h2>
        <p className="mt-1 text-[15px] text-graphite">
          Questions, answers, explanations, pictures, topics and full tests. Students’ data is not included.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Btn onClick={run} disabled={running} className="h-11 px-5 text-[16px]">
          {running ? "Making the backup…" : "Download backup"}
        </Btn>
        {step && (
          <span className="text-[15px] text-graphite" aria-live="polite">
            {step.label}
            {step.total > 1 ? ` ${step.done} of ${step.total}` : "…"}
          </span>
        )}
      </div>
      {problem && (
        <p role="alert" className="text-[15px] font-semibold text-incorrect">
          {problem}
        </p>
      )}
      {done && (
        <div className="space-y-1 text-[15px]" aria-live="polite">
          {done.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
    </Panel>
  );
}
