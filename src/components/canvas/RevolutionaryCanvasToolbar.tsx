// Phase 2: Revolutionary Canvas Toolbar - UI for Revolutionary Features
// Enterprise-grade canvas controls that surpass n8n and Figma

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Sparkles, 
  GitBranch, 
  Users, 
  Zap, 
  History, 
  Camera,
  RefreshCw,
  Settings,
  Brain,
  Network
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface RevolutionaryCanvasToolbarProps {
  onOptimizeLayout: (algorithm: 'force_directed' | 'hierarchical' | 'circular' | 'organic') => void;
  onGenerateSuggestions: () => void;
  onCreateSnapshot: () => void;
  onToggleCollaboration: () => void;
  suggestions: any[];
  snapshots: any[];
  autoLayoutEnabled: boolean;
  intelligentConnectionsEnabled: boolean;
  onToggleAutoLayout: () => void;
  onToggleIntelligentConnections: () => void;
  isOptimizing?: boolean;
  isGeneratingSuggestions?: boolean;
}

export const RevolutionaryCanvasToolbar: React.FC<RevolutionaryCanvasToolbarProps> = ({
  onOptimizeLayout,
  onGenerateSuggestions,
  onCreateSnapshot,
  onToggleCollaboration,
  suggestions,
  snapshots,
  autoLayoutEnabled,
  intelligentConnectionsEnabled,
  onToggleAutoLayout,
  onToggleIntelligentConnections,
  isOptimizing = false,
  isGeneratingSuggestions = false
}) => {
  const [snapshotMessage, setSnapshotMessage] = useState('');
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);

  const handleCreateSnapshot = () => {
    if (snapshotMessage.trim()) {
      onCreateSnapshot();
      setSnapshotMessage('');
      setShowSnapshotDialog(false);
    }
  };

  return (
    <div className="revolutionary-canvas-toolbar flex items-center gap-2 p-4 bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-sm border-b border-border/50">
      <TooltipProvider>
        {/* AI Layout Optimization */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isOptimizing}
                className="revolutionary-button group relative overflow-hidden"
              >
                {isOptimizing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                AI Layout
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>🧠 AI Layout Algorithms</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOptimizeLayout('force_directed')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Force Directed (Smart)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptimizeLayout('hierarchical')}>
                <GitBranch className="h-4 w-4 mr-2" />
                Hierarchical (Structured)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptimizeLayout('circular')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Circular (Balanced)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptimizeLayout('organic')}>
                <Network className="h-4 w-4 mr-2" />
                Organic (Natural)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge variant="secondary" className="text-xs">
            {autoLayoutEnabled ? 'AI ON' : 'AI OFF'}
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Intelligent Connections */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onGenerateSuggestions}
                disabled={isGeneratingSuggestions}
                className="revolutionary-button group relative overflow-hidden"
              >
                {isGeneratingSuggestions ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Smart Connect
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>🔗 Generate AI-powered connection suggestions</p>
              <p className="text-xs text-muted-foreground">Analyzes workflow logic and data flow</p>
            </TooltipContent>
          </Tooltip>

          {suggestions.length > 0 && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              {suggestions.length} suggestions
            </Badge>
          )}

          <Badge variant="secondary" className="text-xs">
            {intelligentConnectionsEnabled ? 'SMART ON' : 'SMART OFF'}
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Version Control */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSnapshotDialog(true)}
                className="revolutionary-button group relative overflow-hidden"
              >
                <Camera className="h-4 w-4 mr-2" />
                Snapshot
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>📸 Create Git-like canvas snapshot</p>
              <p className="text-xs text-muted-foreground">Version control for your workflows</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                History ({snapshots.length})
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>📋 View canvas version history</p>
              <p className="text-xs text-muted-foreground">{snapshots.length} snapshots available</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Real-time Collaboration */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onToggleCollaboration}
                className="revolutionary-button group relative overflow-hidden"
              >
                <Users className="h-4 w-4 mr-2" />
                Collaborate
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>👥 Enable real-time collaboration</p>
              <p className="text-xs text-muted-foreground">Multi-user editing with conflict resolution</p>
            </TooltipContent>
          </Tooltip>

          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Live
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Feature Toggles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>🎛️ Revolutionary Features</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleAutoLayout}>
              <Brain className="h-4 w-4 mr-2" />
              AI Auto-Layout: {autoLayoutEnabled ? 'ON' : 'OFF'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleIntelligentConnections}>
              <Zap className="h-4 w-4 mr-2" />
              Smart Connections: {intelligentConnectionsEnabled ? 'ON' : 'OFF'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      {/* Revolutionary Features Badge */}
      <div className="ml-auto">
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-primary border-primary/20">
          🚀 Revolutionary Canvas
        </Badge>
      </div>

      {/* Snapshot Dialog (Simple implementation) */}
      {showSnapshotDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg border shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">📸 Create Canvas Snapshot</h3>
            <input
              type="text"
              placeholder="Enter snapshot message..."
              value={snapshotMessage}
              onChange={(e) => setSnapshotMessage(e.target.value)}
              className="w-full p-2 border rounded mb-4 bg-background"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowSnapshotDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSnapshot}
                disabled={!snapshotMessage.trim()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Create Snapshot
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};