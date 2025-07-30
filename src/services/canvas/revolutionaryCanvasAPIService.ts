// Phase 2: Revolutionary Canvas API Service - Frontend Integration
// Connects frontend to revolutionary backend canvas features

import axios from 'axios';

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:3002';

export interface LayoutOptimizationRequest {
  canvasId: string;
  nodes: any[];
  edges?: any[];
  algorithm?: 'force_directed' | 'hierarchical' | 'circular' | 'organic';
}

export interface ConnectionSuggestionsRequest {
  canvasId: string;
  nodes: any[];
  sourceNodeId?: string;
  targetPosition?: { x: number; y: number };
}

export interface SnapshotRequest {
  canvasId: string;
  nodes: any[];
  edges?: any[];
  author: string;
  message: string;
  tags?: string[];
}

export interface CollaborationEventRequest {
  canvasId: string;
  type: 'cursor_move' | 'node_select' | 'node_edit' | 'edge_create' | 'conflict';
  user_id: string;
  data?: any;
}

class RevolutionaryCanvasAPIService {
  constructor() {
    console.log('🎨 Revolutionary Canvas API Service initialized - Frontend Integration');
  }

  // AI-Powered Layout Optimization
  async optimizeLayout(request: LayoutOptimizationRequest) {
    try {
      console.log(`🧠 Requesting AI layout optimization: ${request.algorithm}`);
      
      const response = await axios.post(`${ORCHESTRATOR_URL}/api/canvas/optimize-layout`, request, {
        timeout: 30000 // 30 second timeout for complex layouts
      });
      
      if (response.data.success) {
        console.log(`✅ Layout optimization completed: ${response.data.optimization.metrics.execution_time}`);
        return {
          success: true,
          optimization: response.data.optimization,
          algorithm: response.data.algorithm_used
        };
      } else {
        throw new Error(response.data.message || 'Layout optimization failed');
      }
    } catch (error: any) {
      console.error('❌ Layout optimization API error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Layout optimization failed'
      };
    }
  }

  // Intelligent Connection Suggestions
  async generateConnectionSuggestions(request: ConnectionSuggestionsRequest) {
    try {
      console.log(`🔗 Requesting connection suggestions for ${request.nodes.length} nodes`);
      
      const response = await axios.post(`${ORCHESTRATOR_URL}/api/canvas/suggest-connections`, request, {
        timeout: 15000 // 15 second timeout
      });
      
      if (response.data.success) {
        console.log(`✅ Generated ${response.data.suggestions.length} connection suggestions`);
        return {
          success: true,
          suggestions: response.data.suggestions,
          features: response.data.features
        };
      } else {
        throw new Error(response.data.message || 'Connection suggestions failed');
      }
    } catch (error: any) {
      console.error('❌ Connection suggestions API error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Connection suggestions failed',
        suggestions: []
      };
    }
  }

  // Git-like Snapshot Creation
  async createSnapshot(request: SnapshotRequest) {
    try {
      console.log(`📸 Creating canvas snapshot: "${request.message}"`);
      
      const response = await axios.post(`${ORCHESTRATOR_URL}/api/canvas/create-snapshot`, request, {
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data.success) {
        console.log(`✅ Snapshot created: ${response.data.snapshot.id} (${response.data.snapshot.version})`);
        return {
          success: true,
          snapshot: response.data.snapshot
        };
      } else {
        throw new Error(response.data.message || 'Snapshot creation failed');
      }
    } catch (error: any) {
      console.error('❌ Snapshot creation API error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Snapshot creation failed'
      };
    }
  }

  // Get Canvas Snapshots
  async getCanvasSnapshots(canvasId: string) {
    try {
      console.log(`📋 Retrieving snapshots for canvas: ${canvasId}`);
      
      const response = await axios.get(`${ORCHESTRATOR_URL}/api/canvas/${canvasId}/snapshots`, {
        timeout: 10000
      });
      
      if (response.data.success) {
        console.log(`✅ Retrieved ${response.data.total_count} snapshots`);
        return {
          success: true,
          snapshots: response.data.snapshots,
          total_count: response.data.total_count
        };
      } else {
        throw new Error(response.data.message || 'Failed to retrieve snapshots');
      }
    } catch (error: any) {
      console.error('❌ Get snapshots API error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to retrieve snapshots',
        snapshots: []
      };
    }
  }

  // Restore Canvas from Snapshot
  async restoreSnapshot(canvasId: string, snapshotId: string) {
    try {
      console.log(`🔄 Restoring canvas from snapshot: ${snapshotId}`);
      
      const response = await axios.post(`${ORCHESTRATOR_URL}/api/canvas/${canvasId}/restore/${snapshotId}`, {}, {
        timeout: 15000
      });
      
      if (response.data.success) {
        console.log(`✅ Canvas restored from snapshot: ${response.data.restored_canvas.version}`);
        return {
          success: true,
          restored_canvas: response.data.restored_canvas
        };
      } else {
        throw new Error(response.data.message || 'Snapshot restoration failed');
      }
    } catch (error: any) {
      console.error('❌ Snapshot restoration API error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Snapshot restoration failed'
      };
    }
  }

  // Real-time Collaboration Events
  async sendCollaborationEvent(request: CollaborationEventRequest) {
    try {
      console.log(`👥 Sending collaboration event: ${request.type}`);
      
      const response = await axios.post(`${ORCHESTRATOR_URL}/api/canvas/collaboration-event`, request, {
        timeout: 5000 // 5 second timeout for real-time events
      });
      
      if (response.data.success) {
        console.log(`✅ Collaboration event sent: ${request.type}`);
        return {
          success: true,
          features: response.data.features
        };
      } else {
        throw new Error(response.data.message || 'Collaboration event failed');
      }
    } catch (error: any) {
      console.error('❌ Collaboration event API error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Collaboration event failed'
      };
    }
  }

  // Health Check for Revolutionary Features
  async checkRevolutionaryFeaturesHealth() {
    try {
      const response = await axios.get(`${ORCHESTRATOR_URL}/status`, {
        timeout: 5000
      });
      
      const orchestratorStatus = response.data.orchestrator || {};
      
      return {
        success: true,
        status: {
          ai_layout_optimization: orchestratorStatus.status === 'healthy',
          connection_suggestions: orchestratorStatus.status === 'healthy',
          version_control: orchestratorStatus.status === 'healthy',
          real_time_collaboration: orchestratorStatus.status === 'healthy'
        },
        features_operational: orchestratorStatus.status === 'healthy'
      };
    } catch (error: any) {
      console.error('❌ Revolutionary features health check failed:', error);
      return {
        success: false,
        status: {
          ai_layout_optimization: false,
          connection_suggestions: false,
          version_control: false,
          real_time_collaboration: false
        },
        features_operational: false
      };
    }
  }
}

// Create singleton instance
const revolutionaryCanvasAPIService = new RevolutionaryCanvasAPIService();
export default revolutionaryCanvasAPIService;