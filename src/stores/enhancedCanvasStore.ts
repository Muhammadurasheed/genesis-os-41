
import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

interface EnhancedCanvasState {
  // Core Canvas State
  workflowNodes: Node[];
  workflowEdges: Edge[];
  setWorkflowNodes: (nodes: Node[]) => void;
  setWorkflowEdges: (edges: Edge[]) => void;
  
  // Enhanced Selection
  selectedNodes: string[];
  selectedEdges: string[];
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  
  // History & Undo/Redo
  history: { nodes: Node[]; edges: Edge[]; timestamp: Date }[];
  historyIndex: number;
  maxHistorySize: number;
  addToHistory: (nodes: Node[], edges: Edge[]) => void;
  undo: () => { nodes: Node[]; edges: Edge[] } | null;
  redo: () => { nodes: Node[]; edges: Edge[] } | null;
  clearHistory: () => void;
  
  // Auto-save
  lastSaved: Date | null;
  autoSaveInterval: number;
  setLastSaved: (date: Date) => void;
  setAutoSaveInterval: (interval: number) => void;
  
  // Canvas Mode
  canvasMode: 'design' | 'debug' | 'simulation';
  setCanvasMode: (mode: 'design' | 'debug' | 'simulation') => void;
  
  // Metrics and Performance
  metrics: {
    nodeCount: number;
    edgeCount: number;
    lastUpdate: Date | null;
  };
  
  // Collaboration
  isCollaborative: boolean;
  setCollaborative: (collaborative: boolean) => void;
  
  // Smart Suggestions
  smartSuggestions: Array<{
    id: string;
    type: 'node' | 'edge' | 'optimization';
    suggestion: string;
    confidence: number;
  }>;
  
  // Neural Network Visualization
  showNeuralNetwork: boolean;
  setShowNeuralNetwork: (show: boolean) => void;
  
  // Performance Mode
  performanceMode: 'high' | 'balanced' | 'eco';
  setPerformanceMode: (mode: 'high' | 'balanced' | 'eco') => void;
  
  // Actions
  reset: () => void;
}

export const useEnhancedCanvasStore = create<EnhancedCanvasState>((set, get) => ({
  // Core Canvas State
  workflowNodes: [],
  workflowEdges: [],
  setWorkflowNodes: (nodes) => set({ workflowNodes: nodes }),
  setWorkflowEdges: (edges) => set({ workflowEdges: edges }),
  
  // Enhanced Selection
  selectedNodes: [],
  selectedEdges: [],
  setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
  setSelectedEdges: (edgeIds) => set({ selectedEdges: edgeIds }),
  
  // History & Undo/Redo
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  addToHistory: (nodes, edges) => {
    const { history, historyIndex, maxHistorySize } = get();
    
    const newHistory = history.slice(0, historyIndex + 1);
    
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: new Date()
    });
    
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    } else {
      set({ historyIndex: historyIndex + 1 });
    }
    
    set({ history: newHistory });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({ historyIndex: newIndex });
      return {
        nodes: history[newIndex].nodes,
        edges: history[newIndex].edges
      };
    }
    return null;
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({ historyIndex: newIndex });
      return {
        nodes: history[newIndex].nodes,
        edges: history[newIndex].edges
      };
    }
    return null;
  },
  
  clearHistory: () => set({ history: [], historyIndex: -1 }),
  
  // Auto-save
  lastSaved: null,
  autoSaveInterval: 30000,
  setLastSaved: (date) => set({ lastSaved: date }),
  setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
  
  // Canvas Mode
  canvasMode: 'design',
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  
  // Metrics
  metrics: {
    nodeCount: 0,
    edgeCount: 0,
    lastUpdate: null,
  },
  
  // Collaboration
  isCollaborative: false,
  setCollaborative: (collaborative) => set({ isCollaborative: collaborative }),
  
  // Smart Suggestions
  smartSuggestions: [],
  
  // Neural Network
  showNeuralNetwork: false,
  setShowNeuralNetwork: (show) => set({ showNeuralNetwork: show }),
  
  // Performance
  performanceMode: 'balanced',
  setPerformanceMode: (mode) => set({ performanceMode: mode }),
  
  // Actions
  reset: () => {
    set({
      selectedNodes: [],
      selectedEdges: [],
      history: [],
      historyIndex: -1,
      lastSaved: null,
      canvasMode: 'design',
      isCollaborative: false,
      smartSuggestions: [],
      showNeuralNetwork: false,
      performanceMode: 'balanced'
    });
  },
}));
