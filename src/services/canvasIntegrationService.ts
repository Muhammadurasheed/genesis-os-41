import { backendAPIService } from './backendAPIService';
import { supabase } from '../lib/supabase';

interface CanvasGenerationRequest {
  blueprint: any;
  canvasType: 'standard' | 'enterprise' | 'quantum';
  collaboration?: {
    enabled: boolean;
    maxUsers?: number;
  };
}

interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: any;
  markerEnd?: any;
}

interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  metadata: {
    generated_at: string;
    canvas_type: string;
    quality_score: number;
    node_count: number;
    edge_count: number;
  };
}

class CanvasIntegrationService {
  /**
   * Phase 1: Canvas Engine Integration
   * Generate canvas from blueprint using backend orchestrator
   */
  async generateCanvasFromBlueprint(request: CanvasGenerationRequest): Promise<CanvasData> {
    try {
      console.log('🎨 Canvas Engine: Generating canvas from blueprint...');
      
      // Try backend orchestrator first
      try {
        const canvasData = await this.generateCanvasViaBackend(request);
        if (canvasData) {
          console.log('✅ Canvas generated via backend orchestrator');
          return canvasData;
        }
      } catch (backendError) {
        console.warn('Backend canvas generation failed, using edge function fallback:', backendError);
      }
      
      // Fallback to edge function
      return await this.generateCanvasViaEdgeFunction(request);
    } catch (error) {
      console.error('Canvas generation failed:', error);
      throw error;
    }
  }

  /**
   * Backend orchestrator canvas generation
   */
  private async generateCanvasViaBackend(request: CanvasGenerationRequest): Promise<CanvasData> {
    // Use orchestrator service for canvas generation
    const response = await fetch('/api/canvas/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        blueprint: request.blueprint,
        canvas_type: request.canvasType,
        collaboration: request.collaboration
      })
    });

    if (!response.ok) {
      throw new Error(`Backend canvas generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Edge function fallback canvas generation
   */
  private async generateCanvasViaEdgeFunction(request: CanvasGenerationRequest): Promise<CanvasData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await supabase.functions.invoke('advanced-canvas-generation', {
      body: {
        blueprint: request.blueprint,
        canvas_type: request.canvasType,
        collaboration: request.collaboration
      }
    });

    if (response.error) {
      throw new Error(`Canvas generation failed: ${response.error.message}`);
    }

    return response.data;
  }

  /**
   * Phase 1: Real-time collaboration integration
   */
  async enableCollaboration(canvasId: string, userId: string): Promise<void> {
    try {
      // Try backend real-time service first
      await this.enableBackendCollaboration(canvasId, userId);
    } catch (error) {
      console.warn('Backend collaboration setup failed, using Supabase realtime fallback:', error);
      await this.enableSupabaseCollaboration(canvasId, userId);
    }
  }

  private async enableBackendCollaboration(canvasId: string, userId: string): Promise<void> {
    const response = await fetch('/api/canvas/collaboration/enable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ canvas_id: canvasId, user_id: userId })
    });

    if (!response.ok) {
      throw new Error('Backend collaboration setup failed');
    }
  }

  private async enableSupabaseCollaboration(canvasId: string, userId: string): Promise<void> {
    const response = await supabase.functions.invoke('realtime-collaboration', {
      body: { canvas_id: canvasId, user_id: userId, action: 'enable' }
    });

    if (response.error) {
      throw new Error(`Supabase collaboration setup failed: ${response.error.message}`);
    }
  }

  /**
   * Phase 1: Canvas validation and optimization
   */
  async validateCanvas(nodes: CanvasNode[], edges: CanvasEdge[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    try {
      // Try backend validation first
      const response = await fetch('/api/canvas/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ nodes, edges })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend validation failed, using local validation:', error);
    }

    // Fallback to local validation
    return this.validateCanvasLocally(nodes, edges);
  }

  private validateCanvasLocally(nodes: CanvasNode[], edges: CanvasEdge[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for orphaned nodes
    const connectedNodeIds = new Set();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const orphanedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
    if (orphanedNodes.length > 0) {
      warnings.push(`${orphanedNodes.length} orphaned nodes found`);
    }

    // Check for invalid connections
    edges.forEach(edge => {
      const sourceExists = nodes.find(node => node.id === edge.source);
      const targetExists = nodes.find(node => node.id === edge.target);
      
      if (!sourceExists) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!targetExists) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    });

    // Performance suggestions
    if (nodes.length > 50) {
      suggestions.push('Consider grouping nodes for better performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Phase 1: Canvas-to-execution pipeline
   */
  async convertCanvasToWorkflow(nodes: CanvasNode[], edges: CanvasEdge[]): Promise<{
    workflow_id: string;
    execution_plan: any;
    estimated_runtime: number;
  }> {
    try {
      // Try backend orchestrator
      const response = await fetch('/api/workflow/from-canvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ nodes, edges })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend workflow conversion failed, using edge function:', error);
    }

    // Fallback to edge function
    const response = await supabase.functions.invoke('workflow-execution-advanced', {
      body: { action: 'convert_canvas', nodes, edges }
    });

    if (response.error) {
      throw new Error(`Workflow conversion failed: ${response.error.message}`);
    }

    return response.data;
  }

  /**
   * Phase 1: Canvas version control
   */
  async saveCanvasVersion(canvasData: CanvasData, version: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('canvas_versions')
      .insert({
        user_id: session.user.id,
        canvas_data: canvasData,
        version,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Phase 1: Canvas analytics and monitoring
   */
  async getCanvasAnalytics(): Promise<{
    usage_stats: any;
    performance_metrics: any;
    collaboration_data: any;
  }> {
    try {
      // Try backend analytics
      const response = await backendAPIService.getSystemAnalytics('24h');
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.warn('Backend analytics failed, using local metrics:', error);
    }

    // Return basic metrics
    return {
      usage_stats: {
        total_opens: 0,
        total_edits: 0,
        last_accessed: new Date().toISOString()
      },
      performance_metrics: {
        avg_load_time: 0,
        avg_save_time: 0
      },
      collaboration_data: {
        active_users: 0,
        total_collaborators: 0
      }
    };
  }
}

export const canvasIntegrationService = new CanvasIntegrationService();