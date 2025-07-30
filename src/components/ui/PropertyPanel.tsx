import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  X, 
  Brain, 
  Zap, 
  Link, 
  GitBranch,
  Eye,
  EyeOff,
  Palette,
  Code
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { HolographicButton } from './HolographicButton';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Switch } from './switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface PropertyPanelProps {
  selectedNode: any;
  onNodeUpdate: (nodeId: string, updates: any) => void;
  className?: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  onNodeUpdate,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<'properties' | 'styling' | 'advanced'>('properties');

  if (!selectedNode) {
    return null;
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'agent': return <Brain className="w-4 h-4 text-purple-400" />;
      case 'trigger': return <Zap className="w-4 h-4 text-green-400" />;
      case 'integration': return <Link className="w-4 h-4 text-orange-400" />;
      case 'logic': return <GitBranch className="w-4 h-4 text-red-400" />;
      default: return <Settings className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleUpdate = (field: string, value: any) => {
    onNodeUpdate(selectedNode.id, { [field]: value });
  };

  const handleDataUpdate = (field: string, value: any) => {
    onNodeUpdate(selectedNode.id, {
      data: {
        ...selectedNode.data,
        [field]: value
      }
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`w-80 ${className}`}
        >
          <GlassCard variant="medium" className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {getNodeIcon(selectedNode.type)}
                <div>
                  <h3 className="text-white font-medium text-sm">
                    {selectedNode.data?.label || 'Node Properties'}
                  </h3>
                  <p className="text-white/60 text-xs capitalize">{selectedNode.type} Node</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsVisible(false)}
                  className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <EyeOff className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'properties', label: 'Properties', icon: Settings },
                { id: 'styling', label: 'Styling', icon: Palette },
                { id: 'advanced', label: 'Advanced', icon: Code }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {activeTab === 'properties' && (
                <div className="space-y-4">
                  {/* Basic Properties */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white/80 text-xs">Node Label</Label>
                      <Input
                        value={selectedNode.data?.label || ''}
                        onChange={(e) => handleDataUpdate('label', e.target.value)}
                        className="mt-1 bg-white/5 border-white/20 text-white text-sm"
                        placeholder="Enter node label..."
                      />
                    </div>

                    <div>
                      <Label className="text-white/80 text-xs">Description</Label>
                      <Textarea
                        value={selectedNode.data?.description || ''}
                        onChange={(e) => handleDataUpdate('description', e.target.value)}
                        className="mt-1 bg-white/5 border-white/20 text-white text-sm resize-none"
                        rows={3}
                        placeholder="Describe this node's purpose..."
                      />
                    </div>

                    {/* Type-specific properties */}
                    {selectedNode.type === 'agent' && (
                      <>
                        <div>
                          <Label className="text-white/80 text-xs">AI Model</Label>
                          <Select
                            value={selectedNode.data?.model || 'claude-3.5-sonnet'}
                            onValueChange={(value) => handleDataUpdate('model', value)}
                          >
                            <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-white/80 text-xs">Role</Label>
                          <Input
                            value={selectedNode.data?.role || ''}
                            onChange={(e) => handleDataUpdate('role', e.target.value)}
                            className="mt-1 bg-white/5 border-white/20 text-white text-sm"
                            placeholder="Assistant, Analyst, etc."
                          />
                        </div>

                        <div>
                          <Label className="text-white/80 text-xs">Personality</Label>
                          <Textarea
                            value={selectedNode.data?.personality || ''}
                            onChange={(e) => handleDataUpdate('personality', e.target.value)}
                            className="mt-1 bg-white/5 border-white/20 text-white text-sm resize-none"
                            rows={2}
                            placeholder="Professional, helpful, creative..."
                          />
                        </div>
                      </>
                    )}

                    {selectedNode.type === 'trigger' && (
                      <div>
                        <Label className="text-white/80 text-xs">Trigger Type</Label>
                        <Select
                          value={selectedNode.data?.triggerType || 'manual'}
                          onValueChange={(value) => handleDataUpdate('triggerType', value)}
                        >
                          <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="schedule">Schedule</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'styling' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80 text-xs">Visible</Label>
                    <Switch
                      checked={!selectedNode.hidden}
                      onCheckedChange={(checked) => handleUpdate('hidden', !checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-white/80 text-xs">Selectable</Label>
                    <Switch
                      checked={selectedNode.selectable !== false}
                      onCheckedChange={(checked) => handleUpdate('selectable', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-white/80 text-xs">Draggable</Label>
                    <Switch
                      checked={selectedNode.draggable !== false}
                      onCheckedChange={(checked) => handleUpdate('draggable', checked)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80 text-xs">Node ID</Label>
                    <Input
                      value={selectedNode.id}
                      readOnly
                      className="mt-1 bg-white/5 border-white/20 text-white/60 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-white/80 text-xs">Position</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="number"
                        value={Math.round(selectedNode.position?.x || 0)}
                        onChange={(e) => handleUpdate('position', { 
                          ...selectedNode.position, 
                          x: parseFloat(e.target.value) 
                        })}
                        className="bg-white/5 border-white/20 text-white text-sm"
                        placeholder="X"
                      />
                      <Input
                        type="number"
                        value={Math.round(selectedNode.position?.y || 0)}
                        onChange={(e) => handleUpdate('position', { 
                          ...selectedNode.position, 
                          y: parseFloat(e.target.value) 
                        })}
                        className="bg-white/5 border-white/20 text-white text-sm"
                        placeholder="Y"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/80 text-xs">Z-Index</Label>
                    <Input
                      type="number"
                      value={selectedNode.zIndex || 0}
                      onChange={(e) => handleUpdate('zIndex', parseInt(e.target.value))}
                      className="mt-1 bg-white/5 border-white/20 text-white text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-2">
                <HolographicButton
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {/* Reset to defaults */}}
                >
                  Reset
                </HolographicButton>
                <HolographicButton
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {/* Apply changes */}}
                >
                  Apply
                </HolographicButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Show/Hide Toggle */}
      {!isVisible && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsVisible(true)}
          className="fixed left-4 top-1/2 -translate-y-1/2 w-8 h-12 bg-black/80 backdrop-blur-lg rounded-r-lg border border-l-0 border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors z-10"
        >
          <Eye className="w-4 h-4 text-white" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};