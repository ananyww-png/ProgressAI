import React, { useEffect, useState } from 'react';
import { LineChart, Upload } from 'lucide-react';
import { api } from './api';
import { Dashboard } from './Dashboard';
import { UploadScreen } from './UploadScreen';
import type { Dataset, Health } from './types';

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setDataset(null)} className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-white"><LineChart className="h-4 w-4" /></span>
            ProgressAI
          </button>
          <span className="hidden text-sm text-ink-3 sm:inline">Infrastructure project early-warning system</span>
          {dataset && (
            <button onClick={() => setDataset(null)}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:border-brand hover:text-brand">
              <Upload className="h-4 w-4" /> New upload
            </button>
          )}
        </div>
      </header>
      {dataset ? <Dashboard key={dataset._id} dataset={dataset} /> : <UploadScreen onLoaded={setDataset} health={health} />}
    </div>
  );
}
