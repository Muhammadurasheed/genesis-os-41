/**
 * Agent Memory Service - Frontend version without Redis
 * This handles agent memory management on the frontend side
 */

interface MemoryEntry {
  id: string;
  agent_id: string;
  content: string;
  type: string;
  importance: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ConversationHistory {
  messages: Array<{
    role: string;
    content: string;
    timestamp: number;
  }>;
  context: Record<string, any>;
}

class AgentMemoryService {
  private memories: Map<string, MemoryEntry[]> = new Map();
  private conversations: Map<string, ConversationHistory> = new Map();

  async getConversationContext(agentId: string, sessionId: string, initialPrompt: string): Promise<any> {
    const history = await this.getConversationHistory(agentId);
    return {
      sessionId,
      agentId,
      initialPrompt,
      history: history ? history.messages : [],
      context: history ? history.context : {}
    };
  }

  async storeMemory(
    agentId: string,
    content: string,
    type: string = 'interaction',
    metadata?: Record<string, any>,
    importance: number = 0.5
  ): Promise<string> {
    const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: MemoryEntry = {
      id: memoryId,
      agent_id: agentId,
      content,
      type,
      importance,
      timestamp: Date.now(),
      metadata
    };

    if (!this.memories.has(agentId)) {
      this.memories.set(agentId, []);
    }

    this.memories.get(agentId)!.push(memory);
    
    // Keep only the most recent 100 memories per agent to prevent memory bloat
    const agentMemories = this.memories.get(agentId)!;
    if (agentMemories.length > 100) {
      agentMemories.splice(0, agentMemories.length - 100);
    }

    console.log(`✅ Memory stored for agent ${agentId}: ${memoryId}`);
    return memoryId;
  }

  async getRecentMemories(agentId: string, limit: number = 10): Promise<MemoryEntry[]> {
    const agentMemories = this.memories.get(agentId) || [];
    return agentMemories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getImportantMemories(agentId: string, limit: number = 10): Promise<MemoryEntry[]> {
    const agentMemories = this.memories.get(agentId) || [];
    return agentMemories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  async searchMemories(agentId: string, query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const agentMemories = this.memories.get(agentId) || [];
    const queryLower = query.toLowerCase();
    
    return agentMemories
      .filter(memory => memory.content.toLowerCase().includes(queryLower))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  async storeConversation(agentId: string, messages: any[], context: Record<string, any> = {}): Promise<void> {
    const conversation: ConversationHistory = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: Date.now()
      })),
      context
    };

    this.conversations.set(agentId, conversation);
    console.log(`✅ Conversation stored for agent ${agentId}`);
  }

  async getConversationHistory(agentId: string): Promise<ConversationHistory | null> {
    return this.conversations.get(agentId) || null;
  }

  async clearAgentMemories(agentId: string): Promise<void> {
    this.memories.delete(agentId);
    this.conversations.delete(agentId);
    console.log(`✅ Memories cleared for agent ${agentId}`);
  }

  async getMemoryStats(agentId: string): Promise<{
    totalMemories: number;
    averageImportance: number;
    memoryTypes: Record<string, number>;
  }> {
    const agentMemories = this.memories.get(agentId) || [];
    
    const stats = {
      totalMemories: agentMemories.length,
      averageImportance: 0,
      memoryTypes: {} as Record<string, number>
    };

    if (agentMemories.length > 0) {
      stats.averageImportance = agentMemories.reduce((sum, m) => sum + m.importance, 0) / agentMemories.length;
      
      agentMemories.forEach(memory => {
        stats.memoryTypes[memory.type] = (stats.memoryTypes[memory.type] || 0) + 1;
      });
    }

    return stats;
  }
}

// Create singleton instance
const agentMemoryService = new AgentMemoryService();

export default agentMemoryService;
