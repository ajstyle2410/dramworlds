'use client';

import { ChatMessage } from "@/types";
import { formatRelative } from "@/lib/api";
import { useState } from "react";

interface ChatPanelProps {
  title: string;
  messages: ChatMessage[];
  onSend: (message: string) => Promise<void>;
  compact?: boolean;
  disabled?: boolean;
}

export function ChatPanel({
  title,
  messages,
  onSend,
  compact,
  disabled,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      await onSend(input.trim());
      setInput("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">
          Collaborate with the Arc-i-Tech delivery squad.
        </p>
      </div>
      <div
        className={`flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl bg-slate-50 p-4 ${compact ? "max-h-72" : "max-h-96"}`}
      >
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Your conversation will appear here. Drop a message to get started.
          </p>
        )}
        {messages.map((message) => {
          const isAgent = message.senderRole !== "CUSTOMER";
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isAgent ? "items-start" : "items-end"}`}
            >
              <div
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                  isAgent
                    ? "bg-white text-slate-700"
                    : "bg-indigo-600 text-white"
                }`}
              >
                <p className="font-semibold">
                  {isAgent ? message.senderName : "You"}
                </p>
                <p className="mt-1">{message.message}</p>
              </div>
              <span className="mt-1 text-xs text-slate-400">
                {formatRelative(message.sentAt)}
              </span>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={disabled || submitting}
          placeholder="Type your update or question..."
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={disabled || submitting}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
