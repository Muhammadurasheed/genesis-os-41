import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/canvas';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'structure' | 'data' | 'security' | 'performance' | 'business';
  severity: 'error' | 'warning' | 'info';
  check: (nodes: Node<NodeData>[], edges: Edge[]) => ValidationIssue[];
}

interface ValidationIssue {
  id: string;
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  description: string;
  nodeIds?: string[];
  edgeIds?: string[];
  autoFix?: {
    description: string;
    action: () => Promise<{ nodes?: Node<NodeData>[]; edges?: Edge[] }>;
  };
  suggestion?: string;
}

interface ValidationReport {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  recommendations: string[];
  performance: {
    estimatedExecutionTime: number;
    complexity: 'low' | 'medium' | 'high';
    resourceUsage: 'light' | 'moderate' | 'heavy';
  };
}

class ComprehensiveValidationEngine {
  private rules: Map<string, ValidationRule> = new Map();

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Initialize all validation rules
   */
  private initializeValidationRules(): void {
    const rules: ValidationRule[] = [
      // Structural Rules
      {
        id: 'missing_trigger',
        name: 'Missing Trigger Node',
        description: 'Workflow must have at least one trigger node',
        category: 'structure',
        severity: 'error',
        check: (nodes) => {
          const triggerNodes = nodes.filter(n => n.type === 'trigger');
          if (triggerNodes.length === 0) {
            return [{
              id: 'missing_trigger_001',
              ruleId: 'missing_trigger',
              severity: 'error',
              message: 'No trigger nodes found',
              description: 'Every workflow needs at least one trigger to initiate execution',
              suggestion: 'Add a Schedule, Webhook, or Email trigger to start your workflow'
            }];
          }
          return [];
        }
      },

      {
        id: 'isolated_nodes',
        name: 'Isolated Nodes',
        description: 'All nodes should be connected to the workflow',
        category: 'structure',
        severity: 'warning',
        check: (nodes, edges) => {
          const connectedNodeIds = new Set<string>();
          edges.forEach(edge => {
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
          });

          const isolatedNodes = nodes.filter(n => !connectedNodeIds.has(n.id));
          return isolatedNodes.map(node => ({
            id: `isolated_${node.id}`,
            ruleId: 'isolated_nodes',
            severity: 'warning' as const,
            message: `Node "${node.data?.label || node.id}" is not connected`,
            description: 'This node will not be executed as part of the workflow',
            nodeIds: [node.id],
            suggestion: 'Connect this node to the workflow or remove it if unnecessary'
          }));
        }
      },

      {
        id: 'circular_dependency',
        name: 'Circular Dependencies',
        description: 'Workflow should not contain circular references',
        category: 'structure',
        severity: 'error',
        check: (nodes, edges) => {
          const cycles = this.detectCycles(nodes, edges);
          return cycles.map(cycle => ({
            id: `cycle_${cycle.join('_')}`,
            ruleId: 'circular_dependency',
            severity: 'error' as const,
            message: 'Circular dependency detected',
            description: `Nodes ${cycle.join(' → ')} form a circular dependency that could cause infinite loops`,
            nodeIds: cycle,
            suggestion: 'Remove one of the connections to break the cycle'
          }));
        }
      },

      // Data Flow Rules
      {
        id: 'missing_required_config',
        name: 'Missing Required Configuration',
        description: 'Nodes must have all required configuration',
        category: 'data',
        severity: 'error',
        check: (nodes) => {
          const issues: ValidationIssue[] = [];
          
          nodes.forEach(node => {
            const config = (node.data?.config as Record<string, any>) || {};
            const requiredFields = this.getRequiredFields(node.type || 'action');
            
            for (const field of requiredFields) {
              if (!config[field] || config[field] === '') {
                issues.push({
                  id: `missing_config_${node.id}_${field}`,
                  ruleId: 'missing_required_config',
                  severity: 'error',
                  message: `Missing required field: ${field}`,
                  description: `Node "${node.data?.label || node.id}" requires configuration for ${field}`,
                  nodeIds: [node.id],
                  suggestion: `Configure the ${field} field in the node settings`
                });
              }
            }
          });
          
          return issues;
        }
      },

      {
        id: 'incompatible_data_types',
        name: 'Data Type Compatibility',
        description: 'Connected nodes should have compatible data types',
        category: 'data',
        severity: 'warning',
        check: (nodes, edges) => {
          const issues: ValidationIssue[] = [];
          
          edges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
              const compatibility = this.checkDataCompatibility(sourceNode, targetNode);
              if (!compatibility.compatible) {
                issues.push({
                  id: `incompatible_${edge.id}`,
                  ruleId: 'incompatible_data_types',
                  severity: 'warning',
                  message: compatibility.message,
                  description: `Data type mismatch between ${sourceNode.data?.label} and ${targetNode.data?.label}`,
                  edgeIds: [edge.id],
                  nodeIds: [sourceNode.id, targetNode.id],
                  suggestion: 'Add a data transformation node between these nodes'
                });
              }
            }
          });
          
          return issues;
        }
      },

      // Security Rules
      {
        id: 'missing_credentials',
        name: 'Missing Credentials',
        description: 'Integration nodes should have proper credentials configured',
        category: 'security',
        severity: 'error',
        check: (nodes) => {
          const issues: ValidationIssue[] = [];
          
          nodes.filter(n => n.type === 'integration').forEach(node => {
            const config = (node.data?.config as Record<string, any>) || {};
            if (!config.credentials_id && !config.api_key) {
              issues.push({
                id: `missing_creds_${node.id}`,
                ruleId: 'missing_credentials',
                severity: 'error',
                message: 'Integration missing credentials',
                description: `Integration "${node.data?.label || node.id}" needs credentials to function`,
                nodeIds: [node.id],
                suggestion: 'Configure credentials in the node settings'
              });
            }
          });
          
          return issues;
        }
      },

      // Performance Rules
      {
        id: 'excessive_complexity',
        name: 'Workflow Complexity',
        description: 'Workflow should not be overly complex',
        category: 'performance',
        severity: 'warning',
        check: (nodes, edges) => {
          const complexityScore = this.calculateComplexityScore(nodes, edges);
          if (complexityScore > 80) {
            return [{
              id: 'complexity_high',
              ruleId: 'excessive_complexity',
              severity: 'warning',
              message: 'High workflow complexity detected',
              description: `Complexity score: ${complexityScore}/100. Consider breaking into smaller workflows`,
              suggestion: 'Split complex logic into separate workflows or use sub-workflows'
            }];
          }
          return [];
        }
      },

      // Business Logic Rules
      {
        id: 'business_logic_validation',
        name: 'Business Logic Validation',
        description: 'Workflow should follow business logic best practices',
        category: 'business',
        severity: 'info',
        check: (nodes) => {
          const issues: ValidationIssue[] = [];
          
          // Check for proper error handling
          const hasErrorHandling = nodes.some(n => 
            (n.data?.config as Record<string, any>)?.error_handling || n.type === 'condition'
          );
          
          if (!hasErrorHandling && nodes.length > 3) {
            issues.push({
              id: 'missing_error_handling',
              ruleId: 'business_logic_validation',
              severity: 'info',
              message: 'Consider adding error handling',
              description: 'Complex workflows should include error handling mechanisms',
              suggestion: 'Add condition nodes to handle potential errors'
            });
          }
          
          return issues;
        }
      }
    ];

    rules.forEach(rule => this.rules.set(rule.id, rule));
  }

  /**
   * Validate entire workflow and generate comprehensive report
   */
  async validateWorkflow(nodes: Node<NodeData>[], edges: Edge[]): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    let totalScore = 100;

    try {
      // Run all validation rules
      for (const [_, rule] of this.rules) {
        try {
          const ruleIssues = rule.check(nodes, edges);
          issues.push(...ruleIssues);
        } catch (error) {
          console.error(`❌ Error in validation rule ${rule.id}:`, error);
        }
      }

      // Calculate score based on issues
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;
      
      totalScore -= (errorCount * 20) + (warningCount * 5);
      totalScore = Math.max(0, totalScore);

      // Generate performance analysis
      const performance = this.analyzePerformance(nodes, edges);

      // Generate recommendations
      const recommendations = this.generateRecommendations(issues, nodes, edges);

      return {
        isValid: errorCount === 0,
        score: totalScore,
        issues,
        summary: {
          errors: errorCount,
          warnings: warningCount,
          infos: issues.filter(i => i.severity === 'info').length
        },
        recommendations,
        performance
      };

    } catch (error) {
      console.error('❌ Error during workflow validation:', error);
      return {
        isValid: false,
        score: 0,
        issues: [{
          id: 'validation_error',
          ruleId: 'system_error',
          severity: 'error',
          message: 'Validation system error',
          description: 'Unable to complete validation due to system error'
        }],
        summary: { errors: 1, warnings: 0, infos: 0 },
        recommendations: ['Please try validation again'],
        performance: {
          estimatedExecutionTime: 0,
          complexity: 'high',
          resourceUsage: 'heavy'
        }
      };
    }
  }

  /**
   * Get required fields for a node type
   */
  private getRequiredFields(nodeType: string): string[] {
    const requiredFieldsMap: Record<string, string[]> = {
      'trigger': ['trigger_type'],
      'action': ['action_type'],
      'integration': ['service', 'action'],
      'condition': ['condition_type', 'expression'],
      'agent': ['agent_type', 'model']
    };

    return requiredFieldsMap[nodeType] || [];
  }

  /**
   * Check data compatibility between two nodes
   */
  private checkDataCompatibility(sourceNode: Node<NodeData>, targetNode: Node<NodeData>): { compatible: boolean; message: string } {
    // Simplified compatibility check
    const sourceType = sourceNode.type || 'action';
    const targetType = targetNode.type || 'action';

    // Define compatibility matrix
    const compatibilityMatrix: Record<string, string[]> = {
      'trigger': ['action', 'condition', 'integration'],
      'action': ['condition', 'integration', 'agent'],
      'condition': ['action', 'integration', 'agent'],
      'integration': ['action', 'condition', 'agent'],
      'agent': ['integration', 'action']
    };

    const compatibleTypes = compatibilityMatrix[sourceType] || [];
    
    if (!compatibleTypes.includes(targetType)) {
      return {
        compatible: false,
        message: `${sourceType} output may not be compatible with ${targetType} input`
      };
    }

    return { compatible: true, message: 'Data types are compatible' };
  }

  /**
   * Detect cycles in the workflow graph
   */
  private detectCycles(nodes: Node[], edges: Edge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): void => {
      if (recursionStack.has(nodeId)) {
        // Found cycle - extract the cycle from the path
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart);
        cycle.push(nodeId); // Complete the cycle
        cycles.push([...cycle]);
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      // Visit all connected nodes
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        dfs(edge.target);
      }

      recursionStack.delete(nodeId);
      path.pop();
    };

    // Check each node as a potential starting point
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return cycles;
  }

  /**
   * Calculate workflow complexity score
   */
  private calculateComplexityScore(nodes: Node[], edges: Edge[]): number {
    let score = 0;

    // Base complexity from node count
    score += Math.min(nodes.length * 2, 40);

    // Connection complexity
    score += Math.min(edges.length * 1.5, 30);

    // Node type complexity
    const complexNodeTypes = ['agent', 'integration', 'condition'];
    const complexNodes = nodes.filter(n => complexNodeTypes.includes(n.type || ''));
    score += complexNodes.length * 5;

    // Depth complexity (longest path)
    const maxDepth = this.calculateMaxDepth(nodes, edges);
    score += Math.min(maxDepth * 3, 20);

    return Math.min(score, 100);
  }

  /**
   * Calculate maximum depth of workflow
   */
  private calculateMaxDepth(nodes: Node[], edges: Edge[]): number {
    const triggerNodes = nodes.filter(n => n.type === 'trigger');
    let maxDepth = 0;

    const dfs = (nodeId: string, depth: number, visited: Set<string>): number => {
      if (visited.has(nodeId)) return depth; // Avoid infinite loops
      
      visited.add(nodeId);
      let currentMaxDepth = depth;

      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        const childDepth = dfs(edge.target, depth + 1, new Set(visited));
        currentMaxDepth = Math.max(currentMaxDepth, childDepth);
      }

      return currentMaxDepth;
    };

    for (const trigger of triggerNodes) {
      const depth = dfs(trigger.id, 1, new Set());
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  /**
   * Analyze workflow performance characteristics
   */
  private analyzePerformance(nodes: Node[], edges: Edge[]): ValidationReport['performance'] {
    const complexityScore = this.calculateComplexityScore(nodes, edges);
    
    // Estimate execution time based on node types and complexity
    let estimatedTime = 0;
    nodes.forEach(node => {
      switch (node.type) {
        case 'trigger': estimatedTime += 100; break;
        case 'action': estimatedTime += 500; break;
        case 'integration': estimatedTime += 2000; break;
        case 'agent': estimatedTime += 5000; break;
        case 'condition': estimatedTime += 200; break;
        default: estimatedTime += 300;
      }
    });

    return {
      estimatedExecutionTime: estimatedTime,
      complexity: complexityScore > 60 ? 'high' : complexityScore > 30 ? 'medium' : 'low',
      resourceUsage: nodes.length > 20 ? 'heavy' : nodes.length > 10 ? 'moderate' : 'light'
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(issues: ValidationIssue[], nodes: Node[], edges: Edge[]): string[] {
    const recommendations: string[] = [];

    // Error-based recommendations
    const errorTypes = new Set(issues.filter(i => i.severity === 'error').map(i => i.ruleId));
    
    if (errorTypes.has('missing_trigger')) {
      recommendations.push('Add a trigger node to start your workflow execution');
    }
    
    if (errorTypes.has('missing_required_config')) {
      recommendations.push('Complete the configuration for all nodes before deployment');
    }

    // Performance recommendations
    if (nodes.length > 15) {
      recommendations.push('Consider breaking this workflow into smaller, focused workflows');
    }

    if (edges.length > 20) {
      recommendations.push('Simplify node connections where possible to improve maintainability');
    }

    // General recommendations
    if (recommendations.length === 0 && issues.length === 0) {
      recommendations.push('Workflow looks good! Consider adding error handling for production use');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Get validation rules for a specific category
   */
  getValidationRules(category?: string): ValidationRule[] {
    const allRules = Array.from(this.rules.values());
    return category ? allRules.filter(rule => rule.category === category) : allRules;
  }

  /**
   * Check if auto-fix is available for an issue
   */
  canAutoFix(_issueId: string): boolean {
    // Implementation would check if the specific issue has auto-fix capability
    return false; // Simplified for now
  }
}

export const comprehensiveValidationEngine = new ComprehensiveValidationEngine();