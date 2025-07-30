import { create } from 'zustand';
import { CanvasMetrics, ExecutionContext } from '../types';

interface PerformanceState {
  // Execution & Performance
  isExecuting: boolean;
  executionContext: ExecutionContext | null;
  metrics: CanvasMetrics;
  setIsExecuting: (executing: boolean) => void;
  setExecutionContext: (context: ExecutionContext | null) => void;
  updateMetrics: (metrics: Partial<CanvasMetrics>) => void;
  
  // Performance Monitoring
  performanceMode: 'auto' | 'high' | 'balanced' | 'low';
  setPerformanceMode: (mode: 'auto' | 'high' | 'balanced' | 'low') => void;
  
  // Debug Mode
  debugMode: boolean;
  debugLogs: any[];
  setDebugMode: (enabled: boolean) => void;
  addDebugLog: (log: any) => void;
  clearDebugLogs: () => void;
  
  // Real-time performance metrics
  frameRate: number;
  memoryUsage: number;
  nodeCount: number;
  edgeCount: number;
  updatePerformanceMetrics: (metrics: {
    frameRate?: number;
    memoryUsage?: number;
    nodeCount?: number;
    edgeCount?: number;
  }) => void;
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  // Execution & Performance
  isExecuting: false,
  executionContext: null,
  metrics: {
    totalNodes: 0,
    completedNodes: 0,
    failedNodes: 0,
    averageExecutionTime: 0,
    successRate: 0,
    performanceScore: 0,
  },
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  setExecutionContext: (context) => set({ executionContext: context }),
  updateMetrics: (metrics) => {
    const currentMetrics = get().metrics;
    set({ metrics: { ...currentMetrics, ...metrics } });
  },
  
  // Performance Monitoring
  performanceMode: 'auto',
  setPerformanceMode: (mode) => set({ performanceMode: mode }),
  
  // Debug Mode
  debugMode: false,
  debugLogs: [],
  setDebugMode: (enabled) => set({ debugMode: enabled }),
  addDebugLog: (log) => {
    const { debugLogs } = get();
    const newLogs = [...debugLogs, { ...log, timestamp: new Date() }];
    // Keep only last 100 logs
    if (newLogs.length > 100) {
      newLogs.shift();
    }
    set({ debugLogs: newLogs });
  },
  clearDebugLogs: () => set({ debugLogs: [] }),
  
  // Real-time performance metrics
  frameRate: 60,
  memoryUsage: 0,
  nodeCount: 0,
  edgeCount: 0,
  updatePerformanceMetrics: (metrics) => {
    set(metrics);
  },
}));
