import { NodeData } from '../../types/canvas';

interface UIState {
  complexity: 'beginner' | 'intermediate' | 'advanced';
  visibleFeatures: Set<string>;
  completedSteps: Set<string>;
  currentFocus: string | null;
}

interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  category: 'core' | 'advanced' | 'expert';
  impact: 'low' | 'medium' | 'high';
}

interface SuggestionContext {
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  currentStep: string;
  availableNodes: NodeData[];
  completedActions: string[];
}

class ProgressiveDisclosureEngine {
  private features: Map<string, FeatureDefinition> = new Map();
  private userState: UIState;
  private adaptiveThresholds = {
    beginner: { maxNodes: 5, maxConnections: 8 },
    intermediate: { maxNodes: 15, maxConnections: 25 },
    advanced: { maxNodes: 50, maxConnections: 100 }
  };

  constructor() {
    this.initializeFeatures();
    this.userState = {
      complexity: 'beginner',
      visibleFeatures: new Set(['basic_nodes', 'simple_connections']),
      completedSteps: new Set(),
      currentFocus: null
    };
  }

  /**
   * Initialize all available features with their complexity levels
   */
  private initializeFeatures(): void {
    const featureDefinitions: FeatureDefinition[] = [
      // Beginner Features
      {
        id: 'basic_nodes',
        name: 'Basic Nodes',
        description: 'Trigger, Action, and Output nodes',
        complexity: 'beginner',
        prerequisites: [],
        category: 'core',
        impact: 'high'
      },
      {
        id: 'simple_connections',
        name: 'Simple Connections',
        description: 'Connect nodes with straight lines',
        complexity: 'beginner',
        prerequisites: ['basic_nodes'],
        category: 'core',
        impact: 'high'
      },
      {
        id: 'node_configuration',
        name: 'Node Configuration',
        description: 'Configure node parameters and settings',
        complexity: 'beginner',
        prerequisites: ['basic_nodes'],
        category: 'core',
        impact: 'high'
      },

      // Intermediate Features
      {
        id: 'conditional_logic',
        name: 'Conditional Logic',
        description: 'Add conditions and branching to workflows',
        complexity: 'intermediate',
        prerequisites: ['basic_nodes', 'simple_connections'],
        category: 'core',
        impact: 'high'
      },
      {
        id: 'integrations',
        name: 'External Integrations',
        description: 'Connect to external services and APIs',
        complexity: 'intermediate',
        prerequisites: ['node_configuration'],
        category: 'core',
        impact: 'medium'
      },
      {
        id: 'smart_suggestions',
        name: 'Smart Suggestions',
        description: 'AI-powered workflow optimization suggestions',
        complexity: 'intermediate',
        prerequisites: ['conditional_logic'],
        category: 'advanced',
        impact: 'medium'
      },
      {
        id: 'real_time_collaboration',
        name: 'Real-time Collaboration',
        description: 'Work together with team members in real-time',
        complexity: 'intermediate',
        prerequisites: ['node_configuration'],
        category: 'advanced',
        impact: 'medium'
      },

      // Advanced Features
      {
        id: 'advanced_agents',
        name: 'AI Agents',
        description: 'Deploy autonomous AI agents with advanced capabilities',
        complexity: 'advanced',
        prerequisites: ['integrations', 'conditional_logic'],
        category: 'expert',
        impact: 'high'
      },
      {
        id: 'custom_scripting',
        name: 'Custom Scripts',
        description: 'Write custom JavaScript for complex logic',
        complexity: 'advanced',
        prerequisites: ['conditional_logic'],
        category: 'expert',
        impact: 'high'
      },
      {
        id: 'workflow_versioning',
        name: 'Workflow Versioning',
        description: 'Track changes and manage workflow versions',
        complexity: 'advanced',
        prerequisites: ['real_time_collaboration'],
        category: 'expert',
        impact: 'medium'
      },
      {
        id: 'performance_optimization',
        name: 'Performance Optimization',
        description: 'Advanced performance tuning and monitoring',
        complexity: 'advanced',
        prerequisites: ['smart_suggestions'],
        category: 'expert',
        impact: 'low'
      }
    ];

    featureDefinitions.forEach(feature => {
      this.features.set(feature.id, feature);
    });
  }

  /**
   * Update user complexity level based on their actions
   */
  updateUserComplexity(actions: string[], nodeCount: number, connectionCount: number): void {
    const currentLevel = this.userState.complexity;
    let newLevel = currentLevel;

    // Analyze user behavior patterns
    const advancedActions = actions.filter(action => 
      action.includes('script') || action.includes('api') || action.includes('agent')
    ).length;

    const complexityScore = this.calculateComplexityScore(nodeCount, connectionCount, advancedActions);

    // Determine appropriate level
    if (complexityScore > 0.7 && currentLevel !== 'advanced') {
      newLevel = 'advanced';
    } else if (complexityScore > 0.4 && currentLevel === 'beginner') {
      newLevel = 'intermediate';
    }

    if (newLevel !== currentLevel) {
      this.userState.complexity = newLevel;
      this.updateVisibleFeatures();
      console.log(`🎯 User complexity level updated: ${currentLevel} → ${newLevel}`);
    }
  }

  /**
   * Calculate complexity score based on user behavior
   */
  private calculateComplexityScore(nodeCount: number, connectionCount: number, advancedActions: number): number {
    const thresholds = this.adaptiveThresholds;
    
    let score = 0;

    // Node complexity factor
    if (nodeCount > thresholds.advanced.maxNodes) score += 0.4;
    else if (nodeCount > thresholds.intermediate.maxNodes) score += 0.2;

    // Connection complexity factor
    if (connectionCount > thresholds.advanced.maxConnections) score += 0.3;
    else if (connectionCount > thresholds.intermediate.maxConnections) score += 0.15;

    // Advanced actions factor
    score += Math.min(advancedActions * 0.1, 0.3);

    return Math.min(score, 1);
  }

  /**
   * Update visible features based on current complexity level and prerequisites
   */
  private updateVisibleFeatures(): void {
    const { complexity, completedSteps } = this.userState;
    const newVisibleFeatures = new Set<string>();

    for (const [featureId, feature] of this.features) {
      // Show features at or below current complexity level
      const complexityOrder = ['beginner', 'intermediate', 'advanced'];
      const userLevelIndex = complexityOrder.indexOf(complexity);
      const featureLevelIndex = complexityOrder.indexOf(feature.complexity);

      if (featureLevelIndex <= userLevelIndex) {
        // Check if prerequisites are met
        const prerequisitesMet = feature.prerequisites.every(prereq => 
          completedSteps.has(prereq) || newVisibleFeatures.has(prereq)
        );

        if (prerequisitesMet) {
          newVisibleFeatures.add(featureId);
        }
      }
    }

    this.userState.visibleFeatures = newVisibleFeatures;
  }

  /**
   * Generate contextual suggestions based on current state
   */
  generateContextualSuggestions(context: SuggestionContext): string[] {
    const suggestions: string[] = [];
    const { userLevel, currentStep, availableNodes, completedActions } = context;

    try {
      // Beginner suggestions
      if (userLevel === 'beginner') {
        if (availableNodes.length === 0) {
          suggestions.push("Start by adding a Trigger node to begin your workflow");
        } else if (availableNodes.length === 1) {
          suggestions.push("Add an Action node to process data from your trigger");
        } else if (!completedActions.includes('connect_nodes')) {
          suggestions.push("Connect your nodes by dragging from one to another");
        }
      }

      // Intermediate suggestions
      if (userLevel === 'intermediate' || userLevel === 'advanced') {
        if (availableNodes.filter(n => n.type === 'condition').length === 0) {
          suggestions.push("Add conditional logic to make your workflow smarter");
        }
        
        if (availableNodes.filter(n => n.type === 'integration').length === 0) {
          suggestions.push("Connect to external services for more powerful automation");
        }
      }

      // Advanced suggestions
      if (userLevel === 'advanced') {
        if (!completedActions.includes('use_agent')) {
          suggestions.push("Deploy an AI agent for autonomous decision making");
        }
        
        if (!completedActions.includes('version_control')) {
          suggestions.push("Enable version control to track workflow changes");
        }
      }

      // Context-specific suggestions
      if (currentStep === 'canvas_design') {
        suggestions.push("Use the smart connection feature to automatically suggest compatible node connections");
      }

      // Limit suggestions to avoid overwhelming
      return suggestions.slice(0, 3);

    } catch (error) {
      console.error('❌ Error generating suggestions:', error);
      return ["Continue building your workflow step by step"];
    }
  }

  /**
   * Get features available at current complexity level
   */
  getAvailableFeatures(): FeatureDefinition[] {
    const availableFeatures: FeatureDefinition[] = [];
    
    for (const featureId of this.userState.visibleFeatures) {
      const feature = this.features.get(featureId);
      if (feature) {
        availableFeatures.push(feature);
      }
    }

    // Sort by impact and category
    return availableFeatures.sort((a, b) => {
      const categoryOrder = { 'core': 0, 'advanced': 1, 'expert': 2 };
      const impactOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      
      const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
      if (categoryDiff !== 0) return categoryDiff;
      
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }

  /**
   * Mark a step as completed
   */
  markStepCompleted(stepId: string): void {
    this.userState.completedSteps.add(stepId);
    this.updateVisibleFeatures();
    
    console.log(`✅ Step completed: ${stepId}`);
  }

  /**
   * Set current focus area
   */
  setCurrentFocus(focusArea: string | null): void {
    this.userState.currentFocus = focusArea;
  }

  /**
   * Get current UI state
   */
  getCurrentState(): UIState {
    return { ...this.userState };
  }

  /**
   * Check if a feature should be highlighted
   */
  shouldHighlightFeature(featureId: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    // Highlight if it's newly available and high impact
    return this.userState.visibleFeatures.has(featureId) && 
           !this.userState.completedSteps.has(featureId) &&
           feature.impact === 'high';
  }

  /**
   * Get next recommended action
   */
  getNextRecommendedAction(): { action: string; description: string; priority: 'high' | 'medium' | 'low' } | null {
    const availableFeatures = this.getAvailableFeatures();
    
    // Find the highest priority uncompleted feature
    for (const feature of availableFeatures) {
      if (!this.userState.completedSteps.has(feature.id)) {
        return {
          action: feature.id,
          description: feature.description,
          priority: feature.impact as 'high' | 'medium' | 'low'
        };
      }
    }

    return null;
  }

  /**
   * Reset user state (for testing or new users)
   */
  reset(): void {
    this.userState = {
      complexity: 'beginner',
      visibleFeatures: new Set(['basic_nodes', 'simple_connections']),
      completedSteps: new Set(),
      currentFocus: null
    };
  }
}

export const progressiveDisclosureEngine = new ProgressiveDisclosureEngine();