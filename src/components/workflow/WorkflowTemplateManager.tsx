
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  Play, 
  Clock, 
  TrendingUp, 
  Users, 
  Zap,
  BarChart3,
  MessageSquare,
  Settings,
  Download,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { workflowExecutionEngine, WorkflowTemplate } from '../../services/workflow/workflowExecutionEngine';

export const WorkflowTemplateManager: React.FC = () => {
  const [templates] = useState<WorkflowTemplate[]>(workflowExecutionEngine.getTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);

  const executeTemplate = useCallback(async (template: WorkflowTemplate) => {
    setIsExecuting(template.id);
    
    try {
      toast.info(`Starting ${template.name}...`, {
        description: `Estimated completion: ${Math.ceil(template.estimatedTime / 60)} minutes`
      });

      const execution = await workflowExecutionEngine.executeWorkflow(
        template.nodes,
        template.edges,
        { templateId: template.id, startedAt: new Date() }
      );

      toast.success(`${template.name} completed!`, {
        description: `Executed ${execution.metrics.completedNodes} nodes successfully`
      });

    } catch (error) {
      console.error('Template execution failed:', error);
      toast.error(`${template.name} failed`, {
        description: (error as Error).message
      });
    } finally {
      setIsExecuting(null);
    }
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'automation': return <Zap className="w-4 h-4" />;
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      case 'communication': return <MessageSquare className="w-4 h-4" />;
      case 'integration': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'automation': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'analysis': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'communication': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'integration': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'complex': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          AI Workflow Templates
        </h2>
        <p className="text-gray-300">
          Pre-built intelligent workflows ready to deploy in your business
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer h-full">
                <CardHeader 
                  className="pb-4"
                  onClick={() => setSelectedTemplate(
                    selectedTemplate === template.id ? null : template.id
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white flex items-center gap-2 mb-2">
                        {getCategoryIcon(template.category)}
                        {template.name}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(template.successRate * 5)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </CardTitle>
                      <CardDescription className="text-gray-300 mb-3">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Template Metadata */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.ceil(template.estimatedTime / 60)}min
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`border-white/20 ${getComplexityColor(template.complexity)}`}
                    >
                      {template.complexity}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-green-300">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {Math.round(template.successRate * 100)}%
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{template.nodes.length} agents</span>
                    <span>•</span>
                    <span>{template.edges.length} connections</span>
                  </div>
                </CardHeader>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedTemplate === template.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Agent List */}
                          <div>
                            <h4 className="text-white font-medium mb-2">AI Agents:</h4>
                            <div className="space-y-2">
                              {template.nodes
                                .filter(node => node.type === 'agent')
                                .map(agent => (
                                <div 
                                  key={agent.id}
                                  className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                      {agent.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-white text-sm font-medium">
                                      {agent.name}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Role: {agent.config.role || 'General'}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    ~{agent.avgExecutionTime}s
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => executeTemplate(template)}
                              disabled={isExecuting === template.id}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                              {isExecuting === template.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                  Executing...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Deploy Now
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Execution Metrics */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Execution Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const metrics = workflowExecutionEngine.getExecutionMetrics();
              return (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {metrics.totalExecutions}
                    </div>
                    <div className="text-sm text-gray-300">Total Runs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {metrics.completedExecutions}
                    </div>
                    <div className="text-sm text-gray-300">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {Math.round(metrics.averageExecutionTime / 1000)}s
                    </div>
                    <div className="text-sm text-gray-300">Avg Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {Math.round(metrics.successRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-300">Success Rate</div>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
