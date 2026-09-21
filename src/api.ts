import type { AIResult, ChatMessage, Dataset, DatasetListItem, Health } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  health: () => request<Health>('/health'),
  datasets: () => request<DatasetListItem[]>('/datasets'),
  dataset: (id: string) => request<Dataset>(`/datasets/${id}`),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<Dataset>('/upload', { method: 'POST', body: form });
  },
  samples: () => request<{ file: string; title: string; description: string }[]>('/samples'),
  sampleFile: async (name = 'sample_paimana_report.xlsx') => {
    const res = await fetch(`/api/sample/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Sample file not available — run: python backend/make_sample.py');
    return new File([await res.blob()], name);
  },
  recommend: (id: string, projectId: string, refresh = false) =>
    request<AIResult>(`/datasets/${id}/projects/${encodeURIComponent(projectId)}/recommend?refresh=${refresh}`, {
      method: 'POST',
    }),
  chat: (id: string, messages: Pick<ChatMessage, 'role' | 'content'>[], focusProjectId?: string) =>
    request<Omit<ChatMessage, 'role'>>(`/datasets/${id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, focus_project_id: focusProjectId ?? null }),
    }),
  brief: (id: string, refresh = false) =>
    request<AIResult>(`/datasets/${id}/brief?refresh=${refresh}`, { method: 'POST' }),
};
