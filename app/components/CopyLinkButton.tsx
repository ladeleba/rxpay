"use client";

import { useState } from "react";

export default function CopyLinkButton({
  url,
  label = "Copy link",
}: {
  url: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("Could not copy. Please copy manually:\n" + url);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-semibold hover:bg-slate-50"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}