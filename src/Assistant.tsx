import React, { useEffect, useRef, useState } from 'react';
import { Bot, Crosshair, Loader2, MessageSquare, Send, X } from 'lucide-react';
import { api } from './api';
import type { AskRequest, ChatMessage, Project } from './types';

const SUGGESTIONS = [
  'Which projects have the biggest hidden delays?',
  'Which sector needs intervention first, and why?',
  'Summarise the top 5 risks for a ministry review meeting',
  'Which projects are spending ahead of physical progress?',
];

/** Minimal markdown: **bold**, "- " bullets, and [PROJECT-ID] links that open the project drawer. */
const Rich: React.FC<{ text: string; byId: Map<string, Project>; onOpen: (p: Project) => void }> = ({ text, byId, onOpen }) => {
  const inline = (line: string, key: number) =>
    line.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={`${key}-${i}`}>{inline(part.slice(2, -2), i)}</strong>;
      const id = part.match(/^\[([^\]]+)\]$/)?.[1];
      const p = id && byId.get(id);
      if (p) {
        return (
          <button key={`${key}-${i}`} onClick={() => onOpen(p)} title={p.name}
            className="mx-0.5 rounded bg-brand-soft px-1 py-px font-mono text-[11px] font-semibold text-brand-dark hover:bg-brand hover:text-white">
            {id}
          </button>
        );
      }
      return <React.Fragment key={`${key}-${i}`}>{part}</React.Fragment>;
    });

  return (
    <div className="space-y-1.5">
      {text.split('\n').map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return null;
        const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
        if (bullet) return <div key={i} className="flex gap-2 pl-1"><span className="text-ink-3">•</span><div>{inline(bullet[1], i)}</div></div>;
        const heading = line.match(/^#{1,4}\s+(.*)$/);
        if (heading) return <div key={i} className="pt-1 font-semibold">{inline(heading[1], i)}</div>;
        return <p key={i}>{inline(line, i)}</p>;
      })}
    </div>
  );
};

const PROJECT_SUGGESTIONS = [
  'Why is this project high risk?',
  'What should the ministry do first?',
  'Is the agency under-reporting the delay?',
];

export const Assistant: React.FC<{
  datasetId: string;
  projects: Project[];
  onOpenProject: (p: Project) => void;
  request?: AskRequest | null;
}> = ({ datasetId, projects, onOpenProject, request }) => {
  const [open, setOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const byId = React.useMemo(() => new Map(projects.map(p => [p.project_id, p])), [projects]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const ask = async (question: string, focus = focusId) => {
    const q = question.trim();
    if (!q || busy) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const reply = await api.chat(datasetId, next.map(({ role, content }) => ({ role, content })), focus);
      setMessages([...next, { role: 'assistant', ...reply }]);
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: `Sorry, something went wrong: ${(e as Error).message}`, source: 'rules' }]);
    } finally {
      setBusy(false);
    }
  };

  // "Ask AI about this project" from the drawer: open, focus the project and ask.
  useEffect(() => {
    if (!request) return;
    setOpen(true);
    setFocusId(request.projectId);
    ask(request.text, request.projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);

  const focused = focusId ? byId.get(focusId) : undefined;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-dark">
        <MessageSquare className="h-4 w-4" /> Ask ProgressAI
      </button>
    );
  }

  return (
    <div className="fixed inset-x-2 bottom-2 z-30 flex h-[min(640px,calc(100vh-80px))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[420px]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft"><Bot className="h-4 w-4 text-brand" /></span>
        <div className="flex-1">
          <div className="text-sm font-semibold">Project Intelligence Assistant</div>
          <div className="text-[11px] text-ink-3">Answers from this uploaded report</div>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-md p-1 text-ink-2 hover:bg-plane" aria-label="Close assistant"><X className="h-4 w-4" /></button>
      </div>

      {focused && (
        <div className="flex items-center gap-2 border-b border-line bg-brand-soft/40 px-4 py-2 text-xs">
          <Crosshair className="h-3.5 w-3.5 shrink-0 text-brand" />
          <span className="min-w-0 flex-1 truncate">Focused on <b>{focused.name}</b></span>
          <button onClick={() => setFocusId(undefined)} className="text-ink-3 hover:text-ink">Clear</button>
        </div>
      )}

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
        {messages.length === 0 && (
          <div>
            <p className="text-ink-2">
              {focused ? 'Ask anything about this project, or the wider portfolio. Try:'
                : `Ask anything about the ${projects.length} projects in this report — mention a project by name or ID. Try:`}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {(focused ? PROJECT_SUGGESTIONS : SUGGESTIONS).map(s => (
                <button key={s} onClick={() => ask(s)} className="rounded-lg border border-line px-3 py-2 text-left text-ink-2 hover:border-brand hover:text-brand">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => m.role === 'user' ? (
          <div key={i} className="ml-8 rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-white">{m.content}</div>
        ) : (
          <div key={i} className="mr-4 rounded-2xl rounded-bl-sm bg-plane px-3 py-2 leading-relaxed">
            <Rich text={m.content} byId={byId} onOpen={onOpenProject} />
            <div className="mt-2 text-[11px] text-ink-3">
              {m.source === 'rules' ? 'Offline answer — AI model unreachable' : m.model}
              {m.focus && m.focus.length > 0 && ` · looked up ${m.focus.length} project${m.focus.length > 1 ? 's' : ''}`}
            </div>
          </div>
        ))}
        {busy && (
          <div className="mr-4 inline-flex items-center gap-2 rounded-2xl bg-plane px-3 py-2 text-ink-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Analysing the portfolio…
          </div>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-line p-3">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about delays, costs, sectors…"
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand" />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send"
          className="rounded-lg bg-brand px-3 text-white hover:bg-brand-dark disabled:opacity-50"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
};
