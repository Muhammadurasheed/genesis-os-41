
import dotenv from 'dotenv';
import AgentExecutionService from './agent/agentExecutionService';
import AgentConfigurationService from './agent/agentConfigurationService';
import BlueprintGenerationService from './agent/blueprintGenerationService';

dotenv.config();

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';

class AgentService {
  private executionService: AgentExecutionService;
  private configurationService: AgentConfigurationService;
  private blueprintService: BlueprintGenerationService;

  constructor() {
    this.executionService = new AgentExecutionService(AGENT_SERVICE_URL);
    this.configurationService = new AgentConfigurationService(AGENT_SERVICE_URL);
    this.blueprintService = new BlueprintGenerationService(AGENT_SERVICE_URL);
    
    console.log(`🤖 Agent Service initialized with URL: ${AGENT_SERVICE_URL}`);
  }

  // Execution methods
  public async executeAgent(
    agent_id: string,
    input: string,
    context: Record<string, any> = {}
  ) {
    return this.executionService.executeAgent(agent_id, input, context);
  }

  // Configuration methods
  public async configureAgent(agent_id: string, config: any) {
    return this.configurationService.configureAgent(agent_id, config);
  }

  public async clearAgentMemory(agent_id: string) {
    return this.configurationService.clearAgentMemory(agent_id);
  }

  public async getAgentMemories(agent_id: string, limit: number = 10) {
    return this.configurationService.getAgentMemories(agent_id, limit);
  }

  // Blueprint and AI methods
  public async generateBlueprint(userInput: string) {
    return this.blueprintService.generateBlueprint(userInput);
  }

  public async synthesizeSpeech(text: string, voice_id?: string) {
    return this.blueprintService.synthesizeSpeech(text, voice_id);
  }

  public async checkHealth() {
    return this.blueprintService.checkHealth();
  }
}

// Create singleton instance
const agentService = new AgentService();
export default agentService;
