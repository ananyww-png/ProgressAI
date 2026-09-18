import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { GlobalSearchModal } from './components/GlobalSearchModal';

// Views
import { DashboardView } from './views/DashboardView';
import { TimeAgentView } from './views/TimeAgentView';
import { ReportsView } from './views/ReportsView';
import { InputIngestionView } from './views/InputIngestionView';
import { ScheduleView } from './views/ScheduleView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { AnalyticsView } from './views/AnalyticsView';
import { ProjectMemoryView } from './views/ProjectMemoryView';
import { AuditTrailView } from './views/AuditTrailView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardView />;
      case 'Time Agent':
        return <TimeAgentView />;
      case 'Reports':
        return <ReportsView />;
      case 'Input Ingestion':
        return <InputIngestionView />;
      case 'Schedule':
        return <ScheduleView />;
      case 'Review Queue':
        return <ReviewQueueView />;
      case 'Analytics':
        return <AnalyticsView />;
      case 'Project Memory':
        return <ProjectMemoryView />;
      case 'Audit Trail':
        return <AuditTrailView />;
      case 'Settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans antialiased overflow-hidden selection:bg-black selection:text-white">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto bg-zinc-100/40 relative">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
