import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Resizable } from 'react-resizable';
import { toast } from 'sonner';

// Components
import { RevolutionaryGenesisCanvas } from './RevolutionaryGenesisCanvas';
import { CanvasTopNavbar } from './CanvasTopNavbar';
import { CanvasSidebar } from './CanvasSidebar';

// Services and Stores
import { useCanvasStore } from '../../stores/canvasStore';
import { revolutionaryCanvasEngine } from '../../services/canvas/revolutionaryCanvasEngine';

// CSS
import 'react-resizable/css/styles.css';

interface CanvasLayoutProps {
  blueprint?: any;
  className?: string;
}

export const CanvasLayout: React.FC<CanvasLayoutProps> = ({
  blueprint,
  className = ''
}) => {
  // Canvas State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [canvasMode, setCanvasMode] = useState<'design' | 'simulate' | 'debug'>('design');
  const [isCollaborating, setIsCollaborating] = useState(false);

  // Store State
  const {
    workflowNodes,
    workflowEdges,
    setWorkflowNodes,
    setWorkflowEdges,
    addToHistory
  } = useCanvasStore();

  // Real-time Canvas Metrics
  const [canvasMetrics, setCanvasMetrics] = useState({
    nodeCount: 0,
    edgeCount: 0,
    complexity: 0,
    performance: 95,
    lastUpdate: new Date()
  });

  // Update metrics when canvas changes
  useEffect(() => {
    setCanvasMetrics({
      nodeCount: workflowNodes.length,
      edgeCount: workflowEdges.length,
      complexity: Math.min(100, (workflowNodes.length * 2) + (workflowEdges.length * 3)),
      performance: Math.max(60, 100 - (workflowNodes.length * 2)),
      lastUpdate: new Date()
    });
  }, [workflowNodes, workflowEdges]);

  // Fullscreen Handler
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    
    if (!isFullscreen) {
      // Enter fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mode Change Handler
  const handleModeChange = useCallback((mode: 'design' | 'simulate' | 'debug') => {
    setCanvasMode(mode);
    
    switch (mode) {
      case 'design':
        toast.info('🎨 Switched to Design Mode', {
          description: 'Build and edit your AI workflow'
        });
        break;
      case 'simulate':
        toast.info('🚀 Switched to Simulation Mode', {
          description: 'Test and validate your workflow'
        });
        break;
      case 'debug':
        toast.info('🔍 Switched to Debug Mode', {
          description: 'Analyze and troubleshoot issues'
        });
        break;
    }
  }, []);

  // Collaboration Handler
  const handleToggleCollaboration = useCallback(() => {
    setIsCollaborating(!isCollaborating);
    
    if (!isCollaborating) {
      toast.success('👥 Collaboration Enabled', {
        description: 'Real-time editing with team members'
      });
    } else {
      toast.info('👤 Solo Mode', {
        description: 'Collaboration disabled'
      });
    }
  }, [isCollaborating]);

  // Save Handler
  const handleSave = useCallback(async () => {
    try {
      // Create snapshot in revolutionary canvas engine
      const snapshotId = revolutionaryCanvasEngine.createSnapshot(
        'Manual save',
        [`mode-${canvasMode}`, 'manual-save']
      );
      
      // Add to store history
      addToHistory(workflowNodes, workflowEdges);
      
      toast.success('💾 Canvas Saved', {
        description: `Snapshot ${snapshotId.slice(-8)} created successfully`
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('❌ Save Failed', {
        description: 'Could not save canvas state'
      });
    }
  }, [canvasMode, workflowNodes, workflowEdges, addToHistory]);

  // Execute Handler
  const handleExecute = useCallback(async () => {
    try {
      toast.loading('🚀 Executing Workflow...', {
        description: 'Initializing AI agents and processes'
      });

      // Simulate workflow execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('✅ Workflow Executed', {
        description: `${workflowNodes.length} agents successfully activated`
      });
    } catch (error) {
      console.error('Execution failed:', error);
      toast.error('❌ Execution Failed', {
        description: 'Could not start workflow'
      });
    }
  }, [workflowNodes]);

  // Share Handler
  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/canvas/shared/${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    
    toast.success('🔗 Canvas Shared', {
      description: 'Shareable link copied to clipboard'
    });
  }, []);

  // Add Node Handler
  const handleAddNode = useCallback((type: string) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { 
        x: Math.random() * 500 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `AI-generated ${type} component`,
        status: 'ready',
        color: type === 'agent' ? 'from-purple-500 to-pink-500' : 
               type === 'trigger' ? 'from-emerald-500 to-teal-500' : 
               'from-blue-500 to-cyan-500'
      }
    };

    setWorkflowNodes([...workflowNodes, newNode as any]);
    addToHistory([...workflowNodes, newNode as any], workflowEdges);
    
    toast.success(`✨ ${type.charAt(0).toUpperCase() + type.slice(1)} Added`, {
      description: 'Drag to reposition and configure'
    });
  }, [workflowNodes, workflowEdges, setWorkflowNodes, addToHistory]);

  // Settings Handler
  const handleSettings = useCallback((setting: string, value: any) => {
    console.log(`Setting ${setting} to:`, value);
    // Handle various canvas settings
    switch (setting) {
      case 'showMinimap':
      case 'showGrid':
      case 'showMetrics':
      case 'smoothAnimations':
        // These would be handled by the canvas component
        break;
      case 'renderQuality':
        // Performance optimization
        break;
      default:
        console.warn(`Unknown setting: ${setting}`);
    }
  }, []);

  // Sidebar Resize Handler
  const handleSidebarResize = useCallback((event: any, { size }: any) => {
    setSidebarWidth(size.width);
  }, []);

  return (
    <ReactFlowProvider>
      <div className={`canvas-layout ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} bg-background relative overflow-hidden ${className}`}>
        {/* Top Navbar */}
        <CanvasTopNavbar
          canvasMode={canvasMode}
          onModeChange={handleModeChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          isCollaborating={isCollaborating}
          onToggleCollaboration={handleToggleCollaboration}
          canvasMetrics={canvasMetrics}
          onSave={handleSave}
          onExecute={handleExecute}
          onShare={handleShare}
        />

        {/* Main Content Area */}
        <div className="flex h-full pt-20">
          {/* Resizable Sidebar */}
          <AnimatePresence>
            {!isFullscreen && (
              <motion.div
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-shrink-0"
              >
                <Resizable
                  width={isSidebarCollapsed ? 60 : sidebarWidth}
                  height={0}
                  onResize={handleSidebarResize}
                  minConstraints={[60, 0]}
                  maxConstraints={[500, 0]}
                  resizeHandles={['e']}
                  handle={
                    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-border/50 hover:bg-border transition-colors" />
                  }
                >
                  <div style={{ width: isSidebarCollapsed ? 60 : sidebarWidth }}>
                    <CanvasSidebar
                      isCollapsed={isSidebarCollapsed}
                      onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      nodes={workflowNodes}
                      canvasMetrics={canvasMetrics}
                      onAddNode={handleAddNode}
                      onSettings={handleSettings}
                      className="h-full"
                    />
                  </div>
                </Resizable>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Canvas Area */}
          <div className="flex-1 relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full p-4"
            >
              <div className="h-full rounded-xl overflow-hidden border border-border/50 shadow-2xl">
                <RevolutionaryGenesisCanvas
                  blueprint={blueprint}
                  onSave={handleSave}
                  onExecute={handleExecute}
                  className="h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Fullscreen Overlay */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background z-40"
            >
              <RevolutionaryGenesisCanvas
                blueprint={blueprint}
                onSave={handleSave}
                onExecute={handleExecute}
                className="h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts Help */}
        <div className="fixed bottom-4 right-4 z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            className="text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50"
          >
            <div className="space-y-1">
              <div><kbd className="px-1">Ctrl+S</kbd> Save</div>
              <div><kbd className="px-1">Ctrl+Shift+F</kbd> Fullscreen</div>
              <div><kbd className="px-1">Space</kbd> Pan</div>
            </div>
          </motion.div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};