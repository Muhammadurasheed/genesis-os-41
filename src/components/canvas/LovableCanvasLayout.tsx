import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { 
  Sidebar as SidebarIcon,
  Maximize2,
  Minimize2,
  Code,
  Play,
  Save,
  Users,
  Settings,
  Palette,
  Layers,
  GitBranch,
  Zap,
  Brain,
  Eye,
  Mic,
  MicOff
} from 'lucide-react';

import { GenesisCanvas } from './GenesisCanvas';
import { Button } from '../ui/button';

import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useWizardStore } from '../../stores/wizardStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { toast } from 'sonner';

interface LovableCanvasLayoutProps {
  blueprint?: any;
  onSave?: () => void;
  onExecute?: () => void;
}

export const LovableCanvasLayout: React.FC<LovableCanvasLayoutProps> = ({
  blueprint,
  onSave,
  onExecute
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tools');
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const { nextStep } = useWizardStore();
  const { workflowNodes: nodes, workflowEdges: edges } = useCanvasStore();
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle sidebar resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    toast.success(isFullscreen ? 'Exited fullscreen mode' : 'Entered fullscreen mode');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    toast.success(isVoiceActive ? 'Voice AI deactivated' : 'Voice AI activated');
  };

  const handleRunSimulation = () => {
    if (nodes.length === 0) {
      toast.error('Add some agents to your canvas first');
      return;
    }
    toast.success('Launching simulation...');
    nextStep('simulation');
  };

  const sidebarItems = [
    {
      id: 'tools',
      label: 'Tools',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Node Types</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-auto p-3 border-white/20">
                <div className="text-center">
                  <Brain className="w-6 h-6 mx-auto mb-1 text-purple-400" />
                  <div className="text-xs">Agent</div>
                </div>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 border-white/20">
                <div className="text-center">
                  <Zap className="w-6 h-6 mx-auto mb-1 text-green-400" />
                  <div className="text-xs">Trigger</div>
                </div>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 border-white/20">
                <div className="text-center">
                  <Code className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                  <div className="text-xs">Logic</div>
                </div>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 border-white/20">
                <div className="text-center">
                  <GitBranch className="w-6 h-6 mx-auto mb-1 text-orange-400" />
                  <div className="text-xs">Action</div>
                </div>
              </Button>
            </div>
          </div>
          <Separator className="bg-white/20" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Quick Actions</h4>
            <Button variant="outline" size="sm" className="w-full justify-start border-white/20">
              <Layers className="w-4 h-4 mr-2" />
              Auto Layout
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start border-white/20">
              <Eye className="w-4 h-4 mr-2" />
              AI Suggestions
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white">Canvas Properties</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Background</label>
              <select className="w-full mt-1 bg-white/10 border border-white/20 rounded text-white text-sm p-2">
                <option>Gradient</option>
                <option>Dots</option>
                <option>Lines</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Grid Size</label>
              <input 
                type="range" 
                min="10" 
                max="50" 
                defaultValue="20"
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'collaborate',
      label: 'Collaborate',
      icon: Users,
      content: (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white">Team Collaboration</h4>
          <Button className="w-full" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Invite Team
          </Button>
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Active Collaborators</div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white flex items-center justify-center text-xs font-bold"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Navbar - Lovable Style */}
      <div className="h-14 bg-black/30 backdrop-blur-sm border-b border-white/10 flex items-center px-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold">GenesisOS Canvas</span>
          </div>

          {/* Central Toolbar */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Code className="w-4 h-4 mr-1" />
              Design
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={onExecute}>
              <Play className="w-4 h-4 mr-1" />
              Execute
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Eye className="w-4 h-4 mr-1" />
              Debug
            </Button>
          </div>

          {/* Canvas Info */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-500/20 text-green-300">
              {nodes.length} Agents
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
              {edges.length} Connections
            </Badge>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className={`text-white hover:bg-white/20 ${isVoiceActive ? 'bg-green-500/20 text-green-300' : ''}`}
          >
            {isVoiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={onSave} className="text-white hover:bg-white/20">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>

          <Button onClick={handleRunSimulation} size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Play className="w-4 h-4 mr-1" />
            Simulate
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              ref={sidebarRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-black/20 backdrop-blur-sm border-r border-white/10 flex flex-col relative"
              style={{ width: sidebarWidth }}
            >
              {/* Sidebar Header */}
              <div className="h-12 border-b border-white/10 flex items-center justify-between px-4">
                <div className="flex">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        activeTab === item.id
                          ? 'bg-white/20 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-1 inline" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <SidebarIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                {sidebarItems.find(item => item.id === activeTab)?.content}
              </div>

              {/* Resize Handle */}
              <div
                ref={resizeRef}
                onMouseDown={handleMouseDown}
                className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-500/50 transition-colors ${
                  isResizing ? 'bg-purple-500' : ''
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Header */}
          {!isFullscreen && (
            <div className="h-12 bg-black/10 border-b border-white/10 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                {sidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="text-gray-400 hover:text-white"
                  >
                    <SidebarIcon className="w-4 h-4" />
                  </Button>
                )}
                <span className="text-white text-sm font-medium">
                  {blueprint?.suggested_structure?.guild_name || 'Intelligent Workflow Canvas'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Canvas Active
              </div>
            </div>
          )}

          {/* Canvas Container */}
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <GenesisCanvas
                blueprint={blueprint}
                onSave={onSave}
                className="w-full h-full"
              />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </div>
  );
};