import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Save, 
  Share2, 
  Zap,
  Cpu,
  Activity,
  Settings,
  Mic,
  RotateCcw,
  Grid,
  MousePointer2
} from 'lucide-react';
import { HolographicButton } from './HolographicButton';

interface CanvasToolbarProps {
  mode: 'design' | 'execute' | 'debug';
  onModeChange: (mode: 'design' | 'execute' | 'debug') => void;
  onSave?: () => void;
  onExecute?: () => void;
  executionMetrics?: any;
  className?: string;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  mode,
  onModeChange,
  onSave,
  onExecute,
  executionMetrics,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-4 left-4 z-10 ${className}`}
    >
      <div className="flex items-center gap-3 bg-black/80 backdrop-blur-lg rounded-lg p-3 border border-white/10">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <HolographicButton
            variant={mode === 'design' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('design')}
            className="px-3"
          >
            <Grid className="w-4 h-4 mr-1" />
            Design
          </HolographicButton>
          <HolographicButton
            variant={mode === 'execute' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('execute')}
            className="px-3"
          >
            <Play className="w-4 h-4 mr-1" />
            Execute
          </HolographicButton>
          <HolographicButton
            variant={mode === 'debug' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('debug')}
            className="px-3"
          >
            <Cpu className="w-4 h-4 mr-1" />
            Debug
          </HolographicButton>
        </div>

        <div className="w-px h-6 bg-white/20" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <HolographicButton
            variant="outline"
            size="sm"
            onClick={onSave}
            className="flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Save
          </HolographicButton>

          <HolographicButton
            variant="secondary"
            size="sm"
            onClick={onExecute}
            className="flex items-center gap-1"
          >
            <Zap className="w-4 h-4" />
            Launch
          </HolographicButton>

          <HolographicButton
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Share2 className="w-4 h-4" />
            Share
          </HolographicButton>
        </div>

        <div className="w-px h-6 bg-white/20" />

        {/* Advanced Tools */}
        <div className="flex items-center gap-2">
          <HolographicButton
            variant="ghost"
            size="sm"
            className="p-2"
            title="Voice AI Assistant"
          >
            <Mic className="w-4 h-4" />
          </HolographicButton>

          <HolographicButton
            variant="ghost"
            size="sm"
            className="p-2"
            title="Auto Layout"
          >
            <RotateCcw className="w-4 h-4" />
          </HolographicButton>

          <HolographicButton
            variant="ghost"
            size="sm"
            className="p-2"
            title="Cursor Mode"
          >
            <MousePointer2 className="w-4 h-4" />
          </HolographicButton>

          <HolographicButton
            variant="ghost"
            size="sm"
            className="p-2"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </HolographicButton>
        </div>

        {/* Execution Status */}
        {mode === 'execute' && executionMetrics && (
          <>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Running</span>
              <span className="text-white/60">|</span>
              <span className="text-blue-400">{executionMetrics.activeNodes || 0} nodes</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};