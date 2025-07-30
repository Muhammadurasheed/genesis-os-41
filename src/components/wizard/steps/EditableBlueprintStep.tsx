import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2,
  Users, 
  Workflow, 
  Target,
  DollarSign,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Brain,
  Zap
} from 'lucide-react';
import { Blueprint } from '../../../types';

// Master Blueprint: Editable Blueprint Component with Enhanced Structure
export const EditableBlueprintStep: React.FC = () => {
  const { blueprint, setBlueprint, nextStep } = useWizardStore();
  const [editingBlueprint, setEditingBlueprint] = useState<Blueprint | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    agents: true,
    workflows: true,
    thought_process: false
  });

  if (!blueprint) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <GlassCard variant="medium" className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-white text-lg">No blueprint available. Please go back and create one.</p>
        </GlassCard>
      </div>
    );
  }

  const handleEditStart = () => {
    setEditingBlueprint(JSON.parse(JSON.stringify(blueprint)));
  };

  const handleEditCancel = () => {
    setEditingBlueprint(null);
  };

  const handleEditSave = () => {
    if (editingBlueprint) {
      setBlueprint(editingBlueprint);
      setEditingBlueprint(null);
    }
  };

  const updateEditingBlueprint = (path: string, value: any) => {
    if (!editingBlueprint) return;
    
    const keys = path.split('.');
    const updated = { ...editingBlueprint };
    let current: any = updated;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setEditingBlueprint(updated);
  };

  const addAgent = () => {
    if (!editingBlueprint) return;
    
    const newAgent = {
      name: "New Agent",
      role: "Specialist",
      description: "A new intelligent agent to help with business operations",
      tools_needed: ["API Access", "Database"]
    };
    
    const updated = { ...editingBlueprint };
    updated.suggested_structure.agents.push(newAgent);
    setEditingBlueprint(updated);
  };

  const removeAgent = (index: number) => {
    if (!editingBlueprint) return;
    
    const updated = { ...editingBlueprint };
    updated.suggested_structure.agents.splice(index, 1);
    setEditingBlueprint(updated);
  };

  const addWorkflow = () => {
    if (!editingBlueprint) return;
    
    const newWorkflow = {
      name: "New Workflow",
      description: "A new automated workflow",
      trigger_type: "schedule" as const
    };
    
    const updated = { ...editingBlueprint };
    updated.suggested_structure.workflows.push(newWorkflow);
    setEditingBlueprint(updated);
  };

  const removeWorkflow = (index: number) => {
    if (!editingBlueprint) return;
    
    const updated = { ...editingBlueprint };
    updated.suggested_structure.workflows.splice(index, 1);
    setEditingBlueprint(updated);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const currentBlueprint = editingBlueprint || blueprint;
  const isEditing = !!editingBlueprint;

  // Generate AI thought process explanation
  const generateThoughtProcess = () => {
    const agents = currentBlueprint.suggested_structure.agents;
    const workflows = currentBlueprint.suggested_structure.workflows;
    
    return {
      analysis: `I analyzed your business requirements and identified ${agents.length} key roles that need automation and ${workflows.length} critical processes that can be optimized.`,
      agent_reasoning: agents.map(agent => ({
        agent: agent.name,
        why_needed: `${agent.role} is essential for ${agent.description.toLowerCase()}`,
        tool_justification: agent.tools_needed.map(tool => ({
          tool,
          reason: `${tool} enables ${agent.name} to perform ${agent.role.toLowerCase()} tasks efficiently`
        }))
      })),
      workflow_reasoning: workflows.map(workflow => ({
        workflow: workflow.name,
        trigger_choice: workflow.trigger_type === 'webhook' ? 'Real-time trigger chosen for immediate response to events' : 'Scheduled trigger chosen for consistent, periodic execution',
        business_impact: `This workflow will streamline ${workflow.description.toLowerCase()} and reduce manual effort`
      })),
      cost_breakdown: {
        base_cost: agents.length * 45,
        tool_costs: agents.reduce((total, agent) => total + (agent.tools_needed.length * 15), 0),
        workflow_costs: workflows.length * 25,
        total: agents.length * 45 + agents.reduce((total, agent) => total + (agent.tools_needed.length * 15), 0) + workflows.length * 25
      }
    };
  };

  const thoughtProcess = generateThoughtProcess();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mr-4" />
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">AI Blueprint Generated</h2>
              <p className="text-gray-300">Review, edit, and approve your intelligent business architecture</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <HolographicButton variant="secondary" onClick={handleEditCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </HolographicButton>
                <HolographicButton variant="primary" onClick={handleEditSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </HolographicButton>
              </>
            ) : (
              <HolographicButton variant="secondary" onClick={handleEditStart}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Blueprint
              </HolographicButton>
            )}
          </div>
        </div>

        {/* Guild Overview */}
        <GlassCard variant="medium" className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('overview')}
          >
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Brain className="w-6 h-6 text-purple-400 mr-3" />
              Guild Overview
            </h3>
            {expandedSections.overview ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          
          <AnimatePresence>
            {expandedSections.overview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Guild Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentBlueprint.suggested_structure.guild_name}
                        onChange={(e) => updateEditingBlueprint('suggested_structure.guild_name', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                      />
                    ) : (
                      <p className="text-white text-lg font-semibold">{currentBlueprint.suggested_structure.guild_name}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{currentBlueprint.suggested_structure.agents.length}</div>
                      <div className="text-sm text-gray-300">AI Agents</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                      <Workflow className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{currentBlueprint.suggested_structure.workflows.length}</div>
                      <div className="text-sm text-gray-300">Workflows</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                      <DollarSign className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">${thoughtProcess.cost_breakdown.total}</div>
                      <div className="text-sm text-gray-300">Est. Monthly</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Guild Purpose</label>
                  {isEditing ? (
                    <textarea
                      value={currentBlueprint.suggested_structure.guild_purpose}
                      onChange={(e) => updateEditingBlueprint('suggested_structure.guild_purpose', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 h-24 resize-none"
                    />
                  ) : (
                    <p className="text-gray-300">{currentBlueprint.suggested_structure.guild_purpose}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">AI Understanding</label>
                  {isEditing ? (
                    <textarea
                      value={currentBlueprint.interpretation}
                      onChange={(e) => updateEditingBlueprint('interpretation', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 h-24 resize-none"
                    />
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-gray-300">{currentBlueprint.interpretation}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* AI Agents */}
        <GlassCard variant="medium" className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('agents')}
          >
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Users className="w-6 h-6 text-blue-400 mr-3" />
              AI Agents ({currentBlueprint.suggested_structure.agents.length})
            </h3>
            <div className="flex items-center space-x-2">
              {isEditing && (
                <HolographicButton variant="secondary" size="sm" onClick={addAgent}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Agent
                </HolographicButton>
              )}
              {expandedSections.agents ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>
          
          <AnimatePresence>
            {expandedSections.agents && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {currentBlueprint.suggested_structure.agents.map((agent, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Agent Name</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={agent.name}
                                onChange={(e) => updateEditingBlueprint(`suggested_structure.agents.${index}.name`, e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                              />
                            ) : (
                              <p className="font-semibold text-white">{agent.name}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={agent.role}
                                onChange={(e) => updateEditingBlueprint(`suggested_structure.agents.${index}.role`, e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                              />
                            ) : (
                              <p className="text-sm text-blue-300">{agent.role}</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                          {isEditing ? (
                            <textarea
                              value={agent.description}
                              onChange={(e) => updateEditingBlueprint(`suggested_structure.agents.${index}.description`, e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 h-16 resize-none"
                            />
                          ) : (
                            <p className="text-gray-300 text-sm">{agent.description}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                            <Settings className="w-4 h-4 mr-1" />
                            Required Tools & Justification
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {agent.tools_needed.map((tool, toolIndex) => {
                              const justification = thoughtProcess.agent_reasoning[index]?.tool_justification[toolIndex];
                              return (
                                <div key={toolIndex} className="bg-white/5 rounded p-2 border border-white/10">
                                  <div className="flex items-center justify-between">
                                    <span className="text-purple-300 font-medium text-sm">{tool}</span>
                                    <Zap className="w-3 h-3 text-yellow-400" />
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">{justification?.reason}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <button
                          onClick={() => removeAgent(index)}
                          className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Workflows */}
        <GlassCard variant="medium" className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('workflows')}
          >
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Workflow className="w-6 h-6 text-purple-400 mr-3" />
              Workflows ({currentBlueprint.suggested_structure.workflows.length})
            </h3>
            <div className="flex items-center space-x-2">
              {isEditing && (
                <HolographicButton variant="secondary" size="sm" onClick={addWorkflow}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Workflow
                </HolographicButton>
              )}
              {expandedSections.workflows ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>
          
          <AnimatePresence>
            {expandedSections.workflows && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {currentBlueprint.suggested_structure.workflows.map((workflow, index) => {
                  const reasoning = thoughtProcess.workflow_reasoning[index];
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Workflow Name</label>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={workflow.name}
                                  onChange={(e) => updateEditingBlueprint(`suggested_structure.workflows.${index}.name`, e.target.value)}
                                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                                />
                              ) : (
                                <p className="font-semibold text-white">{workflow.name}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Trigger Type</label>
                              {isEditing ? (
                                <select
                                  value={workflow.trigger_type}
                                  onChange={(e) => updateEditingBlueprint(`suggested_structure.workflows.${index}.trigger_type`, e.target.value)}
                                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                                >
                                  <option value="webhook">Real-time (Webhook)</option>
                                  <option value="schedule">Scheduled</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  workflow.trigger_type === 'webhook' 
                                    ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                                }`}>
                                  {workflow.trigger_type === 'webhook' ? 'Real-time' : 'Scheduled'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                            {isEditing ? (
                              <textarea
                                value={workflow.description}
                                onChange={(e) => updateEditingBlueprint(`suggested_structure.workflows.${index}.description`, e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 h-16 resize-none"
                              />
                            ) : (
                              <p className="text-gray-300 text-sm">{workflow.description}</p>
                            )}
                          </div>

                          <div className="bg-white/5 rounded p-3 border border-white/5">
                            <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                              <Lightbulb className="w-4 h-4 mr-1 text-yellow-400" />
                              AI Reasoning
                            </h5>
                            <p className="text-xs text-gray-400 mb-1">{reasoning?.trigger_choice}</p>
                            <p className="text-xs text-gray-400">{reasoning?.business_impact}</p>
                          </div>
                        </div>
                        
                        {isEditing && (
                          <button
                            onClick={() => removeWorkflow(index)}
                            className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* AI Thought Process */}
        <GlassCard variant="medium" className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('thought_process')}
          >
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Brain className="w-6 h-6 text-yellow-400 mr-3" />
              AI Thought Process & Cost Analysis
            </h3>
            {expandedSections.thought_process ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          
          <AnimatePresence>
            {expandedSections.thought_process && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Overall Analysis</h4>
                  <p className="text-gray-300 text-sm">{thoughtProcess.analysis}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-green-400" />
                      Cost Breakdown
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Base agent costs:</span>
                        <span className="text-white">${thoughtProcess.cost_breakdown.base_cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Tool integrations:</span>
                        <span className="text-white">${thoughtProcess.cost_breakdown.tool_costs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Workflow processing:</span>
                        <span className="text-white">${thoughtProcess.cost_breakdown.workflow_costs}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-white">Total monthly:</span>
                          <span className="text-emerald-400">${thoughtProcess.cost_breakdown.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                      Architecture Highlights
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        <span className="text-gray-300">Scalable agent architecture</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                        <span className="text-gray-300">Intelligent workflow triggers</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="text-gray-300">Cost-optimized tool selection</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                        <span className="text-gray-300">Business-focused automation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Actions */}
        <div className="flex justify-between">
          <HolographicButton variant="secondary" onClick={() => window.history.back()}>
            Back to Intent
          </HolographicButton>
          
          <HolographicButton variant="primary" onClick={() => nextStep('canvas')} glow>
            <CheckCircle className="w-5 h-5 mr-2" />
            Approve & Continue to Canvas
          </HolographicButton>
        </div>
      </motion.div>
    </div>
  );
};