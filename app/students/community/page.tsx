"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  at: string;
  isMe?: boolean;
};

const SEED: ChatMessage[] = [
  {
    id: "1",
    author: "Ada",
    text: "Anyone stuck on indices for Week 1?",
    at: "10:12",
  },
  {
    id: "2",
    author: "Tunde",
    text: "Log laws section helped me a lot. Try the practice set again.",
    at: "10:14",
  },
  {
    id: "3",
    author: "You",
    text: "Thanks — I’ll rewatch Day 1 and come back.",
    at: "10:16",
    isMe: true,
  },
];

export default function StudentCommunityPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        author: "You",
        text,
        at: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: true,
      },
    ]);
    setDraft("");
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] backdrop-blur-[14px] flex-none">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-2)] hover:text-[var(--brand)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span className="font-heading font-semibold text-[12px] tracking-[0.12em] text-[var(--ink)]">
          Community
        </span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 sm:px-6 py-4 min-h-0">
        <div className="flex items-center gap-2 mb-3 flex-none">
          <div className="w-9 h-9 rounded-[10px] grid place-items-center bg-[var(--brand-soft)] text-[var(--brand)]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
              Study lounge
            </h1>
            <p className="text-[11px] text-[var(--ink-3)] font-semibold">
              Link up with other learners
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-4 space-y-3 min-h-[280px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col max-w-[85%]",
                m.isMe ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-[var(--ink-3)]">
                  {m.author}
                </span>
                <span className="text-[10px] text-[var(--ink-4)]">{m.at}</span>
              </div>
              <div
                className={cn(
                  "rounded-[12px] px-3.5 py-2 text-[13px] leading-relaxed",
                  m.isMe
                    ? "bg-[var(--brand)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line-soft)]"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="flex-none mt-3 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Say something…"
            className="flex-1 h-11 px-3.5 rounded-[10px] text-[13px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--brand)]"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            className="h-11 w-11 rounded-[10px] grid place-items-center bg-[var(--brand)] text-white disabled:opacity-50 flex-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-[10.5px] text-[var(--ink-4)] font-semibold text-center flex-none">
          Local demo chat — wire to your realtime API when ready.
        </p>
      </main>
    </div>
  );
}