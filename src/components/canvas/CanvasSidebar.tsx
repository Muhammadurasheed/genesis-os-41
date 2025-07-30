import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Zap, Settings, GitBranch, Database, Mail, Slack, Github,
  Globe, Code, Plug, Search, Eye, Unlock,
  Layers, Palette, MousePointer2, History, Save,
  RotateCcw, ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
import { HolographicButton } from '../ui/HolographicButton';

interface CanvasSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  nodes: any[];
  canvasMetrics: {
    nodeCount: number;
    edgeCount: number;
    complexity: number;
    performance: number;
  };
  onAddNode: (type: string) => void;
  onSettings: (setting: string, value: any) => void;
  className?: string;
}

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  nodes,
  canvasMetrics,
  onAddNode,
  onSettings,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('palette');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const nodeTemplates = [
    {
      type: 'agent',
      name: 'AI Agent',
      description: 'Intelligent digital worker',
      icon: Bot,
      color: 'from-purple-500 to-pink-500',
      category: 'Core'
    },
    {
      type: 'trigger',
      name: 'Trigger',
      description: 'Start workflow execution',
      icon: Zap,
      color: 'from-emerald-500 to-teal-500',
      category: 'Core'
    },
    {
      type: 'condition',
      name: 'Condition',
      description: 'Logic branching point',
      icon: GitBranch,
      color: 'from-blue-500 to-cyan-500',
      category: 'Logic'
    },
    {
      type: 'integration',
      name: 'Integration',
      description: 'External service connection',
      icon: Plug,
      color: 'from-orange-500 to-red-500',
      category: 'Integrations'
    }
  ];

  const integrations = [
    { name: 'Slack', icon: Slack, color: '#4A154B', description: 'Team communication' },
    { name: 'GitHub', icon: Github, color: '#181717', description: 'Code repository' },
    { name: 'Database', icon: Database, color: '#336791', description: 'Data storage' },
    { name: 'Email', icon: Mail, color: '#EA4335', description: 'Email automation' },
    { name: 'Web API', icon: Globe, color: '#0EA5E9', description: 'REST API calls' },
    { name: 'Custom Code', icon: Code, color: '#8B5CF6', description: 'Custom logic' }
  ];

  const filteredNodes = nodes.filter(node => 
    node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isCollapsed ? 60 : 320,
        opacity: 1 
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`canvas-sidebar relative z-20 ${className}`}
    >
      <Card className="h-full bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        {/* Header */}
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Canvas Tools
              </CardTitle>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-2"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {/* Collapsed State */}
        {isCollapsed && (
          <CardContent className="p-2">
            <div className="flex flex-col gap-2">
              {[
                { icon: Palette, tooltip: 'Node Palette' },
                { icon: Layers, tooltip: 'Canvas Layers' },
                { icon: Settings, tooltip: 'Settings' },
                { icon: History, tooltip: 'Version History' }
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full h-10 p-0"
                  title={item.tooltip}
                >
                  <item.icon className="w-5 h-5" />
                </Button>
              ))}
            </div>
          </CardContent>
        )}

        {/* Expanded State */}
        {!isCollapsed && (
          <CardContent className="p-4 pt-0 h-full overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="palette" className="text-xs">
                  <Palette className="w-3 h-3 mr-1" />
                  Palette
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-xs">
                  <Layers className="w-3 h-3 mr-1" />
                  Layers
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <History className="w-3 h-3 mr-1" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Node Palette Tab */}
              <TabsContent value="palette" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {/* Core Components */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Core Components
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {nodeTemplates.filter(t => t.category === 'Core').map((template) => (
                          <motion.div
                            key={template.type}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="outline"
                              className="w-full justify-start h-auto p-4 text-left hover:bg-muted/50"
                              onClick={() => onAddNode(template.type)}
                            >
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color} mr-3 shadow-sm`}>
                                <template.icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{template.name}</div>
                                <div className="text-xs text-muted-foreground">{template.description}</div>
                              </div>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Logic Components */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Logic & Flow
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {nodeTemplates.filter(t => t.category === 'Logic').map((template) => (
                          <motion.div
                            key={template.type}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="outline"
                              className="w-full justify-start h-auto p-4 text-left hover:bg-muted/50"
                              onClick={() => onAddNode(template.type)}
                            >
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color} mr-3 shadow-sm`}>
                                <template.icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{template.name}</div>
                                <div className="text-xs text-muted-foreground">{template.description}</div>
                              </div>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Integrations */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Plug className="w-4 h-4" />
                        Integrations
                      </h4>
                      <div className="space-y-2">
                        {integrations.map((integration) => (
                          <motion.div
                            key={integration.name}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-auto p-3 text-left hover:bg-muted/30"
                              onClick={() => onAddNode('integration')}
                            >
                              <div 
                                className="p-2 rounded-lg mr-3 shadow-sm"
                                style={{ backgroundColor: integration.color + '20' }}
                              >
                                <integration.icon 
                                  className="w-4 h-4" 
                                  style={{ color: integration.color }}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{integration.name}</div>
                                <div className="text-xs text-muted-foreground">{integration.description}</div>
                              </div>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <MousePointer2 className="w-4 h-4" />
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <HolographicButton
                          variant="outline"
                          size="sm"
                          className="justify-center h-auto p-3"
                        >
                          <RotateCcw className="w-4 h-4 mb-1" />
                          <span className="text-xs">Auto Layout</span>
                        </HolographicButton>
                        
                        <HolographicButton
                          variant="outline"
                          size="sm"
                          className="justify-center h-auto p-3"
                        >
                          <Save className="w-4 h-4 mb-1" />
                          <span className="text-xs">Save Canvas</span>
                        </HolographicButton>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Layers Tab */}
              <TabsContent value="layers" className="flex-1 overflow-hidden">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search layers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Layer List */}
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {filteredNodes.map((node) => (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                            ${selectedLayer === node.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50 border-border/50'}
                          `}
                          onClick={() => setSelectedLayer(selectedLayer === node.id ? null : node.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle visibility
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle lock
                              }}
                            >
                              <Unlock className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{node.data.label}</span>
                              <Badge variant="outline" className="text-xs">{node.type}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{node.id}</div>
                          </div>

                          <div className={`w-3 h-3 rounded-full ${
                            node.data.status === 'active' ? 'bg-emerald-500' :
                            node.data.status === 'ready' ? 'bg-blue-500' : 'bg-gray-400'
                          }`} />
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {/* Display Settings */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Display Settings
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Show Minimap</label>
                          <Switch 
                            defaultChecked 
                            onCheckedChange={(checked) => onSettings('showMinimap', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Show Grid</label>
                          <Switch 
                            defaultChecked 
                            onCheckedChange={(checked) => onSettings('showGrid', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Show Metrics</label>
                          <Switch 
                            defaultChecked 
                            onCheckedChange={(checked) => onSettings('showMetrics', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Smooth Animations</label>
                          <Switch 
                            defaultChecked 
                            onCheckedChange={(checked) => onSettings('smoothAnimations', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Performance Settings */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Performance
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Canvas Performance</span>
                            <span>{canvasMetrics.performance}%</span>
                          </div>
                          <Progress value={canvasMetrics.performance} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Complexity Level</span>
                            <span>{canvasMetrics.complexity}%</span>
                          </div>
                          <Progress value={canvasMetrics.complexity} className="h-2" />
                        </div>

                        <div>
                          <label className="text-sm mb-2 block">Render Quality</label>
                          <Slider
                            defaultValue={[80]}
                            max={100}
                            step={10}
                            className="w-full"
                            onValueChange={(value) => onSettings('renderQuality', value[0])}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Canvas Statistics */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Statistics
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                          <div className="text-lg font-bold text-primary">{canvasMetrics.nodeCount}</div>
                          <div className="text-xs text-muted-foreground">Nodes</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                          <div className="text-lg font-bold text-secondary">{canvasMetrics.edgeCount}</div>
                          <div className="text-xs text-muted-foreground">Connections</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="flex-1 overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Version History</h4>
                    <Button variant="outline" size="sm">
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {[
                        { id: '1', message: 'Initial canvas setup', time: '2 minutes ago', author: 'You' },
                        { id: '2', message: 'Added AI agents for processing', time: '5 minutes ago', author: 'You' },
                        { id: '3', message: 'Connected database integration', time: '1 hour ago', author: 'Alice' },
                        { id: '4', message: 'Applied auto-layout optimization', time: '2 hours ago', author: 'You' }
                      ].map((version) => (
                        <motion.div
                          key={version.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-medium">{version.message}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{version.time}</span>
                            <span>•</span>
                            <span>{version.author}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
};