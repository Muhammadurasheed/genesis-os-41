import { EventEmitter } from 'events';

interface MemoryEntry {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working';
  content: string;
  context: {
    agentId: string;
    sessionId: string;
    timestamp: string;
    location?: string;
    participants?: string[];
    tags: string[];
  };
  importance: number;
  embedding: number[];
  associations: string[]; // IDs of related memories
  accessCount: number;
  lastAccessed: string;
  decay: number; // Memory strength decay factor
}

interface MemoryQuery {
  query: string;
  type?: MemoryEntry['type'];
  agentId?: string;
  timeRange?: { start: string; end: string };
  importance?: { min: number; max: number };
  limit?: number;
  includeAssociations?: boolean;
}

interface ConsolidationRule {
  id: string;
  name: string;
  condition: (memories: MemoryEntry[]) => boolean;
  action: (memories: MemoryEntry[]) => Promise<MemoryEntry[]> | MemoryEntry[];
  priority: number;
}

class AdvancedMemoryService extends EventEmitter {
  private memories: Map<string, MemoryEntry> = new Map();
  private associations: Map<string, Set<string>> = new Map();
  private consolidationRules: ConsolidationRule[] = [];
  private forgettingCurve: Map<string, number> = new Map();
  private lastConsolidation = Date.now();

  constructor() {
    super();
    this.initializeConsolidationRules();
    this.startPeriodicConsolidation();
  }

  // Core Memory Operations
  async storeMemory(
    content: string,
    type: MemoryEntry['type'],
    context: Partial<MemoryEntry['context']>,
    importance: number = 0.5
  ): Promise<string> {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: MemoryEntry = {
      id: memoryId,
      type,
      content,
      context: {
        agentId: context.agentId || 'unknown',
        sessionId: context.sessionId || 'default',
        timestamp: new Date().toISOString(),
        location: context.location,
        participants: context.participants || [],
        tags: context.tags || []
      },
      importance,
      embedding: await this.generateMemoryEmbedding(content),
      associations: [],
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
      decay: 1.0
    };

    // Find and create associations with existing memories
    await this.createAssociations(memory);

    this.memories.set(memoryId, memory);
    this.emit('memoryStored', { memoryId, type, importance });

    // Trigger consolidation if needed
    if (this.shouldTriggerConsolidation()) {
      this.consolidateMemories();
    }

    return memoryId;
  }

  async retrieveMemories(query: MemoryQuery): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateMemoryEmbedding(query.query);
    const candidates: Array<{ memory: MemoryEntry; score: number }> = [];

    for (const memory of this.memories.values()) {
      if (!this.matchesQuery(memory, query)) continue;

      const similarity = this.calculateSimilarity(queryEmbedding, memory.embedding);
      const relevanceScore = this.calculateRelevanceScore(memory, query, similarity);
      
      candidates.push({ memory, score: relevanceScore });
    }

    // Sort by relevance and apply forgetting curve
    candidates.sort((a, b) => b.score - a.score);
    
    let results = candidates
      .slice(0, query.limit || 20)
      .map(c => c.memory);

    // Update access patterns
    for (const memory of results) {
      await this.updateAccessPattern(memory.id);
    }

    // Include associations if requested
    if (query.includeAssociations) {
      results = await this.expandWithAssociations(results);
    }

    this.emit('memoryRetrieved', { 
      queryType: query.type, 
      resultsCount: results.length,
      agentId: query.agentId 
    });

    return results;
  }

  async updateMemory(memoryId: string, updates: Partial<MemoryEntry>): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) throw new Error(`Memory ${memoryId} not found`);

    const updatedMemory = { ...memory, ...updates };
    
    // Regenerate embedding if content changed
    if (updates.content && updates.content !== memory.content) {
      updatedMemory.embedding = await this.generateMemoryEmbedding(updates.content);
      // Update associations
      await this.updateAssociations(updatedMemory);
    }

    this.memories.set(memoryId, updatedMemory);
    this.emit('memoryUpdated', { memoryId, updates: Object.keys(updates) });
  }

  async deleteMemory(memoryId: string): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) return;

    // Remove all associations
    this.removeAssociations(memoryId);
    this.memories.delete(memoryId);
    this.forgettingCurve.delete(memoryId);

    this.emit('memoryDeleted', { memoryId, type: memory.type });
  }

  // Advanced Memory Operations
  async createAssociations(newMemory: MemoryEntry): Promise<void> {
    const associationThreshold = 0.7;
    const associations: string[] = [];

    for (const [existingId, existing] of this.memories) {
      if (existing.id === newMemory.id) continue;

      const similarity = this.calculateSimilarity(newMemory.embedding, existing.embedding);
      
      if (similarity > associationThreshold) {
        associations.push(existingId);
        
        // Bidirectional association
        existing.associations.push(newMemory.id);
        this.addToAssociationMap(existing.id, newMemory.id);
      }
    }

    newMemory.associations = associations;
    for (const assocId of associations) {
      this.addToAssociationMap(newMemory.id, assocId);
    }
  }

  async updateAssociations(memory: MemoryEntry): Promise<void> {
    // Remove existing associations
    this.removeAssociations(memory.id);
    
    // Recreate associations
    await this.createAssociations(memory);
  }

  private addToAssociationMap(memoryId: string, associatedId: string): void {
    if (!this.associations.has(memoryId)) {
      this.associations.set(memoryId, new Set());
    }
    this.associations.get(memoryId)!.add(associatedId);
  }

  private removeAssociations(memoryId: string): void {
    // Remove from association map
    const associations = this.associations.get(memoryId);
    if (associations) {
      for (const assocId of associations) {
        const memory = this.memories.get(assocId);
        if (memory) {
          memory.associations = memory.associations.filter(id => id !== memoryId);
        }
        
        const reverseAssoc = this.associations.get(assocId);
        if (reverseAssoc) {
          reverseAssoc.delete(memoryId);
        }
      }
    }
    
    this.associations.delete(memoryId);
  }

  // Memory Consolidation
  private initializeConsolidationRules(): void {
    this.consolidationRules = [
      {
        id: 'duplicate_removal',
        name: 'Remove Duplicate Memories',
        condition: (memories) => memories.length > 1,
        action: (memories) => this.removeDuplicates(memories),
        priority: 1
      },
      {
        id: 'importance_decay',
        name: 'Apply Importance Decay',
        condition: () => true,
        action: (memories) => this.applyImportanceDecay(memories),
        priority: 2
      },
      {
        id: 'semantic_clustering',
        name: 'Cluster Semantically Similar Memories',
        condition: (memories) => memories.length > 5,
        action: (memories) => this.clusterSimilarMemories(memories),
        priority: 3
      },
      {
        id: 'episodic_compression',
        name: 'Compress Episodic Sequences',
        condition: (memories) => memories.filter(m => m.type === 'episodic').length > 10,
        action: (memories) => this.compressEpisodicSequences(memories),
        priority: 4
      }
    ];
  }

  private async consolidateMemories(): Promise<void> {
    console.log('Starting memory consolidation...');
    const startTime = Date.now();
    
    const allMemories = Array.from(this.memories.values());
    let processedMemories = [...allMemories];

    // Apply consolidation rules in priority order
    for (const rule of this.consolidationRules.sort((a, b) => a.priority - b.priority)) {
      if (rule.condition(processedMemories)) {
        const result = rule.action(processedMemories);
        processedMemories = result instanceof Promise ? await result : result;
        this.emit('consolidationRuleApplied', { 
          ruleId: rule.id, 
          memoriesProcessed: processedMemories.length 
        });
      }
    }

    // Update memory store with consolidated memories
    this.memories.clear();
    for (const memory of processedMemories) {
      this.memories.set(memory.id, memory);
    }

    this.lastConsolidation = Date.now();
    const duration = Date.now() - startTime;
    
    this.emit('consolidationCompleted', { 
      duration,
      originalCount: allMemories.length,
      finalCount: processedMemories.length
    });
  }

  private removeDuplicates(memories: MemoryEntry[]): MemoryEntry[] {
    const uniqueMemories: MemoryEntry[] = [];
    const seenEmbeddings = new Set<string>();

    for (const memory of memories) {
      const embeddingKey = memory.embedding.slice(0, 10).join(','); // First 10 dimensions as key
      
      if (!seenEmbeddings.has(embeddingKey)) {
        seenEmbeddings.add(embeddingKey);
        uniqueMemories.push(memory);
      } else {
        // Find the similar memory and merge if beneficial
        const similar = uniqueMemories.find(m => {
          const similarKey = m.embedding.slice(0, 10).join(',');
          return similarKey === embeddingKey;
        });
        
        if (similar && memory.importance > similar.importance) {
          // Replace with higher importance memory
          const index = uniqueMemories.indexOf(similar);
          uniqueMemories[index] = memory;
        }
      }
    }

    return uniqueMemories;
  }

  private applyImportanceDecay(memories: MemoryEntry[]): MemoryEntry[] {
    const now = Date.now();
    
    return memories.map(memory => {
      const age = now - new Date(memory.context.timestamp).getTime();
      const daysSinceCreation = age / (1000 * 60 * 60 * 24);
      
      // Ebbinghaus forgetting curve: R = e^(-t/S)
      // Where R is retention, t is time, S is memory strength
      const memoryStrength = memory.importance * 30; // Base strength in days
      const retention = Math.exp(-daysSinceCreation / memoryStrength);
      
      memory.decay = retention;
      
      // Boost frequently accessed memories
      const accessBoost = Math.log(memory.accessCount + 1) * 0.1;
      memory.decay = Math.min(memory.decay + accessBoost, 1.0);
      
      return memory;
    }).filter(memory => memory.decay > 0.1); // Remove heavily decayed memories
  }

  private clusterSimilarMemories(memories: MemoryEntry[]): MemoryEntry[] {
    const clusters: MemoryEntry[][] = [];
    const processed = new Set<string>();

    for (const memory of memories) {
      if (processed.has(memory.id)) continue;

      const cluster = [memory];
      processed.add(memory.id);

      // Find similar memories
      for (const other of memories) {
        if (processed.has(other.id)) continue;
        
        const similarity = this.calculateSimilarity(memory.embedding, other.embedding);
        if (similarity > 0.8) {
          cluster.push(other);
          processed.add(other.id);
        }
      }

      clusters.push(cluster);
    }

    // Merge clusters into representative memories
    const consolidatedMemories: MemoryEntry[] = [];

    for (const cluster of clusters) {
      if (cluster.length === 1) {
        consolidatedMemories.push(cluster[0]);
      } else {
        // Create a representative memory from the cluster
        const representative = this.createRepresentativeMemory(cluster);
        consolidatedMemories.push(representative);
      }
    }

    return consolidatedMemories;
  }

  private async compressEpisodicSequences(memories: MemoryEntry[]): Promise<MemoryEntry[]> {
    const episodicMemories = memories.filter(m => m.type === 'episodic');
    const otherMemories = memories.filter(m => m.type !== 'episodic');

    // Group episodic memories by session and agent
    const sessionGroups = new Map<string, MemoryEntry[]>();
    
    for (const memory of episodicMemories) {
      const key = `${memory.context.agentId}_${memory.context.sessionId}`;
      if (!sessionGroups.has(key)) {
        sessionGroups.set(key, []);
      }
      sessionGroups.get(key)!.push(memory);
    }

    const compressedEpisodic: MemoryEntry[] = [];

    for (const [sessionKey, sessionMemories] of sessionGroups) {
      if (sessionMemories.length <= 3) {
        compressedEpisodic.push(...sessionMemories);
        continue;
      }

      // Sort by timestamp
      sessionMemories.sort((a, b) => 
        new Date(a.context.timestamp).getTime() - new Date(b.context.timestamp).getTime()
      );

      // Create summary memories for sequences
      const summaryMemory = await this.createEpisodicSummary(sessionMemories);
      compressedEpisodic.push(summaryMemory);
      
      // Keep only the most important individual memories
      const importantMemories = sessionMemories
        .filter(m => m.importance > 0.7)
        .slice(0, 3);
      
      compressedEpisodic.push(...importantMemories);
    }

    return [...otherMemories, ...compressedEpisodic];
  }

  private createRepresentativeMemory(cluster: MemoryEntry[]): MemoryEntry {
    // Select the most important memory as base
    const base = cluster.reduce((prev, current) => 
      current.importance > prev.importance ? current : prev
    );

    // Combine content and context
    const combinedContent = cluster.map(m => m.content).join('\n---\n');
    const combinedTags = [...new Set(cluster.flatMap(m => m.context.tags))];
    const avgImportance = cluster.reduce((sum, m) => sum + m.importance, 0) / cluster.length;

    return {
      ...base,
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: combinedContent,
      importance: Math.max(avgImportance, base.importance),
      context: {
        ...base.context,
        tags: combinedTags
      },
      associations: [...new Set(cluster.flatMap(m => m.associations))]
    };
  }

  private async createEpisodicSummary(episodicMemories: MemoryEntry[]): Promise<MemoryEntry> {
    const firstMemory = episodicMemories[0];
    const lastMemory = episodicMemories[episodicMemories.length - 1];
    
    const summaryContent = `Session summary from ${firstMemory.context.timestamp} to ${lastMemory.context.timestamp}:\n` +
      episodicMemories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');


    const avgImportance = episodicMemories.reduce((sum, m) => sum + m.importance, 0) / episodicMemories.length;

    return {
      id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'episodic',
      content: summaryContent,
      context: {
        agentId: firstMemory.context.agentId,
        sessionId: firstMemory.context.sessionId,
        timestamp: firstMemory.context.timestamp,
        tags: [...new Set(episodicMemories.flatMap(m => m.context.tags)), 'summary']
      },
      importance: Math.min(avgImportance + 0.2, 1.0),
      embedding: await this.generateMemoryEmbedding(summaryContent),
      associations: [],
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
      decay: 1.0
    };
  }

  // Utility Methods
  private async generateMemoryEmbedding(content: string): Promise<number[]> {
    // This would typically use a proper embedding service
    // For now, using a sophisticated hash-based approach
    const dimension = 512;
    const embedding = new Array(dimension).fill(0);
    
    const words = content.toLowerCase().split(/\s+/);
    const ngrams = this.generateNGrams(words, 2);
    
    for (const word of words) {
      const hash = this.hash(word) % dimension;
      embedding[hash] += 1;
    }
    
    for (const ngram of ngrams) {
      const hash = this.hash(ngram) % dimension;
      embedding[hash] += 0.5;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private generateNGrams(words: string[], n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private calculateSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private matchesQuery(memory: MemoryEntry, query: MemoryQuery): boolean {
    if (query.type && memory.type !== query.type) return false;
    if (query.agentId && memory.context.agentId !== query.agentId) return false;
    
    if (query.timeRange) {
      const memoryTime = new Date(memory.context.timestamp);
      const start = new Date(query.timeRange.start);
      const end = new Date(query.timeRange.end);
      if (memoryTime < start || memoryTime > end) return false;
    }
    
    if (query.importance) {
      const { min = 0, max = 1 } = query.importance;
      if (memory.importance < min || memory.importance > max) return false;
    }
    
    return true;
  }

  private calculateRelevanceScore(
    memory: MemoryEntry,
    query: MemoryQuery,
    similarity: number
  ): number {
    let score = similarity;
    
    // Apply forgetting curve
    score *= memory.decay;
    
    // Boost important memories
    score *= (1 + memory.importance * 0.5);
    
    // Boost frequently accessed memories
    const accessFactor = Math.log(memory.accessCount + 1) * 0.1;
    score += accessFactor;
    
    // Recency boost
    const age = Date.now() - new Date(memory.context.timestamp).getTime();
    const hours = age / (1000 * 60 * 60);
    const recencyBoost = Math.exp(-hours / 168); // Weekly decay
    score *= (0.8 + recencyBoost * 0.2);
    
    return score;
  }

  private async updateAccessPattern(memoryId: string): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) return;
    
    memory.accessCount++;
    memory.lastAccessed = new Date().toISOString();
    
    // Strengthen memory through access
    memory.decay = Math.min(memory.decay * 1.1, 1.0);
  }

  private async expandWithAssociations(memories: MemoryEntry[]): Promise<MemoryEntry[]> {
    const expanded = new Set(memories);
    
    for (const memory of memories) {
      for (const assocId of memory.associations.slice(0, 3)) { // Limit associations
        const associated = this.memories.get(assocId);
        if (associated && associated.decay > 0.3) {
          expanded.add(associated);
        }
      }
    }
    
    return Array.from(expanded);
  }

  private shouldTriggerConsolidation(): boolean {
    const timeSinceLastConsolidation = Date.now() - this.lastConsolidation;
    const hoursSinceConsolidation = timeSinceLastConsolidation / (1000 * 60 * 60);
    
    return hoursSinceConsolidation > 6 || this.memories.size > 1000;
  }

  private startPeriodicConsolidation(): void {
    setInterval(() => {
      if (this.shouldTriggerConsolidation()) {
        this.consolidateMemories().catch(console.error);
      }
    }, 1000 * 60 * 60); // Check every hour
  }

  // Public API
  async getMemoryStats(): Promise<any> {
    const stats = {
      totalMemories: this.memories.size,
      typeBreakdown: { episodic: 0, semantic: 0, procedural: 0, working: 0 },
      avgImportance: 0,
      avgDecay: 0,
      totalAssociations: this.associations.size,
      lastConsolidation: new Date(this.lastConsolidation).toISOString()
    };

    let totalImportance = 0;
    let totalDecay = 0;

    for (const memory of this.memories.values()) {
      stats.typeBreakdown[memory.type]++;
      totalImportance += memory.importance;
      totalDecay += memory.decay;
    }

    if (this.memories.size > 0) {
      stats.avgImportance = totalImportance / this.memories.size;
      stats.avgDecay = totalDecay / this.memories.size;
    }

    return stats;
  }

  async clearMemoriesForAgent(agentId: string): Promise<void> {
    const toDelete: string[] = [];
    
    for (const [id, memory] of this.memories) {
      if (memory.context.agentId === agentId) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      await this.deleteMemory(id);
    }
    
    this.emit('agentMemoryCleared', { agentId, deletedCount: toDelete.length });
  }
}

export default AdvancedMemoryService;
