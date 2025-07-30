import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/canvas';

interface ConnectionSuggestion {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  confidence: number;
  reason: string;
  dataFlow: {
    type: string;
    schema: any;
    transformations?: string[];
  };
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
  autoFix?: {
    nodes?: Partial<Node>[];
    edges?: Partial<Edge>[];
  };
}

class SmartConnectionEngine {
  private nodeCompatibilityMap: Map<string, string[]> = new Map();
  private dataFlowRules: Map<string, any> = new Map();

  constructor() {
    this.initializeCompatibilityRules();
    this.initializeDataFlowRules();
  }

  /**
   * Initialize node compatibility rules
   */
  private initializeCompatibilityRules(): void {
    // Define which node types can connect to which
    this.nodeCompatibilityMap.set('trigger', ['action', 'condition', 'logic']);
    this.nodeCompatibilityMap.set('condition', ['action', 'condition', 'logic', 'integration']);
    this.nodeCompatibilityMap.set('logic', ['action', 'condition', 'integration', 'logic']);
    this.nodeCompatibilityMap.set('action', ['condition', 'logic', 'integration', 'output']);
    this.nodeCompatibilityMap.set('integration', ['action', 'condition', 'logic', 'output']);
    this.nodeCompatibilityMap.set('agent', ['action', 'integration', 'logic', 'condition']);
  }

  /**
   * Initialize data flow rules
   */
  private initializeDataFlowRules(): void {
    this.dataFlowRules.set('email_trigger->llm_action', {
      requiredFields: ['subject', 'body', 'sender'],
      outputSchema: { response: 'string', confidence: 'number' },
      transformation: 'email_to_llm_prompt'
    });

    this.dataFlowRules.set('llm_action->api_integration', {
      requiredFields: ['response'],
      outputSchema: { payload: 'object', headers: 'object' },
      transformation: 'llm_to_api_payload'
    });

    this.dataFlowRules.set('api_integration->notification', {
      requiredFields: ['status', 'response'],
      outputSchema: { message: 'string', recipients: 'array' },
      transformation: 'api_to_notification'
    });
  }

  /**
   * Generate smart connection suggestions
   */
  async generateConnectionSuggestions(
    nodes: Node<NodeData>[],
    _edges: Edge[],
    sourceNode?: Node<NodeData>
  ): Promise<ConnectionSuggestion[]> {
    const suggestions: ConnectionSuggestion[] = [];

    try {
      // If source node is specified, find compatible targets
      if (sourceNode) {
        const compatibleTypes = this.nodeCompatibilityMap.get(sourceNode.type || 'action') || [];
        
        for (const node of nodes) {
          if (node.id === sourceNode.id || !compatibleTypes.includes(node.type || '')) continue;
          
          // Check if connection already exists
          const existingConnection = _edges.find(
            (edge: Edge) => edge.source === sourceNode.id && edge.target === node.id
          );
          
          if (!existingConnection) {
            const suggestion = await this.createConnectionSuggestion(sourceNode, node, nodes, _edges);
            if (suggestion) {
              suggestions.push(suggestion);
            }
          }
        }
      } else {
        // Find all possible smart connections
        for (const sourceNode of nodes) {
          const compatibleTypes = this.nodeCompatibilityMap.get(sourceNode.type || 'action') || [];
          
          for (const targetNode of nodes) {
            if (sourceNode.id === targetNode.id || !compatibleTypes.includes(targetNode.type || '')) continue;
            
            const existingConnection = _edges.find(
              (edge: Edge) => edge.source === sourceNode.id && edge.target === targetNode.id
            );
            
            if (!existingConnection) {
              const suggestion = await this.createConnectionSuggestion(sourceNode, targetNode, nodes, _edges);
              if (suggestion && suggestion.confidence > 0.7) {
                suggestions.push(suggestion);
              }
            }
          }
        }
      }

      // Sort by confidence
      return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);

    } catch (error) {
      console.error('❌ Error generating connection suggestions:', error);
      return [];
    }
  }

  /**
   * Create a connection suggestion between two nodes
   */
  private async createConnectionSuggestion(
    sourceNode: Node<NodeData>,
    targetNode: Node<NodeData>,
    _allNodes: Node<NodeData>[],
    _edges: Edge[]
  ): Promise<ConnectionSuggestion | null> {
    const sourceType = sourceNode.type || 'action';
    const targetType = targetNode.type || 'action';
    const connectionKey = `${sourceType}->${targetType}`;

    // Calculate confidence based on various factors
    let confidence = 0.5; // Base confidence
    let reason = `${sourceType} can connect to ${targetType}`;

    // Check data flow compatibility
    const dataFlowRule = this.dataFlowRules.get(connectionKey) || 
                        this.dataFlowRules.get(`${sourceType}_*->${targetType}_*`);

    if (dataFlowRule) {
      confidence += 0.3;
      reason = `Smart data flow detected: ${dataFlowRule.transformation}`;
    }

    // Check naming similarity
    const nameSimilarity = this.calculateNameSimilarity(sourceNode.data?.label || '', targetNode.data?.label || '');
    confidence += nameSimilarity * 0.2;

    // Check logical workflow position
    const positionScore = this.calculatePositionScore(sourceNode, targetNode, _allNodes);
    confidence += positionScore * 0.1;

    // Ensure confidence is within bounds
    confidence = Math.min(Math.max(confidence, 0), 1);

    if (confidence < 0.3) return null;

    return {
      id: `suggestion-${sourceNode.id}-${targetNode.id}`,
      source: sourceNode.id,
      target: targetNode.id,
      confidence,
      reason,
      dataFlow: {
        type: dataFlowRule?.transformation || 'direct',
        schema: dataFlowRule?.outputSchema || {},
        transformations: dataFlowRule?.transformations || []
      }
    };
  }

  /**
   * Calculate name similarity between nodes
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;

    const words1 = name1.toLowerCase().split(/\s+/);
    const words2 = name2.toLowerCase().split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        commonWords++;
      }
    }

    return commonWords / Math.max(words1.length, words2.length);
  }

  /**
   * Calculate position-based workflow logic score
   */
  private calculatePositionScore(sourceNode: Node, targetNode: Node, _allNodes: Node[]): number {
    // Prefer left-to-right, top-to-bottom flow
    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;

    let score = 0;
    
    // Horizontal flow (left to right)
    if (dx > 0) score += 0.5;
    else if (dx < -200) score -= 0.3; // Penalize reverse flow
    
    // Vertical proximity
    if (Math.abs(dy) < 100) score += 0.3;
    else if (Math.abs(dy) > 300) score -= 0.2;

    return Math.max(0, score);
  }

  /**
   * Validate workflow connections
   */
  async validateWorkflow(nodes: Node<NodeData>[], edges: Edge[]): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };

    try {
      // Check for isolated nodes
      const connectedNodeIds = new Set();
      edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const isolatedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
      if (isolatedNodes.length > 0) {
        result.warnings.push(`${isolatedNodes.length} isolated nodes found. Consider connecting them to the workflow.`);
      }

      // Check for missing trigger nodes
      const triggerNodes = nodes.filter(node => node.type === 'trigger');
      if (triggerNodes.length === 0) {
        result.errors.push('Workflow must have at least one trigger node to start execution.');
        result.isValid = false;
      }

      // Check for cycles
      const hasCycles = this.detectCycles(nodes, edges);
      if (hasCycles) {
        result.errors.push('Circular dependencies detected in workflow. This may cause infinite loops.');
        result.isValid = false;
      }

      // Check data flow compatibility
      for (const edge of edges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (sourceNode && targetNode) {
          const flowValidation = await this.validateDataFlow(sourceNode, targetNode, edge);
          if (!flowValidation.isValid) {
            result.warnings.push(`Data flow issue between ${sourceNode.data?.label} and ${targetNode.data?.label}: ${flowValidation.message}`);
          }
        }
      }

      // Generate suggestions for improvements
      const suggestions = await this.generateConnectionSuggestions(nodes, edges);
      result.suggestions = suggestions.slice(0, 3).map(s => s.reason);

    } catch (error) {
      console.error('❌ Error validating workflow:', error);
      result.errors.push('Validation service temporarily unavailable');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Detect cycles in the workflow graph
   */
  private detectCycles(nodes: Node[], edges: Edge[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true; // Cycle detected
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // Check all outgoing edges
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (dfs(edge.target)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Check each node as a potential starting point
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }

  /**
   * Validate data flow between two nodes
   */
  private async validateDataFlow(
    sourceNode: Node<NodeData>,
    targetNode: Node<NodeData>,
    _edge: Edge
  ): Promise<{ isValid: boolean; message: string }> {
    const sourceType = sourceNode.type || 'action';
    const targetType = targetNode.type || 'action';
    
    // Check basic compatibility
    const compatibleTypes = this.nodeCompatibilityMap.get(sourceType) || [];
    if (!compatibleTypes.includes(targetType)) {
      return {
        isValid: false,
        message: `${sourceType} nodes cannot directly connect to ${targetType} nodes`
      };
    }

    // Check data schema compatibility
    // const sourceData = sourceNode.data?.config || {};
    // const targetData = targetNode.data?.config || {};

    // For now, assume basic validation passes
    // In production, this would check actual data schemas
    
    return { isValid: true, message: 'Data flow is compatible' };
  }

  /**
   * Auto-connect compatible nodes
   */
  async autoConnect(nodes: Node<NodeData>[]): Promise<Edge[]> {
    const suggestions = await this.generateConnectionSuggestions(nodes, []);
    const autoConnections: Edge[] = [];

    // Only auto-connect high-confidence suggestions
    const highConfidenceSuggestions = suggestions.filter(s => s.confidence > 0.8);

    for (const suggestion of highConfidenceSuggestions) {
      autoConnections.push({
        id: `auto-${suggestion.source}-${suggestion.target}`,
        source: suggestion.source,
        target: suggestion.target,
        sourceHandle: suggestion.sourceHandle,
        targetHandle: suggestion.targetHandle,
        type: 'intelligentDataFlow',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
        data: {
          auto_generated: true,
          confidence: suggestion.confidence,
          dataFlow: suggestion.dataFlow
        }
      });
    }

    return autoConnections;
  }
}

export const smartConnectionEngine = new SmartConnectionEngine();