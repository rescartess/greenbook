"use client";

import { useState, useTransition } from "react";
import { saveBio } from "../actions";
import { BIO_MAX } from "../schema";

/** The bio in the dashboard banner, with a pencil to edit it in place. */
export function BioEditor({ initial }: { initial: string | null }) {
  const [bio, setBio] = useState(initial);
  const [draft, setDraft] = useState(initial ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-start gap-3">
        <p className={bio ? "text-[16px] leading-relaxed text-ink" : "text-[15px] text-graphite"}>{bio ?? "Write something about yourself"}</p>
        <button
          type="button"
          aria-label="Edit bio"
          onClick={() => {
            setDraft(bio ?? "");
            setEditing(true);
          }}
          className="ml-auto shrink-0 rounded-[8px] p-1.5 text-pine hover:bg-pine-tint"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16.5 3.5l4 4L8 20l-5 1 1-5z" />
          </svg>
        </button>
      </div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveBio(draft);
          if (r.ok) {
            setBio(r.bio ?? null);
            setEditing(false);
            setMessage(null);
          } else setMessage(r.message);
        });
      }}
      className="grid gap-2"
    >
      <textarea
        value={draft}
        maxLength={BIO_MAX}
        rows={3}
        autoFocus
        aria-label="Bio"
        onChange={(e) => setDraft(e.target.value)}
        className="w-full resize-none rounded-[10px] border border-hairline bg-paper px-3 py-2 text-[15px] outline-none focus:border-pine"
      />
      <div className="flex items-center gap-3 text-[14px] font-semibold">
        <button type="submit" disabled={pending} className="rounded-[8px] bg-pine px-3 py-1.5 text-pine-ink disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-graphite hover:text-ink">
          Cancel
        </button>
        <span className="ml-auto text-[12px] font-normal text-graphite tabular-nums">
          {draft.length}/{BIO_MAX}
        </span>
      </div>
      {message ? <p className="text-[13px] font-semibold">{message}</p> : null}
    </form>
  );
}
