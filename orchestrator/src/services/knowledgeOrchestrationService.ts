import { EventEmitter } from 'events';

interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    page?: number;
    section?: string;
    timestamp: string;
    importance: number;
    tags: string[];
  };
}

interface KnowledgeIndex {
  id: string;
  name: string;
  type: 'documents' | 'database' | 'api' | 'website' | 'conversation';
  status: 'indexing' | 'ready' | 'error' | 'updating';
  chunks: DocumentChunk[];
  metadata: {
    totalSize: number;
    lastUpdated: string;
    version: string;
    schema?: any;
  };
}

interface SearchQuery {
  query: string;
  filters?: {
    type?: string[];
    timeRange?: { start: string; end: string };
    tags?: string[];
    importance?: { min: number; max: number };
  };
  limit?: number;
  threshold?: number;
}

interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  reasoning: string;
}

interface MemoryContext {
  shortTerm: DocumentChunk[];
  longTerm: DocumentChunk[];
  workingMemory: DocumentChunk[];
  episodic: DocumentChunk[];
}

class KnowledgeOrchestrationService extends EventEmitter {
  private indices: Map<string, KnowledgeIndex> = new Map();
  private memoryContexts: Map<string, MemoryContext> = new Map();
  private processingQueue: Array<{ id: string; task: () => Promise<void> }> = [];
  private isProcessing = false;

  // Knowledge Index Management
  async createKnowledgeIndex(
    name: string,
    type: KnowledgeIndex['type'],
    data: any
  ): Promise<string> {
    const indexId = `idx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const index: KnowledgeIndex = {
      id: indexId,
      name,
      type,
      status: 'indexing',
      chunks: [],
      metadata: {
        totalSize: 0,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    this.indices.set(indexId, index);
    this.emit('indexCreated', { indexId, name, type });

    // Queue processing
    this.queueProcessing(indexId, () => this.processKnowledgeData(indexId, data));

    return indexId;
  }

  async processKnowledgeData(indexId: string, data: any): Promise<void> {
    const index = this.indices.get(indexId);
    if (!index) throw new Error(`Index ${indexId} not found`);

    try {
      index.status = 'indexing';
      this.emit('indexingStarted', { indexId });

      let chunks: DocumentChunk[] = [];

      switch (index.type) {
        case 'documents':
          chunks = await this.processDocuments(data);
          break;
        case 'database':
          chunks = await this.processDatabaseSchema(data);
          break;
        case 'api':
          chunks = await this.processAPISpecs(data);
          break;
        case 'website':
          chunks = await this.processWebsiteContent(data);
          break;
        case 'conversation':
          chunks = await this.processConversationHistory(data);
          break;
      }

      // Generate embeddings for all chunks
      chunks = await this.generateEmbeddings(chunks);

      // Apply intelligent chunking and optimization
      chunks = await this.optimizeChunks(chunks);

      index.chunks = chunks;
      index.status = 'ready';
      index.metadata.totalSize = chunks.length;
      index.metadata.lastUpdated = new Date().toISOString();

      this.emit('indexingCompleted', { 
        indexId, 
        chunksCount: chunks.length,
        processingTime: Date.now() 
      });

    } catch (error) {
      index.status = 'error';
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      this.emit('indexingError', { indexId, error: errorMessage });
      throw error;
    }
  }

  // Advanced Document Processing
  private async processDocuments(documents: any[]): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    for (const doc of documents) {
      const docChunks = await this.intelligentChunking(doc.content, {
        source: doc.name || 'unknown',
        type: doc.type || 'text'
      });

      chunks.push(...docChunks);
    }

    return chunks;
  }

  private async intelligentChunking(
    content: string,
    metadata: { source: string; type: string }
  ): Promise<DocumentChunk[]> {
    // Advanced chunking with semantic boundaries
    const sentences = this.splitIntoSemanticUnits(content);
    const chunks: DocumentChunk[] = [];
    
    let currentChunk = '';
    let currentImportance = 0.5;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const importance = this.calculateSentenceImportance(sentence);
      
      // Smart chunk boundary detection
      if (this.shouldCreateNewChunk(currentChunk, sentence, importance)) {
        if (currentChunk.trim()) {
          chunks.push({
            id: `chunk_${Date.now()}_${chunks.length}`,
            content: currentChunk.trim(),
            embedding: [], // Will be filled later
            metadata: {
              source: metadata.source,
              timestamp: new Date().toISOString(),
              importance: currentImportance,
              tags: this.extractTags(currentChunk)
            }
          });
        }
        currentChunk = sentence;
        currentImportance = importance;
      } else {
        currentChunk += ' ' + sentence;
        currentImportance = Math.max(currentImportance, importance);
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk_${Date.now()}_${chunks.length}`,
        content: currentChunk.trim(),
        embedding: [],
        metadata: {
          source: metadata.source,
          timestamp: new Date().toISOString(),
          importance: currentImportance,
          tags: this.extractTags(currentChunk)
        }
      });
    }

    return chunks;
  }

  private splitIntoSemanticUnits(content: string): string[] {
    // Advanced semantic splitting
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const units: string[] = [];

    for (const sentence of sentences) {
      // Further split long sentences at commas, semicolons, etc.
      if (sentence.length > 200) {
        const subUnits = sentence.split(/[,;:]/).filter(s => s.trim().length > 20);
        units.push(...subUnits);
      } else {
        units.push(sentence);
      }
    }

    return units;
  }

  private calculateSentenceImportance(sentence: string): number {
    let importance = 0.5; // Base importance

    // Length factor
    if (sentence.length > 100) importance += 0.1;
    if (sentence.length > 200) importance += 0.1;

    // Keyword importance
    const keywordPatterns = [
      /\b(important|critical|key|main|primary|essential|significant)\b/i,
      /\b(problem|solution|issue|challenge|goal|objective)\b/i,
      /\b(requirement|specification|constraint|limitation)\b/i,
      /\b(result|conclusion|summary|finding|insight)\b/i
    ];

    for (const pattern of keywordPatterns) {
      if (pattern.test(sentence)) importance += 0.15;
    }

    // Technical terms
    if (/\b[A-Z]{2,}\b/.test(sentence)) importance += 0.1;
    if (/\d+(\.\d+)?/.test(sentence)) importance += 0.05;

    // Question or action items
    if (/\?/.test(sentence)) importance += 0.1;
    if (/\b(must|should|will|need to|have to)\b/i.test(sentence)) importance += 0.1;

    return Math.min(importance, 1.0);
  }

  private shouldCreateNewChunk(
    currentChunk: string,
    newSentence: string,
    importance: number
  ): boolean {
    const currentLength = currentChunk.length;
    const newLength = newSentence.length;

    // Size-based boundaries
    if (currentLength + newLength > 1500) return true;
    if (currentLength > 800 && importance > 0.7) return true;

    // Semantic boundaries
    const semanticBreaks = [
      /^(however|therefore|moreover|furthermore|in conclusion|finally)/i,
      /^(chapter|section|part|step|phase)/i,
      /^(problem|solution|issue|challenge)/i
    ];

    for (const pattern of semanticBreaks) {
      if (pattern.test(newSentence.trim())) return true;
    }

    return false;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // Capitalized words (potential proper nouns)
    const capitalizedWords = content.match(/\b[A-Z][a-z]+\b/g) || [];
    tags.push(...capitalizedWords.slice(0, 5));

    // Technical terms
    const technicalTerms = content.match(/\b[A-Z]{2,}\b/g) || [];
    tags.push(...technicalTerms.slice(0, 3));

    // Domain-specific patterns
    const domainPatterns = [
      { pattern: /\b(API|REST|GraphQL|HTTP|HTTPS)\b/g, domain: 'api' },
      { pattern: /\b(database|SQL|NoSQL|MongoDB|PostgreSQL)\b/g, domain: 'database' },
      { pattern: /\b(React|Vue|Angular|JavaScript|TypeScript)\b/g, domain: 'frontend' },
      { pattern: /\b(authentication|security|encryption|JWT)\b/g, domain: 'security' }
    ];

    for (const { pattern, domain } of domainPatterns) {
      if (pattern.test(content)) {
        tags.push(domain);
      }
    }

    return [...new Set(tags.filter(tag => tag.length > 2))];
  }

  // Advanced Embedding Generation
  private async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const batchSize = 50;
    const batches = this.createBatches(chunks, batchSize);

    for (const batch of batches) {
      const embeddings = await this.batchGenerateEmbeddings(
        batch.map(chunk => chunk.content)
      );

      batch.forEach((chunk, index) => {
        chunk.embedding = embeddings[index];
      });

      // Rate limiting
      await this.sleep(100);
    }

    return chunks;
  }

  private async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // In production, use a proper embedding service like OpenAI or Cohere
      // For now, using a sophisticated hash-based approach
      return texts.map(text => this.generateAdvancedEmbedding(text));
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Fallback to simple embeddings
      return texts.map(text => this.generateSimpleEmbedding(text));
    }
  }

  private generateAdvancedEmbedding(text: string): number[] {
    const dimension = 768; // Standard embedding dimension
    const embedding = new Array(dimension).fill(0);
    
    // Preprocessing
    const normalized = text.toLowerCase()
      .replace(/[^\\w\\s]/g, ' ')
      .replace(/\\s+/g, ' ')
      .trim();
    
    const words = normalized.split(' ').filter(w => w.length > 2);
    const ngrams = this.generateNGrams(words, 3);
    
    // Feature extraction
    const features = {
      wordFreq: this.calculateWordFrequencies(words),
      ngramFreq: this.calculateNGramFrequencies(ngrams),
      sentiment: this.calculateSentiment(text),
      complexity: this.calculateComplexity(text),
      entities: this.extractSimpleEntities(text)
    };

    // Embed features into vector space
    this.embedFeatures(embedding, features);
    
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

  private calculateWordFrequencies(words: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
    return freq;
  }

  private calculateNGramFrequencies(ngrams: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const ngram of ngrams) {
      freq[ngram] = (freq[ngram] || 0) + 1;
    }
    return freq;
  }

  private calculateSentiment(text: string): number {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'frustrating'];
    
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    }
    
    return Math.tanh(score / words.length); // Normalize to [-1, 1]
  }

  private calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    return Math.tanh((avgWordsPerSentence / 20) + (avgWordLength / 10));
  }

  private extractSimpleEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Simple patterns for common entities
    const patterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Person names
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // Dates
      /\b\d+(\.\d+)?%\b/g, // Percentages
      /\$\d+(\.\d{2})?\b/g, // Currency
      /\b[A-Z]{2,}\b/g // Acronyms
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern) || [];
      entities.push(...matches);
    }
    
    return [...new Set(entities)];
  }

  private embedFeatures(embedding: number[], features: any): void {
    let index = 0;
    
    // Word frequency features
    const topWords = Object.entries(features.wordFreq)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 100);
    
    for (const [word, freq] of topWords) {
      if (index >= embedding.length) break;
      const hash = this.simpleHash(word) % embedding.length;
      embedding[hash] += (freq as number) * 0.1;
      index++;
    }
    
    // Sentiment and complexity
    embedding[0] += features.sentiment;
    embedding[1] += features.complexity;
    
    // Entity features
    for (const entity of features.entities.slice(0, 50)) {
      if (index >= embedding.length) break;
      const hash = this.simpleHash(entity) % embedding.length;
      embedding[hash] += 0.05;
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    const dimension = 768;
    const embedding = new Array(dimension).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      const hash = this.simpleHash(word);
      embedding[hash % dimension] += 1;
    }
    
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Advanced Search & Retrieval
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const queryEmbedding = this.generateAdvancedEmbedding(query.query);
    const results: SearchResult[] = [];

    for (const index of this.indices.values()) {
      if (index.status !== 'ready') continue;

      for (const chunk of index.chunks) {
        if (!this.matchesFilters(chunk, query.filters)) continue;

        const similarity = this.calculateCosineSimilarity(queryEmbedding, chunk.embedding);
        
        if (similarity >= (query.threshold || 0.3)) {
          results.push({
            chunk,
            score: similarity,
            reasoning: this.generateReasoningExplanation(query.query, chunk, similarity)
          });
        }
      }
    }

    // Advanced ranking with multiple factors
    results.sort((a, b) => {
      const scoreA = this.calculateAdvancedScore(a, query);
      const scoreB = this.calculateAdvancedScore(b, query);
      return scoreB - scoreA;
    });

    return results.slice(0, query.limit || 20);
  }

  private matchesFilters(chunk: DocumentChunk, filters?: SearchQuery['filters']): boolean {
    if (!filters) return true;

    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        chunk.metadata.tags.some(chunkTag => 
          chunkTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) return false;
    }

    if (filters.importance) {
      const { min = 0, max = 1 } = filters.importance;
      if (chunk.metadata.importance < min || chunk.metadata.importance > max) {
        return false;
      }
    }

    if (filters.timeRange) {
      const chunkTime = new Date(chunk.metadata.timestamp);
      const startTime = new Date(filters.timeRange.start);
      const endTime = new Date(filters.timeRange.end);
      if (chunkTime < startTime || chunkTime > endTime) {
        return false;
      }
    }

    return true;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
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

  private calculateAdvancedScore(result: SearchResult, query: SearchQuery): number {
    let score = result.score; // Base similarity score

    // Importance boost
    score *= (1 + result.chunk.metadata.importance * 0.5);

    // Recency boost
    const age = Date.now() - new Date(result.chunk.metadata.timestamp).getTime();
    const daysSinceCreation = age / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.exp(-daysSinceCreation / 30); // Exponential decay over 30 days
    score *= (1 + recencyBoost * 0.3);

    // Tag relevance boost
    const queryTerms = query.query.toLowerCase().split(/\s+/);
    const tagMatches = result.chunk.metadata.tags.filter(tag =>
      queryTerms.some(term => tag.toLowerCase().includes(term))
    );
    score *= (1 + tagMatches.length * 0.1);

    // Content length normalization
    const contentLength = result.chunk.content.length;
    const lengthFactor = Math.min(contentLength / 500, 2); // Prefer medium-length content
    score *= (0.7 + lengthFactor * 0.3);

    return score;
  }

  private generateReasoningExplanation(
    query: string,
    chunk: DocumentChunk,
    similarity: number
  ): string {
    const explanations: string[] = [];

    if (similarity > 0.8) {
      explanations.push("Strong semantic match with query");
    } else if (similarity > 0.6) {
      explanations.push("Good semantic relevance");
    } else {
      explanations.push("Moderate relevance");
    }

    if (chunk.metadata.importance > 0.7) {
      explanations.push("high importance content");
    }

    const queryTerms = query.toLowerCase().split(/\s+/);
    const directMatches = queryTerms.filter(term =>
      chunk.content.toLowerCase().includes(term)
    );

    if (directMatches.length > 0) {
      explanations.push(`contains ${directMatches.length} direct term matches`);
    }

    const tagMatches = chunk.metadata.tags.filter(tag =>
      queryTerms.some(term => tag.toLowerCase().includes(term))
    );

    if (tagMatches.length > 0) {
      explanations.push(`relevant tags: ${tagMatches.join(', ')}`);
    }

    return explanations.join('; ');
  }

  // Memory Management
  async getMemoryContext(agentId: string): Promise<MemoryContext> {
    if (!this.memoryContexts.has(agentId)) {
      this.memoryContexts.set(agentId, {
        shortTerm: [],
        longTerm: [],
        workingMemory: [],
        episodic: []
      });
    }

    return this.memoryContexts.get(agentId)!;
  }

  async updateMemoryContext(
    agentId: string,
    newChunks: DocumentChunk[],
    type: keyof MemoryContext
  ): Promise<void> {
    const context = await this.getMemoryContext(agentId);
    
    switch (type) {
      case 'shortTerm':
        context.shortTerm.push(...newChunks);
        // Keep only recent items (last 50)
        context.shortTerm = context.shortTerm.slice(-50);
        break;
        
      case 'longTerm':
        // Move important short-term memories to long-term
        const importantMemories = context.shortTerm.filter(chunk =>
          chunk.metadata.importance > 0.7
        );
        context.longTerm.push(...importantMemories, ...newChunks);
        // Keep most important items (top 200)
        context.longTerm = context.longTerm
          .sort((a, b) => b.metadata.importance - a.metadata.importance)
          .slice(0, 200);
        break;
        
      case 'workingMemory':
        context.workingMemory = newChunks; // Replace working memory
        break;
        
      case 'episodic':
        context.episodic.push(...newChunks);
        // Keep chronological order and limit size
        context.episodic = context.episodic
          .sort((a, b) => new Date(b.metadata.timestamp).getTime() - 
                         new Date(a.metadata.timestamp).getTime())
          .slice(0, 100);
        break;
    }

    this.memoryContexts.set(agentId, context);
    this.emit('memoryUpdated', { agentId, type, chunksAdded: newChunks.length });
  }

  // Utility Methods
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async queueProcessing(id: string, task: () => Promise<void>): Promise<void> {
    this.processingQueue.push({ id, task });
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    
    while (this.processingQueue.length > 0) {
      const { id, task } = this.processingQueue.shift()!;
      
      try {
        await task();
        this.emit('taskCompleted', { id });
      } catch (error) {
        this.emit('taskFailed', { id, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    this.isProcessing = false;
  }

  // Additional processing methods
  private async processDatabaseSchema(data: any): Promise<DocumentChunk[]> {
    // Process database schemas, tables, relationships
    // Implementation would depend on database type
    return [];
  }

  private async processAPISpecs(data: any): Promise<DocumentChunk[]> {
    // Process OpenAPI specs, endpoints, schemas
    return [];
  }

  private async processWebsiteContent(data: any): Promise<DocumentChunk[]> {
    // Process crawled website content
    return [];
  }

  private async processConversationHistory(data: any): Promise<DocumentChunk[]> {
    // Process chat/conversation logs
    return [];
  }

  private async optimizeChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    // Apply post-processing optimizations
    // Remove duplicates, merge similar chunks, etc.
    const optimized = chunks.filter((chunk, index, arr) =>
      arr.findIndex(c => this.calculateCosineSimilarity(chunk.embedding, c.embedding) > 0.95) === index
    );

    return optimized;
  }

  // Public API
  async getKnowledgeStats(): Promise<any> {
    const stats = {
      totalIndices: this.indices.size,
      totalChunks: 0,
      statusBreakdown: { ready: 0, indexing: 0, error: 0, updating: 0 },
      memoryContexts: this.memoryContexts.size
    };

    for (const index of this.indices.values()) {
      stats.totalChunks += index.chunks.length;
      stats.statusBreakdown[index.status]++;
    }

    return stats;
  }

  async deleteKnowledgeIndex(indexId: string): Promise<void> {
    if (this.indices.has(indexId)) {
      this.indices.delete(indexId);
      this.emit('indexDeleted', { indexId });
    }
  }

  async clearMemoryContext(agentId: string): Promise<void> {
    this.memoryContexts.delete(agentId);
    this.emit('memoryCleared', { agentId });
  }
}

export default KnowledgeOrchestrationService;
