
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '../../../stores/wizardStore';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Progress } from '../../ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Activity, 
  Brain, 
  Users, 
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { agentSimulationService } from '../../../services/ai/agentSimulationService';
import { multiModelReasoningService } from '../../../services/ai/multiModelReasoningService';

interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  currentScenario?: string;
  startTime?: number;
  results: any[];
  voiceActive: boolean;
  agentConversations: Array<{
    agent: string;
    message: string;
    timestamp: string;
    type: 'user' | 'agent';
  }>;
}

export const SimulationStep: React.FC = () => {
  const { nextStep, blueprint } = useWizardStore();
  
  const [simulation, setSimulation] = useState<SimulationState>({
    status: 'idle',
    progress: 0,
    results: [],
    voiceActive: false,
    agentConversations: []
  });

  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [voiceMessage, setVoiceMessage] = useState<string>('');

  // Initialize agents from blueprint
  const agents = blueprint?.suggested_structure?.agents || [];

  const startSimulation = useCallback(async () => {
    if (!blueprint) {
      toast.error('No blueprint available for simulation');
      return;
    }

    setSimulation(prev => ({
      ...prev,
      status: 'running',
      progress: 0,
      startTime: Date.now(),
      results: []
    }));

    toast.success('Starting simulation lab...', {
      description: 'Your AI agents are now being tested in realistic scenarios'
    });

    try {
      // Get default simulation scenarios
      const scenarios = agentSimulationService.getDefaultScenarios();
      const results: any[] = [];

      // Run scenarios sequentially with progress updates
      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        
        setSimulation(prev => ({
          ...prev,
          currentScenario: scenario.name,
          progress: (i / scenarios.length) * 100
        }));

        // Simulate the scenario
        const result = await agentSimulationService.runSimulation({
          scenario: scenario.id,
          realTime: true
        });

        results.push(result);

        // Add some agent conversation simulation
        addAgentConversation(
          scenario.participants[0] || 'Agent',
          `Completed ${scenario.name} scenario with ${(result.metrics.successRate * 100).toFixed(1)}% success rate`,
          'agent'
        );

        // Wait a bit between scenarios
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setSimulation(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        results
      }));

      toast.success('Simulation completed successfully!', {
        description: `All scenarios completed with ${results.length} test results`
      });

    } catch (error) {
      console.error('❌ Simulation failed:', error);
      
      setSimulation(prev => ({
        ...prev,
        status: 'failed',
        progress: 0
      }));

      toast.error('Simulation failed', {
        description: (error as Error).message || 'Unknown error occurred'
      });
    }
  }, [blueprint, simulation.voiceActive]);

  const pauseSimulation = useCallback(() => {
    setSimulation(prev => ({
      ...prev,
      status: 'paused'
    }));
    toast.info('Simulation paused');
  }, []);

  const stopSimulation = useCallback(() => {
    setSimulation(prev => ({
      ...prev,
      status: 'idle',
      progress: 0,
      currentScenario: undefined
    }));
    toast.info('Simulation stopped');
  }, []);

  const toggleVoice = useCallback(() => {
    setSimulation(prev => ({
      ...prev,
      voiceActive: !prev.voiceActive
    }));

    if (!simulation.voiceActive) {
      toast.success('Voice interaction enabled', {
        description: 'You can now talk to your AI agents during simulation'
      });
    } else {
      toast.info('Voice interaction disabled');
    }
  }, [simulation.voiceActive]);

  const addAgentConversation = useCallback((agent: string, message: string, type: 'user' | 'agent') => {
    setSimulation(prev => ({
      ...prev,
      agentConversations: [
        ...prev.agentConversations,
        {
          agent,
          message,
          timestamp: new Date().toISOString(),
          type
        }
      ].slice(-50) // Keep only last 50 messages
    }));
  }, []);

  const talkToAgent = useCallback(async (agentName: string, message: string) => {
    if (!message.trim()) return;

    // Add user message
    addAgentConversation('You', message, 'user');

    try {
      // Use multi-model reasoning to generate agent response
      const response = await multiModelReasoningService.reasonWithConsensus(
        `You are ${agentName}, an AI agent in a simulation. Respond to this message naturally and helpfully: "${message}"`,
        {
          requiredCapabilities: ['reasoning', 'creativity'],
          modelIds: ['claude-sonnet-4-20250514', 'gpt-4.1-2025-04-14'],
          minConsensus: 0.6
        }
      );

      // Add agent response
      addAgentConversation(agentName, response.finalAnswer, 'agent');

    } catch (error) {
      console.error('❌ Error talking to agent:', error);
      addAgentConversation(agentName, 'I apologize, but I\'m having trouble responding right now. Please try again.', 'agent');
    }
  }, [addAgentConversation]);

  const proceedToDeployment = useCallback(() => {
    if (simulation.status !== 'completed') {
      toast.error('Please complete the simulation first');
      return;
    }

    const avgSuccessRate = simulation.results.reduce((sum, r) => sum + (r.metrics?.successRate || 0), 0) / simulation.results.length;
    
    if (avgSuccessRate < 0.7) {
      toast.warning('Simulation shows some issues', {
        description: 'Consider optimizing your agents before deployment'
      });
    }

    toast.success('Proceeding to deployment...', {
      description: 'Your agents are ready for production!'
    });

    nextStep('deployment');
  }, [simulation, nextStep]);

  // Calculate overall metrics
  const overallMetrics = React.useMemo(() => {
    if (simulation.results.length === 0) return null;

    const avgSuccessRate = simulation.results.reduce((sum, r) => sum + (r.metrics?.successRate || 0), 0) / simulation.results.length;
    const avgResponseTime = simulation.results.reduce((sum, r) => sum + (r.metrics?.performance?.response_time || 0), 0) / simulation.results.length;
    const totalErrors = simulation.results.reduce((sum, r) => sum + (r.metrics?.performance?.error_rate || 0), 0);
    const totalInteractions = simulation.results.reduce((sum, r) => sum + (r.metrics?.totalInteractions || 0), 0);

    return {
      successRate: avgSuccessRate * 100,
      responseTime: avgResponseTime,
      totalErrors,
      totalInteractions,
      status: avgSuccessRate > 0.9 ? 'excellent' : avgSuccessRate > 0.7 ? 'good' : 'needs_improvement'
    };
  }, [simulation.results]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Simulation Lab
          </h1>
          <p className="text-gray-300 text-lg">
            Test your AI agents in realistic scenarios before deployment. 
            Talk to them, stress test them, and ensure they're ready for production.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Simulation Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Control Panel */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Simulation Control
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Control your simulation environment and monitor agent behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                {simulation.status !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Progress</span>
                      <span>{simulation.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={simulation.progress} className="h-2" />
                    {simulation.currentScenario && (
                      <p className="text-sm text-purple-300">
                        Running: {simulation.currentScenario}
                      </p>
                    )}
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex gap-3">
                  {simulation.status === 'idle' && (
                    <Button onClick={startSimulation} className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Start Simulation
                    </Button>
                  )}
                  
                  {simulation.status === 'running' && (
                    <>
                      <Button onClick={pauseSimulation} variant="outline" className="border-white/20 text-white">
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                      <Button onClick={stopSimulation} variant="outline" className="border-red-500/20 text-red-300">
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}

                  <Button
                    onClick={toggleVoice}
                    variant="outline"
                    className={`border-white/20 ${
                      simulation.voiceActive 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {simulation.voiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    Voice Chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Dashboard */}
            {overallMetrics && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        overallMetrics.status === 'excellent' ? 'text-green-400' :
                        overallMetrics.status === 'good' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {overallMetrics.successRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-300">Success Rate</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {overallMetrics.responseTime.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-gray-300">Avg Response</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {overallMetrics.totalErrors}
                      </div>
                      <div className="text-sm text-gray-300">Total Errors</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {overallMetrics.totalInteractions}
                      </div>
                      <div className="text-sm text-gray-300">Interactions</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {overallMetrics.status === 'excellent' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : overallMetrics.status === 'good' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white">
                      {overallMetrics.status === 'excellent' ? 'Excellent Performance - Ready for Deployment' :
                       overallMetrics.status === 'good' ? 'Good Performance - Minor Optimizations Recommended' :
                       'Needs Improvement - Consider Agent Optimization'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Agent Interaction Panel */}
          <div className="space-y-6">
            {/* Agent List */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Your AI Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agents.map((agent, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedAgent === agent.name
                        ? 'bg-purple-500/20 border-purple-500/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedAgent(agent.name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{agent.name}</div>
                        <div className="text-xs text-gray-400">{agent.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Voice Chat */}
            {simulation.voiceActive && selectedAgent && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    Chat with {selectedAgent}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conversation History */}
                  <div className="h-48 overflow-y-auto space-y-2 bg-black/20 rounded-lg p-3">
                    <AnimatePresence>
                      {simulation.agentConversations
                        .filter(conv => conv.agent === selectedAgent || conv.agent === 'You')
                        .slice(-10)
                        .map((conversation, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${conversation.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs p-2 rounded-lg text-sm ${
                            conversation.type === 'user'
                              ? 'bg-purple-500/20 text-purple-100'
                              : 'bg-green-500/20 text-green-100'
                          }`}>
                            <div className="font-medium text-xs opacity-75 mb-1">
                              {conversation.agent}
                            </div>
                            {conversation.message}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voiceMessage}
                      onChange={(e) => setVoiceMessage(e.target.value)}
                      placeholder={`Talk to ${selectedAgent}...`}
                      className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && voiceMessage.trim()) {
                          talkToAgent(selectedAgent, voiceMessage);
                          setVoiceMessage('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (voiceMessage.trim()) {
                          talkToAgent(selectedAgent, voiceMessage);
                          setVoiceMessage('');
                        }
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Deploy Button */}
        {simulation.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <Button
              onClick={proceedToDeployment}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Zap className="w-5 h-5 mr-2" />
              Deploy Your Guild
            </Button>
            <p className="text-gray-300 mt-2">
              Your agents have been tested and are ready for production deployment
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
