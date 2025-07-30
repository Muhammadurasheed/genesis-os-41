import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  Bot,
  Play,
  Pause,
  Activity,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { agentRuntimeService, AgentConfig, AgentExecution } from '../../services/agentRuntimeService';

interface AgentRuntimeManagerProps {
  onAgentSelect?: (agentId: string) => void;
  selectedAgentId?: string;
}

export const AgentRuntimeManager: React.FC<AgentRuntimeManagerProps> = ({
  onAgentSelect,
  selectedAgentId
}) => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  
  // Agent creation/editing states
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [agentForm, setAgentForm] = useState({
    name: '',
    description: '',
    instructions: '',
    personality: '',
    use_knowledge_base: false,
    knowledge_base_ids: [] as string[]
  });

  // Execution states
  const [executionInput, setExecutionInput] = useState('');
  const [executionResults, setExecutionResults] = useState<{ [agentId: string]: AgentExecution }>({});

  useEffect(() => {
    loadAgents();
    loadExecutions();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      loadExecutions(selectedAgentId);
    }
  }, [selectedAgentId]);

  const loadAgents = async () => {
    try {
      const agentList = await agentRuntimeService.getAgents();
      setAgents(agentList);
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async (agentId?: string) => {
    try {
      const executionList = await agentRuntimeService.getExecutions(agentId, 50);
      setExecutions(executionList);
    } catch (error) {
      console.error('Failed to load executions:', error);
      toast.error('Failed to load executions');
    }
  };

  const handleCreateAgent = async () => {
    if (!agentForm.name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    try {
      const agentData = {
        name: agentForm.name,
        description: agentForm.description,
        instructions: agentForm.instructions,
        personality: agentForm.personality,
        tools: [],
        memory_config: agentForm.use_knowledge_base ? {
          use_knowledge_base: true,
          knowledge_base_ids: agentForm.knowledge_base_ids
        } : undefined,
        status: 'draft' as const
      };

      await agentRuntimeService.createAgent(agentData);
      toast.success('Agent created successfully');
      setShowCreateAgent(false);
      setAgentForm({
        name: '',
        description: '',
        instructions: '',
        personality: '',
        use_knowledge_base: false,
        knowledge_base_ids: []
      });
      await loadAgents();
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast.error('Failed to create agent');
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;

    try {
      const updates = {
        name: agentForm.name,
        description: agentForm.description,
        instructions: agentForm.instructions,
        personality: agentForm.personality,
        memory_config: agentForm.use_knowledge_base ? {
          use_knowledge_base: true,
          knowledge_base_ids: agentForm.knowledge_base_ids
        } : undefined
      };

      await agentRuntimeService.updateAgent(editingAgent.id, updates);
      toast.success('Agent updated successfully');
      setEditingAgent(null);
      await loadAgents();
    } catch (error) {
      console.error('Failed to update agent:', error);
      toast.error('Failed to update agent');
    }
  };

  const handleExecuteAgent = async (agentId: string) => {
    if (!executionInput.trim()) {
      toast.error('Please provide input for the agent');
      return;
    }

    setExecuting(agentId);
    try {
      const execution = await agentRuntimeService.executeAndWait(
        agentId,
        { message: executionInput },
        {},
        60000 // 1 minute timeout
      );

      setExecutionResults(prev => ({ ...prev, [agentId]: execution }));
      toast.success('Agent execution completed');
      await loadExecutions(selectedAgentId);
    } catch (error) {
      console.error('Agent execution failed:', error);
      toast.error('Agent execution failed');
    } finally {
      setExecuting(null);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      await agentRuntimeService.deleteAgent(agentId);
      toast.success('Agent deleted successfully');
      await loadAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const handleDeployAgent = async (agentId: string) => {
    try {
      await agentRuntimeService.deployAgent(agentId);
      toast.success('Agent deployed successfully');
      await loadAgents();
    } catch (error) {
      console.error('Failed to deploy agent:', error);
      toast.error('Failed to deploy agent');
    }
  };

  const startEditingAgent = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      description: agent.description || '',
      instructions: agent.instructions || '',
      personality: agent.personality || '',
      use_knowledge_base: agent.memory_config?.use_knowledge_base || false,
      knowledge_base_ids: agent.memory_config?.knowledge_base_ids || []
    });
  };

  const getStatusIcon = (status: AgentConfig['status']) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'testing':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: AgentConfig['status']) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'testing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading agents...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Bot className="h-6 w-6 mr-2" />
          Agent Runtime Manager
        </h2>
        <Button onClick={() => setShowCreateAgent(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Agent Creation/Editing Form */}
      {(showCreateAgent || editingAgent) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingAgent ? 'Edit Agent' : 'Create New Agent'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={agentForm.name}
                onChange={(e) => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter agent name"
              />
            </div>

            <div>
              <Label htmlFor="agent-description">Description</Label>
              <Textarea
                id="agent-description"
                value={agentForm.description}
                onChange={(e) => setAgentForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this agent does"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="agent-instructions">Instructions</Label>
              <Textarea
                id="agent-instructions"
                value={agentForm.instructions}
                onChange={(e) => setAgentForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Detailed instructions for the agent"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="agent-personality">Personality</Label>
              <Input
                id="agent-personality"
                value={agentForm.personality}
                onChange={(e) => setAgentForm(prev => ({ ...prev, personality: e.target.value }))}
                placeholder="e.g., Professional, Friendly, Creative"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-knowledge-base"
                checked={agentForm.use_knowledge_base}
                onChange={(e) => setAgentForm(prev => ({ ...prev, use_knowledge_base: e.target.checked }))}
              />
              <Label htmlFor="use-knowledge-base">Enable Knowledge Base Access</Label>
            </div>

            <div className="flex space-x-2">
              <Button onClick={editingAgent ? handleUpdateAgent : handleCreateAgent}>
                {editingAgent ? 'Update Agent' : 'Create Agent'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateAgent(false);
                  setEditingAgent(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Agent Execution Interface */}
      {selectedAgentId && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Test Agent Execution
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="execution-input">Input Message</Label>
              <Textarea
                id="execution-input"
                value={executionInput}
                onChange={(e) => setExecutionInput(e.target.value)}
                placeholder="Enter a message for the agent to process"
                rows={3}
              />
            </div>

            <Button
              onClick={() => handleExecuteAgent(selectedAgentId)}
              disabled={executing === selectedAgentId || !executionInput.trim()}
              className="w-full"
            >
              {executing === selectedAgentId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Agent
                </>
              )}
            </Button>

            {/* Execution Results */}
            {executionResults[selectedAgentId] && (
              <div className="p-4 border rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Execution Result:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getExecutionStatusIcon(executionResults[selectedAgentId].status)}
                    <span className="capitalize">{executionResults[selectedAgentId].status}</span>
                  </div>
                  
                  {executionResults[selectedAgentId].output_data && (
                    <div className="p-3 bg-background border rounded">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(executionResults[selectedAgentId].output_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {executionResults[selectedAgentId].execution_steps && (
                    <div className="space-y-2">
                      <h5 className="font-medium">Execution Steps:</h5>
                      {executionResults[selectedAgentId].execution_steps.map((step, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          {getExecutionStatusIcon(step.status)}
                          <span>{step.step_type}</span>
                          {step.duration_ms && (
                            <Badge variant="outline" className="text-xs">
                              {step.duration_ms}ms
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Agents List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          Your Agents ({agents.length})
        </h3>

        {agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No agents created yet</p>
            <p className="text-sm">Create your first agent to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedAgentId === agent.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                } ${onAgentSelect ? 'cursor-pointer' : ''}`}
                onClick={() => onAgentSelect?.(agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                      {agent.memory_config?.use_knowledge_base && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Knowledge-enabled
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(agent.status)}>
                      {getStatusIcon(agent.status)}
                      <span className="ml-1 capitalize">{agent.status}</span>
                    </Badge>

                    {agent.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeployAgent(agent.id);
                        }}
                      >
                        Deploy
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingAgent(agent);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAgent(agent.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Performance Metrics */}
                {agent.performance_metrics && (
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Executions:</span>
                      <div className="font-medium">{agent.performance_metrics.total_executions}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate:</span>
                      <div className="font-medium">
                        {(agent.performance_metrics.success_rate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Response:</span>
                      <div className="font-medium">
                        {agent.performance_metrics.avg_execution_time_ms.toFixed(0)}ms
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Executions */}
      {executions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Executions
          </h3>

          <div className="space-y-2">
            {executions.slice(0, 10).map((execution) => (
              <div key={execution.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  {getExecutionStatusIcon(execution.status)}
                  <div>
                    <div className="font-medium text-sm">
                      {execution.input_data?.message || 'Execution'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(execution.started_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {execution.status}
                  </Badge>
                  {execution.completed_at && execution.started_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round(
                        (new Date(execution.completed_at).getTime() - 
                         new Date(execution.started_at).getTime()) / 1000
                      )}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AgentRuntimeManager;