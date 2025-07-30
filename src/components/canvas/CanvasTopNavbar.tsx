import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Play, Save, Share2, Users, Settings, Maximize2, Minimize2,
  Grid3X3, Activity, Network, GitBranch, Timer, TrendingUp,
  Mic, Video, History, Download,
  Upload, Bell, HelpCircle, User, ChevronDown
} from 'lucide-react';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { HolographicButton } from '../ui/HolographicButton';
import { BackendStatus } from '../ui/BackendStatus';

interface CanvasTopNavbarProps {
  canvasMode: 'design' | 'simulate' | 'debug';
  onModeChange: (mode: 'design' | 'simulate' | 'debug') => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isCollaborating: boolean;
  onToggleCollaboration: () => void;
  canvasMetrics: {
    nodeCount: number;
    edgeCount: number;
    performance: number;
    lastUpdate: Date;
  };
  onSave?: () => void;
  onExecute?: () => void;
  onShare?: () => void;
  className?: string;
}

export const CanvasTopNavbar: React.FC<CanvasTopNavbarProps> = ({
  canvasMode,
  onModeChange,
  isFullscreen,
  onToggleFullscreen,
  isCollaborating,
  onToggleCollaboration,
  canvasMetrics,
  onSave,
  onExecute,
  onShare,
  className = ''
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const collaborators = [
    { id: '1', name: 'Alice Johnson', avatar: '', color: '#8b5cf6', active: true },
    { id: '2', name: 'Bob Smith', avatar: '', color: '#06b6d4', active: true },
    { id: '3', name: 'Carol Davis', avatar: '', color: '#f59e0b', active: false }
  ];

  const notifications = [
    { id: '1', type: 'success', message: 'Canvas auto-saved successfully', time: '1m ago' },
    { id: '2', type: 'warning', message: 'Performance optimization suggested', time: '5m ago' },
    { id: '3', type: 'info', message: 'New collaborator joined the session', time: '10m ago' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`canvas-top-navbar absolute top-4 left-4 right-4 z-30 ${className}`}
    >
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Brand & Mode */}
            <div className="flex items-center gap-6">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                >
                  <Brain className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Genesis Canvas
                  </h1>
                  <p className="text-xs text-muted-foreground">Revolutionary AI Workflow Designer</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-muted/50 rounded-lg p-1">
                {[
                  { mode: 'design', icon: Grid3X3, label: 'Design' },
                  { mode: 'simulate', icon: Play, label: 'Simulate' },
                  { mode: 'debug', icon: Activity, label: 'Debug' }
                ].map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={canvasMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onModeChange(mode as any)}
                    className="flex items-center gap-2 px-4 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>

              {/* Backend Status */}
              <BackendStatus />
            </div>

            {/* Center Section - Metrics */}
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-4 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <Network className="w-4 h-4" />
                  <span className="font-medium">{canvasMetrics.nodeCount} Nodes</span>
                </div>
                
                <div className="w-px h-4 bg-border" />
                
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span className="font-medium">{canvasMetrics.edgeCount} Connections</span>
                </div>
                
                <div className="w-px h-4 bg-border" />
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-emerald-500">{canvasMetrics.performance}% Performance</span>
                </div>
                
                <div className="w-px h-4 bg-border" />
                
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  <span className="font-medium">{canvasMetrics.lastUpdate.toLocaleTimeString()}</span>
                </div>
              </motion.div>
            </div>

            {/* Right Section - Actions & User */}
            <div className="flex items-center gap-3">
              {/* Collaboration Avatars */}
              <AnimatePresence>
                {isCollaborating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center -space-x-2"
                  >
                    {collaborators.slice(0, 3).map((collaborator, index) => (
                      <motion.div
                        key={collaborator.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                      >
                        <Avatar className="w-8 h-8 border-2 border-background shadow-lg">
                          <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                          <AvatarFallback 
                            className="text-xs font-bold text-white"
                            style={{ backgroundColor: collaborator.color }}
                          >
                            {collaborator.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {collaborator.active && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                        )}
                      </motion.div>
                    ))}
                    {collaborators.length > 3 && (
                      <div className="w-8 h-8 bg-muted rounded-full border-2 border-background flex items-center justify-center text-xs font-bold">
                        +{collaborators.length - 3}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Voice Assistant */}
                <HolographicButton
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0"
                  title="Voice Assistant"
                >
                  <Mic className="w-4 h-4" />
                </HolographicButton>

                {/* Video Recording */}
                <HolographicButton
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0"
                  title="Record Session"
                >
                  <Video className="w-4 h-4" />
                </HolographicButton>

                {/* Fullscreen Toggle */}
                <HolographicButton
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullscreen}
                  className="w-10 h-10 p-0"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </HolographicButton>

                {/* Collaboration */}
                <HolographicButton
                  variant="outline"
                  size="sm"
                  onClick={onToggleCollaboration}
                  className={`gap-2 ${isCollaborating ? 'bg-primary/10 border-primary' : ''}`}
                >
                  <Users className="w-4 h-4" />
                  {isCollaborating ? 'Live' : 'Collaborate'}
                </HolographicButton>

                {/* Share */}
                <HolographicButton
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </HolographicButton>

                {/* Save */}
                <HolographicButton
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </HolographicButton>

                {/* Execute */}
                <HolographicButton
                  size="sm"
                  onClick={onExecute}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 gap-2"
                >
                  <Play className="w-4 h-4" />
                  Execute
                </HolographicButton>
              </div>

              <div className="w-px h-6 bg-border" />

              {/* Notifications */}
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative w-10 h-10 p-0">
                    <Bell className="w-4 h-4" />
                    {notifications.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold"
                      >
                        {notifications.length}
                      </motion.div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="p-3">
                      <div className="flex items-start gap-3 w-full">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'success' ? 'bg-emerald-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" alt="User" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Canvas Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <History className="w-4 h-4 mr-2" />
                    Version History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Export Canvas
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Canvas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Support
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mode-specific Toolbar */}
        <AnimatePresence>
          {canvasMode !== 'design' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/50 px-4 py-3"
            >
              {canvasMode === 'simulate' && (
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <Play className="w-3 h-3 mr-1" />
                    Simulation Mode
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Active simulations: <strong className="text-foreground">3</strong></span>
                    <span>•</span>
                    <span>Success rate: <strong className="text-emerald-500">98.5%</strong></span>
                    <span>•</span>
                    <span>Avg. runtime: <strong className="text-foreground">2.3s</strong></span>
                  </div>
                </div>
              )}
              
              {canvasMode === 'debug' && (
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                    <Activity className="w-3 h-3 mr-1" />
                    Debug Mode
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Errors: <strong className="text-destructive">2</strong></span>
                    <span>•</span>
                    <span>Warnings: <strong className="text-yellow-500">5</strong></span>
                    <span>•</span>
                    <span>Performance issues: <strong className="text-orange-500">1</strong></span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};