// bb-plugin-session-todos - shows the agent's todo list above the composer.
//
// The list is the thread's `pendingTodos` from bb's status API, refreshed
// every 1.5 s while the thread is busy. Clicking the header collapses it to
// one line with the current task; the choice is remembered.
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  definePluginApp,
  experimental_useSidebarThreads,
  useComposer,
  useSdk,
} from "@get-bb/plugin-sdk/app";

const KEYFRAMES = `
@keyframes bb-session-todos-spin { to { transform: rotate(360deg); } }
@keyframes bb-session-todos-breathe { 50% { opacity: 0.55; } }
`;

type TodoItem = { id: string; status: "completed" | "in_progress" | "pending"; text: string };

const COLLAPSED_KEY = "bb-session-todos:todos-collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function useAgentTodos(threadId: string): TodoItem[] {
  const sdk = useSdk();
  const { threads } = experimental_useSidebarThreads();
  const status = threads.find((t) => t.id === threadId)?.status ?? "idle";
  const [items, setItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    // Never show the previous session's list while the new one loads.
    setItems([]);
    let cancelled = false;
    const load = () => {
      sdk.status.get({ threadId }).then(
        (result) => {
          if (!cancelled) setItems((result.pendingTodos?.items ?? []) as TodoItem[]);
        },
        () => {},
      );
    };
    load();
    if (status === "idle") return () => { cancelled = true; };
    const timer = setInterval(load, 1500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sdk, threadId, status]);

  return items;
}

const glyph: CSSProperties = { width: 16, height: 16, flex: "none" };

function TodoGlyph({ status }: { status: TodoItem["status"] }) {
  if (status === "completed") {
    return (
      <svg viewBox="0 0 24 24" style={{ ...glyph, color: "var(--success, #22c55e)" }} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (status === "in_progress") {
    return (
      <svg
        viewBox="0 0 24 24"
        style={{ ...glyph, animation: "bb-session-todos-spin 1.1s linear infinite, bb-session-todos-breathe 2.2s ease-in-out infinite" }}
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      >
        <path d="M21 12a9 9 0 1 1-6.2-8.55" />
      </svg>
    );
  }
  return (
    <span style={{ ...glyph, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <i style={{ width: 13, height: 13, border: "1.5px solid var(--muted-foreground)", opacity: 0.6, borderRadius: 3, display: "block" }} />
    </span>
  );
}

function TodoBanner() {
  const { scope } = useComposer();
  const threadId = scope.kind === "thread" ? scope.threadId : "";
  const items = useAgentTodos(threadId);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  // Closing hides the block for this exact list; a new or changed list brings it back.
  const [dismissed, setDismissed] = useState("");
  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, prev ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !prev;
    });
  }, []);

  const listKey = `${threadId}:${items.map((i: TodoItem) => i.id).join(",")}`;
  if (!threadId || items.length === 0 || dismissed === listKey) return null;
  const done = items.filter((i: TodoItem) => i.status === "completed").length;
  const current = items.find((i: TodoItem) => i.status === "in_progress");

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", overflow: "hidden", fontSize: 13 }}>
      <style>{KEYFRAMES}</style>
      <div style={{ display: "flex", alignItems: "center", borderBottom: collapsed ? "none" : "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        style={{ all: "unset", boxSizing: "border-box", flex: 1, minWidth: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "8px 4px 8px 12px" }}
      >
        <span style={{ fontWeight: 600 }}>Tasks</span>
        {collapsed && current ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <TodoGlyph status="in_progress" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current.text}</span>
          </span>
        ) : (
          <span style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--muted)", overflow: "hidden" }}>
            <i style={{ display: "block", height: "100%", width: `${(done / items.length) * 100}%`, background: "var(--success, #22c55e)", borderRadius: 2, transition: "width 300ms ease" }} />
          </span>
        )}
        <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
          {done} of {items.length}
        </span>
        <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: "var(--muted-foreground)", transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setDismissed(listKey)}
        aria-label="Close task list"
        title="Close"
        style={{ all: "unset", boxSizing: "border-box", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, margin: "0 6px 0 0", borderRadius: 6, color: "var(--muted-foreground)" }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      </div>
      {!collapsed && (
        <div style={{ padding: "6px 12px 8px", display: "grid", gap: 2 }}>
          {items.map((item: TodoItem) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "3px 0" }}>
              <TodoGlyph status={item.status} />
              <span
                style={{
                  fontWeight: item.status === "in_progress" ? 600 : 400,
                  color: item.status === "completed" ? "var(--muted-foreground)" : "inherit",
                  textDecoration: item.status === "completed" ? "line-through" : "none",
                }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default definePluginApp((app) => {
  app.composer.customize({
    id: "todo-banner",
    scopes: ["thread"],
    banners: [{ id: "todos", chrome: "bare", component: TodoBanner }],
  });
});
