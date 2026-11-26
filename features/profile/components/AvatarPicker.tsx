"use client";

import { useRef, useState, useTransition } from "react";
import { removeAvatar, saveAvatar } from "../actions";

const SIZE = 256;

/** Cuts the picture to a centered square, 256 px, as WebP, in the browser (so uploads stay small). */
async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob || blob.type !== "image/webp") throw new Error("no webp");
  return blob;
}

/** The round photo at the top of the profile, with Change photo and Remove. */
export function AvatarPicker({ initials, url }: { initials: string; url: string | null }) {
  const [src, setSrc] = useState(url);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const upload = (file: File) =>
    start(async () => {
      setMessage(null);
      try {
        const blob = await toSquareWebp(file);
        const form = new FormData();
        form.append("photo", new File([blob], "photo.webp", { type: "image/webp" }));
        const r = await saveAvatar(form);
        if (r.ok && r.url) setSrc(r.url);
        setMessage(r.ok ? null : r.message);
      } catch {
        setMessage("This picture can’t be read. Try a JPG or PNG.");
      }
    });

  return (
    <div className="flex items-center gap-3.5">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist text-[20px] font-bold text-ink-soft ring-1 ring-hairline">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- small public photo
          <img src={src} alt="Your photo" width={64} height={64} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <div className="grid gap-1">
        <div className="flex flex-wrap gap-3 text-[14px] font-semibold">
          <button type="button" disabled={pending} onClick={() => input.current?.click()} className="text-pine hover:underline disabled:opacity-50">
            {pending ? "Saving…" : src ? "Change photo" : "Add photo"}
          </button>
          {src ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await removeAvatar();
                  if (r.ok) setSrc(null);
                  setMessage(r.ok ? null : r.message);
                })
              }
              className="text-graphite hover:text-ink hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          ) : null}
        </div>
        <p className="text-[13px] text-graphite">{message ?? "A square picture works best"}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
