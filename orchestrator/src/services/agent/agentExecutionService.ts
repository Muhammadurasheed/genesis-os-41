
import axios, { AxiosInstance } from 'axios';
import memoryService from '../memoryService';

// Interface for agent execution input
interface AgentExecutionInput {
  input: string;
  context?: Record<string, any>;
}

// Interface for agent execution output
interface AgentExecutionOutput {
  output: string;
  chain_of_thought: string;
  status: string;
  audio?: string;
}

class AgentExecutionService {
  private apiClient: AxiosInstance;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(baseURL: string) {
    this.apiClient = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Execute an agent with the given input
   */
  public async executeAgent(
    agent_id: string,
    input: string,
    context: Record<string, any> = {}
  ): Promise<AgentExecutionOutput> {
    // Add execution ID if not present
    if (!context.executionId) {
      context.executionId = `exec-${Date.now()}`;
    }
    
    const agentInput: AgentExecutionInput = { input, context };
    
    console.log(`🤖 Executing agent ${agent_id} with input: ${input.substring(0, 50)}...`);
    
    // Try to execute the agent with retries
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.apiClient.post(
          `/agent/${agent_id}/execute`,
          agentInput
        );
        
        const result = response.data as AgentExecutionOutput;
        console.log(`✅ Agent ${agent_id} executed successfully`);
        
        // Store in memory if enabled
        if (context.memory_enabled !== false) {
          await this.storeAgentMemory(agent_id, input, result, context);
        }
        
        return result;
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt}/${this.retryAttempts} - Error executing agent ${agent_id}:`, error.message);
        
        if (attempt === this.retryAttempts) {
          return this.getFallbackResponse(agent_id, input);
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
    
    return this.getFallbackResponse(agent_id, input);
  }

  private async storeAgentMemory(
    agent_id: string,
    input: string,
    result: AgentExecutionOutput,
    context: Record<string, any>
  ): Promise<void> {
    try {
      const memoryContent = JSON.stringify({
        user_input: input,
        agent_response: result.output,
        agent_id,
        execution_id: context.executionId
      });
      
      await memoryService.storeMemory(
        agent_id,
        memoryContent,
        'interaction',
        { execution_id: context.executionId },
        0.7,
        context.user_id
      );
    } catch (error) {
      console.warn('⚠️ Failed to store agent memory:', error);
    }
  }

  private getFallbackResponse(_agent_id: string, input: string): AgentExecutionOutput {
    return {
      output: `I processed your request about "${input}" and have generated a response using my fallback capabilities. For optimal results, please ensure the agent service is running.`,
      chain_of_thought: "Using fallback response generator since agent service is unavailable.",
      status: "completed_fallback"
    };
  }
}

export default AgentExecutionService;
