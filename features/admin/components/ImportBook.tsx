"use client";

import { useState } from "react";
import { createBrowserDbClient } from "@/core/db/browser";
import { Button, Panel, cn } from "@/core/design/ui";
import { QUESTION_IMAGE_BUCKET } from "@/core/question";
import { setTestPublished } from "../actions";
import {
  batches,
  imageType,
  parseImportBook,
  type ImportBook as Book,
} from "../import-book";

export type TopicOption = {
  id: string;
  title: string;
  subject: string;
  collection: string;
  questions: number;
  published: boolean;
};

type Loaded = { name: string; book: Book };
type Step = { label: string; done: number; total: number };

const BATCH = 100;

/**
 * Pick one or more import files, check what's inside, then add everything with one click.
 * Pictures go straight from this browser to storage; questions go to the database in batches.
 * Running it again is safe: questions already added are skipped and pictures are replaced.
 */
export function ImportBook({ topics }: { topics: TopicOption[] }) {
  const [files, setFiles] = useState<Loaded[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [publish, setPublish] = useState(true);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [report, setReport] = useState<string[] | null>(null);

  const topicFor = (title: string, subject: string, collection: string) =>
    topics.find(
      (t) =>
        t.title === title &&
        t.subject === subject &&
        t.collection === collection,
    ) ?? null;

  const choose = async (list: FileList | null) => {
    setProblem(null);
    setReport(null);
    const loaded: Loaded[] = [];
    for (const f of Array.from(list ?? [])) {
      try {
        loaded.push({ name: f.name, book: parseImportBook(await f.text()) });
      } catch (e) {
        setProblem(
          `${f.name}: ${e instanceof Error ? e.message : "can’t be read."}`,
        );
        setFiles([]);
        return;
      }
    }
    const missing = loaded.flatMap((l) =>
      l.book.topics
        .filter((t) => !topicFor(t.topic, l.book.subject, l.book.collection))
        .map((t) => t.topic),
    );
    if (missing.length)
      setProblem(
        `These topics don’t exist yet: ${[...new Set(missing)].join(", ")}.`,
      );
    setFiles(loaded);
  };

  const run = async () => {
    setRunning(true);
    setProblem(null);
    const db = createBrowserDbClient();
    const lines: string[] = [];
    try {
      // 1. Pictures
      const images = files.flatMap((f) => Object.entries(f.book.images));
      for (const [i, [path, base64]] of images.entries()) {
        setStep({ label: "Uploading pictures", done: i, total: images.length });
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const { error } = await db.storage
          .from(QUESTION_IMAGE_BUCKET)
          .upload(path, new Blob([bytes], { type: imageType(path) }), {
            upsert: true,
            contentType: imageType(path),
          });
        if (error)
          throw new Error(`Picture ${path} didn’t upload: ${error.message}`);
      }
      if (images.length) lines.push(`${images.length} pictures uploaded.`);

      // 2. Questions, topic by topic, in batches
      const touched = new Set<string>();
      const parts = files.flatMap((f) =>
        f.book.topics.map((t) => ({
          ...t,
          subject: f.book.subject,
          collection: f.book.collection,
        })),
      );
      const total = parts.reduce((n, p) => n + p.items.length, 0);
      let sent = 0;
      for (const part of parts) {
        const topic = topicFor(part.topic, part.subject, part.collection);
        if (!topic) throw new Error(`The topic “${part.topic}” doesn’t exist.`);
        let added = 0;
        for (const batch of batches(part.items, BATCH)) {
          setStep({
            label: `Adding questions to ${part.topic}`,
            done: sent,
            total,
          });
          const { data, error } = await db.rpc("admin_import_questions", {
            p_topic_id: topic.id,
            p_items: batch,
          });
          if (error) throw new Error(`${part.topic}: ${error.message}`);
          added += Number(data ?? 0);
          sent += batch.length;
        }
        touched.add(topic.id);
        lines.push(
          `${part.topic}: ${added} added${added < part.items.length ? `, ${part.items.length - added} were already there` : ""}.`,
        );
      }

      // 3. Publish
      if (publish) {
        for (const id of touched) {
          setStep({ label: "Publishing topics", done: 0, total: touched.size });
          await setTestPublished(id, true);
        }
        lines.push("The topics are published: students can practise them now.");
      } else {
        lines.push(
          "The new questions are drafts. Publish each topic from its page when you’re ready.",
        );
      }
      setReport(lines);
      setFiles([]);
    } catch (e) {
      setProblem(
        `${e instanceof Error ? e.message : "Something went wrong."} Nothing is lost: run the import again and it continues where it stopped.`,
      );
      if (lines.length) setReport(lines);
    } finally {
      setRunning(false);
      setStep(null);
    }
  };

  const totalQuestions = files.reduce(
    (n, f) => n + f.book.topics.reduce((m, t) => m + t.items.length, 0),
    0,
  );
  const totalImages = files.reduce(
    (n, f) => n + Object.keys(f.book.images).length,
    0,
  );
  const ready =
    files.length > 0 &&
    !files.some((f) =>
      f.book.topics.some(
        (t) => !topicFor(t.topic, f.book.subject, f.book.collection),
      ),
    );

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <label className="flex flex-col gap-3">
          <span className="text-lg font-bold">Choose import files</span>
          <span className="text-[15px] text-graphite">
            Pick one or several .json files Claude prepared. Nothing is added
            until you press Import.
          </span>
          <input
            type="file"
            multiple
            disabled={running}
            onChange={(e) => void choose(e.target.files)}
            className="text-[15px] file:mr-4 file:rounded-[10px] file:border-0 file:bg-pine file:px-5 file:py-2.5 file:font-bold file:text-pine-ink"
          />
        </label>
      </Panel>

      {problem ? (
        <p
          role="alert"
          className="rounded-choice bg-incorrect-tint px-4 py-3 font-semibold text-incorrect"
        >
          {problem}
        </p>
      ) : null}

      {files.length ? (
        <Panel className="p-0">
          <div className="px-6 pb-3 pt-6">
            <h2 className="text-[17px] font-bold">
              What will be added
            </h2>
            <p className="text-[15px] text-graphite">
              {totalQuestions} questions and {totalImages} pictures. Questions
              go to the end of each topic, in the book’s order.
            </p>
          </div>
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-y border-hairline text-[13px] text-graphite">
                <th className="py-2 pl-6 font-semibold">Topic</th>
                <th className="py-2 font-semibold">From</th>
                <th className="py-2 font-semibold">Easy</th>
                <th className="py-2 font-semibold">Medium</th>
                <th className="py-2 font-semibold">Hard</th>
                <th className="py-2 pr-6 font-semibold">Now in topic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {files.flatMap((f) =>
                f.book.topics.map((t) => {
                  const topic = topicFor(
                    t.topic,
                    f.book.subject,
                    f.book.collection,
                  );
                  const n = (d: string) =>
                    t.items.filter((i) => i.difficulty === d).length;
                  return (
                    <tr key={f.name + t.topic}>
                      <td
                        className={cn(
                          "py-2.5 pl-6 font-bold",
                          !topic && "text-incorrect",
                        )}
                      >
                        {t.topic}
                      </td>
                      <td className="py-2.5 text-ink-soft">{f.book.book}</td>
                      <td className="py-2.5 tabular-nums">{n("easy")}</td>
                      <td className="py-2.5 tabular-nums">{n("medium")}</td>
                      <td className="py-2.5 tabular-nums">{n("hard")}</td>
                      <td className="py-2.5 pr-6 tabular-nums text-ink-soft">
                        {topic
                          ? `${topic.questions}${topic.published ? "" : " (hidden)"}`
                          : "Missing"}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <label className="flex items-center gap-2.5 text-[15px] font-semibold">
              <input
                type="checkbox"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
                disabled={running}
                className="h-4 w-4 accent-pine"
              />
              Publish these topics when done
            </label>
            <Button
              size="lg"
              onClick={() => void run()}
              disabled={!ready || running}
            >
              {running ? "Importing…" : `Import ${totalQuestions} questions`}
            </Button>
          </div>
        </Panel>
      ) : null}

      {step ? (
        <Panel>
          <p className="font-bold">{step.label}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-pine transition-[width]"
              style={{
                width: `${step.total ? Math.round((step.done / step.total) * 100) : 100}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[14px] text-graphite tabular-nums">
            {step.done} of {step.total}. Keep this page open.
          </p>
        </Panel>
      ) : null}

      {report ? (
        <Panel>
          <h2 className="text-[17px] font-bold">Done</h2>
          <ul className="mt-2 flex flex-col gap-1 text-[15px]">
            {report.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
