import { v4 as uuidv4 } from 'uuid';
import blueprintService from './blueprintService';

interface CanvasGenerationOptions {
  layout?: 'hierarchical' | 'force-directed' | 'circular' | 'grid';
  optimization?: 'performance' | 'readability' | 'compact';
  visualization?: 'professional' | 'minimal' | 'detailed';
  theme?: 'light' | 'dark' | 'auto';
}

interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  metadata: {
    generation_time: string;
    blueprint_id?: string;
    layout: string;
    optimization: string;
    node_count: number;
    edge_count: number;
  };
}

class CanvasOrchestrationService {
  constructor() {
    console.log('🎨 Canvas Orchestration Service initialized');
  }

  /**
   * Generate canvas from blueprint - MOVED FROM FastAPI
   */
  public generateCanvasFromBlueprint(blueprint: any, options: CanvasGenerationOptions = {}): CanvasData {
    console.log('🎨 Generating canvas from blueprint...');
    
    const { nodes, edges } = blueprintService.generateCanvasFromBlueprint(blueprint);
    
    const metadata = {
      generation_time: new Date().toISOString(),
      blueprint_id: blueprint.id,
      layout: options.layout || 'hierarchical',
      optimization: options.optimization || 'performance',
      node_count: nodes.length,
      edge_count: edges.length
    };

    console.log(`✅ Generated canvas with ${nodes.length} nodes and ${edges.length} edges`);

    return {
      nodes,
      edges,
      metadata
    };
  }

  /**
   * Generate enterprise canvas - ENHANCED VERSION
   */
  public generateEnterpriseCanvas(blueprint: any, options: CanvasGenerationOptions = {}): CanvasData {
    console.log('🏢 Generating enterprise canvas...');
    
    const { nodes, edges } = blueprintService.generateEnterpriseCanvasFromBlueprint(blueprint, options);
    
    const metadata = {
      generation_time: new Date().toISOString(),
      blueprint_id: blueprint.id,
      layout: options.layout || 'hierarchical',
      optimization: options.optimization || 'performance',
      node_count: nodes.length,
      edge_count: edges.length
    };

    console.log(`✅ Generated enterprise canvas with ${nodes.length} nodes and ${edges.length} edges`);

    return {
      nodes,
      edges,
      metadata
    };
  }

  /**
   * Optimize canvas layout - BUSINESS LOGIC ORCHESTRATION
   */
  public optimizeCanvasLayout(
    nodes: CanvasNode[], 
    edges: CanvasEdge[], 
    options: { algorithm?: string; objectives?: string[] } = {}
  ): CanvasData {
    console.log('🎯 Optimizing canvas layout...');
    
    const optimizedCanvas = blueprintService.optimizeCanvasLayout(nodes, edges, options);
    
    const metadata = {
      generation_time: new Date().toISOString(),
      layout: options.algorithm || 'force-directed',
      optimization: 'layout-optimized',
      node_count: optimizedCanvas.nodes.length,
      edge_count: optimizedCanvas.edges.length
    };

    console.log(`✅ Layout optimized: ${optimizedCanvas.nodes.length} nodes repositioned`);

    return {
      ...optimizedCanvas,
      metadata
    };
  }

  /**
   * Validate canvas structure
   */
  public validateCanvas(nodes: CanvasNode[], edges: CanvasEdge[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const connectedNodes = new Set();
    
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
      
      // Validate edge references
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    });

    // Check for orphaned nodes
    nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        warnings.push(`Node ${node.id} is not connected to any other nodes`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Create singleton instance
const canvasOrchestrationService = new CanvasOrchestrationService();
export default canvasOrchestrationService;