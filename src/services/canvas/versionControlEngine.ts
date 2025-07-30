import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/canvas';

interface CanvasVersion {
  id: string;
  version: string;
  timestamp: Date;
  author: string;
  message: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    complexity: 'low' | 'medium' | 'high';
    changes?: ChangeRecord[];
  };
}

interface ChangeRecord {
  type: 'node_added' | 'node_removed' | 'node_modified' | 'edge_added' | 'edge_removed' | 'edge_modified';
  elementId: string;
  elementType: 'node' | 'edge';
  before?: any;
  after?: any;
  timestamp: Date;
}

interface UndoRedoState {
  history: CanvasVersion[];
  currentIndex: number;
  maxHistorySize: number;
  lastSaveIndex: number;
}

class VersionControlEngine {
  private state: UndoRedoState;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private changeListeners: ((version: CanvasVersion) => void)[] = [];

  constructor() {
    this.state = {
      history: [],
      currentIndex: -1,
      maxHistorySize: 50,
      lastSaveIndex: -1
    };

    console.log('🔄 Version Control Engine initialized');
  }

  /**
   * Create a new version snapshot
   */
  createVersion(
    nodes: Node<NodeData>[],
    edges: Edge[],
    message: string = 'Auto-save',
    author: string = 'User'
  ): CanvasVersion {
    const version: CanvasVersion = {
      id: `v${Date.now()}`,
      version: this.generateVersionNumber(),
      timestamp: new Date(),
      author,
      message,
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(edges)), // Deep clone
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        complexity: this.calculateComplexity(nodes, edges),
        changes: this.detectChanges(nodes, edges)
      }
    };

    return version;
  }

  /**
   * Add a version to history
   */
  addToHistory(
    nodes: Node<NodeData>[],
    edges: Edge[],
    message: string = 'Canvas update',
    author: string = 'User'
  ): void {
    try {
      const newVersion = this.createVersion(nodes, edges, message, author);

      // Remove any versions after current index (if user was in the middle of history)
      if (this.state.currentIndex < this.state.history.length - 1) {
        this.state.history = this.state.history.slice(0, this.state.currentIndex + 1);
      }

      // Add new version
      this.state.history.push(newVersion);
      this.state.currentIndex = this.state.history.length - 1;

      // Maintain max history size
      if (this.state.history.length > this.state.maxHistorySize) {
        this.state.history.shift();
        this.state.currentIndex--;
        if (this.state.lastSaveIndex > 0) {
          this.state.lastSaveIndex--;
        }
      }

      // Notify listeners
      this.notifyChangeListeners(newVersion);

      console.log(`📝 Version added: ${newVersion.version} - ${message}`);
    } catch (error) {
      console.error('❌ Error adding version to history:', error);
    }
  }

  /**
   * Undo to previous version
   */
  undo(): { nodes: Node<NodeData>[]; edges: Edge[]; version: CanvasVersion } | null {
    if (!this.canUndo()) {
      console.warn('⚠️ Cannot undo: Already at oldest version');
      return null;
    }

    try {
      this.state.currentIndex--;
      const version = this.state.history[this.state.currentIndex];
      
      console.log(`↩️ Undo to version: ${version.version}`);
      
      return {
        nodes: JSON.parse(JSON.stringify(version.nodes)),
        edges: JSON.parse(JSON.stringify(version.edges)),
        version
      };
    } catch (error) {
      console.error('❌ Error during undo:', error);
      return null;
    }
  }

  /**
   * Redo to next version
   */
  redo(): { nodes: Node<NodeData>[]; edges: Edge[]; version: CanvasVersion } | null {
    if (!this.canRedo()) {
      console.warn('⚠️ Cannot redo: Already at newest version');
      return null;
    }

    try {
      this.state.currentIndex++;
      const version = this.state.history[this.state.currentIndex];
      
      console.log(`↪️ Redo to version: ${version.version}`);
      
      return {
        nodes: JSON.parse(JSON.stringify(version.nodes)),
        edges: JSON.parse(JSON.stringify(version.edges)),
        version
      };
    } catch (error) {
      console.error('❌ Error during redo:', error);
      return null;
    }
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.state.currentIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.state.currentIndex < this.state.history.length - 1;
  }

  /**
   * Get current version
   */
  getCurrentVersion(): CanvasVersion | null {
    if (this.state.currentIndex >= 0 && this.state.currentIndex < this.state.history.length) {
      return this.state.history[this.state.currentIndex];
    }
    return null;
  }

  /**
   * Get version history
   */
  getHistory(): CanvasVersion[] {
    return [...this.state.history];
  }

  /**
   * Jump to specific version
   */
  jumpToVersion(versionId: string): { nodes: Node<NodeData>[]; edges: Edge[]; version: CanvasVersion } | null {
    const versionIndex = this.state.history.findIndex(v => v.id === versionId);
    
    if (versionIndex === -1) {
      console.warn(`⚠️ Version ${versionId} not found in history`);
      return null;
    }

    try {
      this.state.currentIndex = versionIndex;
      const version = this.state.history[versionIndex];
      
      console.log(`🎯 Jumped to version: ${version.version}`);
      
      return {
        nodes: JSON.parse(JSON.stringify(version.nodes)),
        edges: JSON.parse(JSON.stringify(version.edges)),
        version
      };
    } catch (error) {
      console.error('❌ Error jumping to version:', error);
      return null;
    }
  }

  /**
   * Generate version number
   */
  private generateVersionNumber(): string {
    const major = Math.floor(this.state.history.length / 10) + 1;
    const minor = this.state.history.length % 10;
    return `${major}.${minor}`;
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexity(nodes: Node[], edges: Edge[]): 'low' | 'medium' | 'high' {
    const score = nodes.length * 2 + edges.length;
    
    if (score < 10) return 'low';
    if (score < 30) return 'medium';
    return 'high';
  }

  /**
   * Detect changes from previous version
   */
  private detectChanges(nodes: Node<NodeData>[], edges: Edge[]): ChangeRecord[] {
    const changes: ChangeRecord[] = [];
    
    if (this.state.history.length === 0) {
      // First version - all nodes and edges are new
      nodes.forEach(node => {
        changes.push({
          type: 'node_added',
          elementId: node.id,
          elementType: 'node',
          after: node,
          timestamp: new Date()
        });
      });
      
      edges.forEach(edge => {
        changes.push({
          type: 'edge_added',
          elementId: edge.id,
          elementType: 'edge',
          after: edge,
          timestamp: new Date()
        });
      });
      
      return changes;
    }

    try {
      const previousVersion = this.state.history[this.state.history.length - 1];
      const prevNodes = previousVersion.nodes;
      const prevEdges = previousVersion.edges;

      // Detect node changes
      const prevNodeMap = new Map(prevNodes.map(n => [n.id, n]));
      const currentNodeMap = new Map(nodes.map(n => [n.id, n]));

      // Added nodes
      for (const node of nodes) {
        if (!prevNodeMap.has(node.id)) {
          changes.push({
            type: 'node_added',
            elementId: node.id,
            elementType: 'node',
            after: node,
            timestamp: new Date()
          });
        } else {
          // Modified nodes
          const prevNode = prevNodeMap.get(node.id);
          if (JSON.stringify(prevNode) !== JSON.stringify(node)) {
            changes.push({
              type: 'node_modified',
              elementId: node.id,
              elementType: 'node',
              before: prevNode,
              after: node,
              timestamp: new Date()
            });
          }
        }
      }

      // Removed nodes
      for (const prevNode of prevNodes) {
        if (!currentNodeMap.has(prevNode.id)) {
          changes.push({
            type: 'node_removed',
            elementId: prevNode.id,
            elementType: 'node',
            before: prevNode,
            timestamp: new Date()
          });
        }
      }

      // Detect edge changes (similar logic)
      const prevEdgeMap = new Map(prevEdges.map(e => [e.id, e]));
      const currentEdgeMap = new Map(edges.map(e => [e.id, e]));

      // Added edges
      for (const edge of edges) {
        if (!prevEdgeMap.has(edge.id)) {
          changes.push({
            type: 'edge_added',
            elementId: edge.id,
            elementType: 'edge',
            after: edge,
            timestamp: new Date()
          });
        }
      }

      // Removed edges
      for (const prevEdge of prevEdges) {
        if (!currentEdgeMap.has(prevEdge.id)) {
          changes.push({
            type: 'edge_removed',
            elementId: prevEdge.id,
            elementType: 'edge',
            before: prevEdge,
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      console.error('❌ Error detecting changes:', error);
    }

    return changes;
  }

  /**
   * Start auto-save
   */
  startAutoSave(
    getCanvasState: () => { nodes: Node<NodeData>[]; edges: Edge[] },
    intervalMs: number = 30000 // 30 seconds
  ): void {
    this.stopAutoSave();
    
    this.autoSaveInterval = setInterval(() => {
      try {
        const { nodes, edges } = getCanvasState();
        
        // Only auto-save if there are changes
        if (this.hasUnsavedChanges(nodes, edges)) {
          this.addToHistory(nodes, edges, 'Auto-save', 'System');
          this.state.lastSaveIndex = this.state.currentIndex;
          console.log('💾 Auto-saved canvas state');
        }
      } catch (error) {
        console.error('❌ Auto-save error:', error);
      }
    }, intervalMs);

    console.log(`⏰ Auto-save started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏹️ Auto-save stopped');
    }
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(nodes: Node<NodeData>[], edges: Edge[]): boolean {
    if (this.state.history.length === 0) return true;
    if (this.state.lastSaveIndex !== this.state.currentIndex) return true;

    try {
      const currentVersion = this.getCurrentVersion();
      if (!currentVersion) return true;

      const currentState = JSON.stringify({ nodes, edges });
      const savedState = JSON.stringify({ 
        nodes: currentVersion.nodes, 
        edges: currentVersion.edges 
      });

      return currentState !== savedState;
    } catch (error) {
      console.error('❌ Error checking unsaved changes:', error);
      return true;
    }
  }

  /**
   * Mark current state as saved
   */
  markAsSaved(): void {
    this.state.lastSaveIndex = this.state.currentIndex;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.state.history = [];
    this.state.currentIndex = -1;
    this.state.lastSaveIndex = -1;
    console.log('🗑️ Version history cleared');
  }

  /**
   * Export version history
   */
  exportHistory(): string {
    try {
      const exportData = {
        metadata: {
          exported: new Date().toISOString(),
          totalVersions: this.state.history.length,
          currentVersion: this.state.currentIndex
        },
        history: this.state.history
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Error exporting history:', error);
      return '{}';
    }
  }

  /**
   * Import version history
   */
  importHistory(historyData: string): boolean {
    try {
      const data = JSON.parse(historyData);
      
      if (!data.history || !Array.isArray(data.history)) {
        throw new Error('Invalid history data format');
      }

      this.state.history = data.history.map((v: any) => ({
        ...v,
        timestamp: new Date(v.timestamp)
      }));
      
      this.state.currentIndex = Math.min(
        data.metadata?.currentVersion || 0,
        this.state.history.length - 1
      );
      
      this.state.lastSaveIndex = this.state.currentIndex;

      console.log(`📥 Imported ${this.state.history.length} versions`);
      return true;
    } catch (error) {
      console.error('❌ Error importing history:', error);
      return false;
    }
  }

  /**
   * Add change listener
   */
  addChangeListener(listener: (version: CanvasVersion) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove change listener
   */
  removeChangeListener(listener: (version: CanvasVersion) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Notify change listeners
   */
  private notifyChangeListeners(version: CanvasVersion): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(version);
      } catch (error) {
        console.error('❌ Error in change listener:', error);
      }
    });
  }

  /**
   * Get version control statistics
   */
  getStatistics(): {
    totalVersions: number;
    currentVersion: string;
    canUndo: boolean;
    canRedo: boolean;
    hasUnsavedChanges: boolean;
    lastSaved: Date | null;
  } {
    const currentVersion = this.getCurrentVersion();
    
    return {
      totalVersions: this.state.history.length,
      currentVersion: currentVersion?.version || 'No versions',
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      hasUnsavedChanges: this.state.lastSaveIndex !== this.state.currentIndex,
      lastSaved: this.state.lastSaveIndex >= 0 ? 
        this.state.history[this.state.lastSaveIndex]?.timestamp || null : null
    };
  }
}

export const versionControlEngine = new VersionControlEngine();