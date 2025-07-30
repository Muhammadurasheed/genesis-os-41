import React from 'react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '../ui/sidebar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';
import { AppSidebar } from './AppSidebar';

type AppPage = 'dashboard' | 'guilds' | 'agents' | 'marketplace' | 'wizard' | 'analytics';

interface AppLayoutProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  isGuest?: boolean;
  children: React.ReactNode;
}

function AppLayoutContent({ currentPage, onNavigate, isGuest = false, children }: AppLayoutProps) {
  const { setOpenMobile } = useSidebar();
  
  const handleNavigate = (page: AppPage) => {
    if (page === 'wizard') {
      setOpenMobile(false); // Close sidebar when opening wizard
    }
    onNavigate(page);
  };

  const hideSidebar = currentPage === 'wizard';

  return (
    <div className="min-h-screen flex w-full">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        {!hideSidebar && (
          <>
            <ResizablePanel defaultSize={18} minSize={15} maxSize={30}>
              <AppSidebar 
                currentPage={currentPage} 
                onNavigate={handleNavigate} 
                isGuest={isGuest} 
              />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}
        
        <ResizablePanel defaultSize={hideSidebar ? 100 : 82} minSize={50}>
          <main className="flex-1 flex flex-col h-full">
            {/* Top header with sidebar trigger for all screen sizes */}
            <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
              <SidebarTrigger className="ml-2" />
            </header>
            
            {/* Main content */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export function AppLayout(props: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent {...props} />
    </SidebarProvider>
  );
}