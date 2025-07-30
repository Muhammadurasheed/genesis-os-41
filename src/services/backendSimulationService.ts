// Backend simulation service - routes to appropriate microservices
// Use agent service for AI-heavy operations, orchestrator for workflow orchestration
const AGENT_SERVICE_URL = 'http://localhost:8001';
const ORCHESTRATOR_URL = 'http://localhost:3002';

export interface SimulationConfig {
  guildId: string;
  agents: any[];
  durationMinutes: number;
  loadFactor: number;
  errorInjection: boolean;
  testScenarios: string[];
}

export interface SimulationResults {
  simulationId: string;
  agentResponses: any[];
  metrics: any;
  insights: string[];
  recommendations: string[];
}

export class BackendSimulationService {
  async runSimulation(config: SimulationConfig): Promise<SimulationResults> {
    try {
      // Route simulation to agent service for AI processing
      const response = await fetch(`${AGENT_SERVICE_URL}/simulation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guild_id: config.guildId,
          agents: config.agents,
          duration_minutes: config.durationMinutes,
          load_factor: config.loadFactor,
          error_injection: config.errorInjection,
          test_scenarios: config.testScenarios
        })
      });

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`);
      }

      const results = await response.json();
      return results.results;
    } catch (error) {
      console.error('Simulation error:', error);
      throw error;
    }
  }

  async orchestrateSimulation(config: SimulationConfig): Promise<SimulationResults> {
    try {
      // Route to orchestrator for workflow coordination
      const response = await fetch(`${ORCHESTRATOR_URL}/simulation/orchestrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guild_id: config.guildId,
          agents: config.agents,
          duration_minutes: config.durationMinutes,
          load_factor: config.loadFactor,
          error_injection: config.errorInjection,
          test_scenarios: config.testScenarios
        })
      });

      if (!response.ok) {
        throw new Error(`Orchestration failed: ${response.statusText}`);
      }

      const results = await response.json();
      return results.results;
    } catch (error) {
      console.error('Orchestration error:', error);
      throw error;
    }
  }

  async executeAgent(agentId: string, input: string, context: any = {}): Promise<any> {
    try {
      // Route agent execution through orchestrator for load balancing
      const response = await fetch(`${ORCHESTRATOR_URL}/agentDispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: agentId,
          input,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`Agent execution failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Agent execution error:', error);
      throw error;
    }
  }

  async executeWorkflow(workflowId: string, nodes: any[], edges: any[], context: any = {}): Promise<any> {
    try {
      // Route workflow execution to orchestrator
      const response = await fetch(`${ORCHESTRATOR_URL}/realtime/workflow/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          nodes,
          edges,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`Workflow execution failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Workflow execution error:', error);
      throw error;
    }
  }
}

export const backendSimulationService = new BackendSimulationService();