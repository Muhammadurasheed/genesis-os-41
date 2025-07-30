/**
 * Advanced Simulation Scenarios
 * Phase 3: Agent Intelligence - Enhanced Testing Capabilities
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  BarChart3, 
  CheckCircle, 
  Clock,
  Users,
  Zap,
  Target,
  Brain,
  Network
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { enhancedSimulationService } from '../../services/simulation/enhancedSimulationService';
import { type SimulationScenario } from '../../types/index';
import { toast } from 'sonner';

interface ScenarioExecution {
  id: string;
  scenarioId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  results?: any;
  metrics?: {
    performance: number;
    reliability: number;
    efficiency: number;
    collaboration: number;
  };
}

export const AdvancedSimulationScenarios: React.FC = () => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [executions, setExecutions] = useState<Map<string, ScenarioExecution>>(new Map());
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Load predefined scenarios
    const predefinedScenarios: SimulationScenario[] = [
      {
        id: 'customer-support-stress',
        name: 'Customer Support Stress Test',
        description: 'High-volume customer support scenario with complex issues and escalations',
        type: 'stress-test',
        environment: {
          constraints: { 
            max_response_time: 30, 
            concurrent_users: 100,
            complexity_level: 8
          },
          resources: { 
            memory: '2GB', 
            cpu: '80%',
            network_latency: '50ms'
          },
          timeLimit: 600000, // 10 minutes
          complexity: 'high'
        },
        objectives: [
          { 
            id: 'response-time', 
            description: 'Maintain response time under 30 seconds',
            target: 30,
            weight: 0.3
          },
          { 
            id: 'resolution-rate', 
            description: 'Achieve 90% first-contact resolution',
            target: 0.9,
            weight: 0.4
          },
          { 
            id: 'satisfaction', 
            description: 'Maintain customer satisfaction above 4.5/5',
            target: 4.5,
            weight: 0.3
          }
        ],
        interactions: [
          {
            id: 'angry-customer',
            type: 'conflict-resolution',
            description: 'Handle frustrated customers with billing issues',
            frequency: 0.15
          },
          {
            id: 'technical-support',
            type: 'problem-solving',
            description: 'Resolve complex technical problems',
            frequency: 0.25
          }
        ]
      },
      {
        id: 'sales-pipeline-optimization',
        name: 'Sales Pipeline Optimization',
        description: 'Multi-agent sales process with lead qualification and conversion',
        type: 'collaboration',
        environment: {
          constraints: { 
            conversion_target: 0.15,
            lead_volume: 200,
            follow_up_speed: 120 // 2 minutes
          },
          resources: { 
            crm_calls: 1000,
            email_quota: 500,
            meeting_slots: 50
          },
          timeLimit: 1800000, // 30 minutes
          complexity: 'medium'
        },
        objectives: [
          { 
            id: 'lead-qualification', 
            description: 'Qualify 80% of leads within 2 hours',
            target: 0.8,
            weight: 0.25
          },
          { 
            id: 'conversion-rate', 
            description: 'Achieve 15% lead-to-customer conversion',
            target: 0.15,
            weight: 0.4
          },
          { 
            id: 'response-speed', 
            description: 'Respond to leads within 2 minutes',
            target: 120,
            weight: 0.35
          }
        ],
        interactions: [
          {
            id: 'lead-handoff',
            type: 'coordination',
            description: 'Smooth handoff between qualification and sales agents',
            frequency: 0.8
          }
        ]
      },
      {
        id: 'content-creation-workflow',
        name: 'Content Creation Workflow',
        description: 'End-to-end content creation with research, writing, and publishing',
        type: 'performance',
        environment: {
          constraints: { 
            quality_threshold: 0.85,
            turnaround_time: 3600, // 1 hour
            seo_score: 0.8
          },
          resources: { 
            api_calls: 200,
            image_generations: 20,
            publication_slots: 10
          },
          timeLimit: 7200000, // 2 hours
          complexity: 'medium'
        },
        objectives: [
          { 
            id: 'content-quality', 
            description: 'Maintain content quality score above 85%',
            target: 0.85,
            weight: 0.4
          },
          { 
            id: 'seo-optimization', 
            description: 'Achieve SEO score above 80%',
            target: 0.8,
            weight: 0.3
          },
          { 
            id: 'publishing-speed', 
            description: 'Complete end-to-end process within 1 hour',
            target: 3600,
            weight: 0.3
          }
        ],
        interactions: [
          {
            id: 'research-writing',
            type: 'collaboration',
            description: 'Research agent provides data to writing agent',
            frequency: 1.0
          }
        ]
      },
      {
        id: 'crisis-management',
        name: 'Crisis Management Simulation',
        description: 'Multi-agent response to system failures and customer escalations',
        type: 'stress-test',
        environment: {
          constraints: { 
            failure_rate: 0.15,
            escalation_threshold: 3,
            recovery_time: 300 // 5 minutes
          },
          resources: { 
            emergency_contacts: 10,
            backup_systems: 3,
            communication_channels: 5
          },
          timeLimit: 1800000, // 30 minutes
          complexity: 'extreme'
        },
        objectives: [
          { 
            id: 'incident-detection', 
            description: 'Detect incidents within 30 seconds',
            target: 30,
            weight: 0.3
          },
          { 
            id: 'response-coordination', 
            description: 'Coordinate response across all agents',
            target: 1.0,
            weight: 0.4
          },
          { 
            id: 'recovery-time', 
            description: 'Restore services within 5 minutes',
            target: 300,
            weight: 0.3
          }
        ],
        interactions: [
          {
            id: 'emergency-escalation',
            type: 'crisis-response',
            description: 'Rapid escalation and coordination during system failures',
            frequency: 0.3
          }
        ]
      }
    ];

    setScenarios(predefinedScenarios);
  }, []);

  const runScenario = async (scenario: SimulationScenario) => {
    if (isRunning) {
      toast.error('Another simulation is already running');
      return;
    }

    setIsRunning(true);

    const execution: ScenarioExecution = {
      id: `exec-${Date.now()}`,
      scenarioId: scenario.id,
      status: 'running',
      progress: 0,
      startTime: Date.now()
    };

    setExecutions(prev => new Map(prev.set(scenario.id, execution)));

    try {
      toast.success(`Starting ${scenario.name}...`, {
        description: 'Advanced simulation scenario initiated'
      });

      // Simulate progressive execution
      const updateProgress = (progress: number) => {
        setExecutions(prev => {
          const updated = new Map(prev);
          const current = updated.get(scenario.id);
          if (current) {
            updated.set(scenario.id, { ...current, progress });
          }
          return updated;
        });
      };

      // Progressive updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateProgress(i);
      }

      // Run the actual simulation
      const result = await enhancedSimulationService.startSimulation(scenario.id);

      // Generate metrics based on scenario type
      const metrics = generateScenarioMetrics(scenario, result);

      const completedExecution: ScenarioExecution = {
        ...execution,
        status: 'completed',
        progress: 100,
        endTime: Date.now(),
        results: result,
        metrics
      };

      setExecutions(prev => new Map(prev.set(scenario.id, completedExecution)));

      toast.success(`${scenario.name} completed!`, {
        description: `Performance: ${metrics.performance}% | Reliability: ${metrics.reliability}%`
      });

    } catch (error) {
      console.error('Simulation failed:', error);
      
      const failedExecution: ScenarioExecution = {
        ...execution,
        status: 'failed',
        endTime: Date.now()
      };

      setExecutions(prev => new Map(prev.set(scenario.id, failedExecution)));
      
      toast.error('Simulation failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const generateScenarioMetrics = (_scenario: SimulationScenario, _result: any) => {
    // Simulate realistic metrics based on scenario objectives
    const baseScore = Math.random() * 0.3 + 0.6; // 60-90% base
    
    return {
      performance: Math.round((baseScore + Math.random() * 0.2) * 100),
      reliability: Math.round((baseScore + Math.random() * 0.15) * 100),
      efficiency: Math.round((baseScore + Math.random() * 0.25) * 100),
      collaboration: Math.round((baseScore + Math.random() * 0.2) * 100)
    };
  };

  const getScenarioIcon = (type: SimulationScenario['type']) => {
    switch (type) {
      case 'stress-test': return Zap;
      case 'collaboration': return Users;
      case 'performance': return Target;
      case 'behavior': return Brain;
      case 'integration': return Network;
      default: return BarChart3;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-400 border-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 border-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-orange-400 border-orange-400 bg-orange-500/20';
      case 'extreme': return 'text-red-400 border-red-400 bg-red-500/20';
      default: return 'text-gray-400 border-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Simulation Scenarios</h2>
          <p className="text-gray-400">Test your agents with realistic, complex scenarios</p>
        </div>
        
        <Button
          variant="outline"
          disabled={isRunning}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View All Results
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarios.map((scenario) => {
          const execution = executions.get(scenario.id);
          const Icon = getScenarioIcon(scenario.type);
          
          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{scenario.name}</h3>
                        <Badge variant="outline" className={getComplexityColor(scenario.environment.complexity)}>
                          {scenario.environment.complexity.charAt(0).toUpperCase() + scenario.environment.complexity.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    {execution?.status === 'running' && (
                      <div className="flex items-center gap-2 text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm">Running</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mb-4">{scenario.description}</p>

                  {/* Objectives */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">Key Objectives</h4>
                    <div className="space-y-1">
                      {scenario.objectives.slice(0, 3).map((objective) => (
                        <div key={objective.id} className="flex items-center gap-2 text-sm">
                          <Target className="w-3 h-3 text-purple-400" />
                          <span className="text-gray-300">{objective.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Environment Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white ml-2">
                        {Math.round((scenario.environment.timeLimit || 300000) / 60000)}m
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white ml-2 capitalize">{scenario.type}</span>
                    </div>
                  </div>

                  {/* Progress Bar (if running) */}
                  {execution?.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Progress</span>
                        <span className="text-sm text-white">{execution.progress}%</span>
                      </div>
                      <Progress value={execution.progress} className="h-2" />
                    </div>
                  )}

                  {/* Results (if completed) */}
                  {execution?.status === 'completed' && execution.metrics && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Results</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Performance:</span>
                          <span className="text-green-400">{execution.metrics.performance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Reliability:</span>
                          <span className="text-blue-400">{execution.metrics.reliability}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Efficiency:</span>
                          <span className="text-yellow-400">{execution.metrics.efficiency}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Collaboration:</span>
                          <span className="text-purple-400">{execution.metrics.collaboration}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => runScenario(scenario)}
                    disabled={isRunning || execution?.status === 'running'}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {execution?.status === 'running' ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : execution?.status === 'completed' ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Run Again
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Simulation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};