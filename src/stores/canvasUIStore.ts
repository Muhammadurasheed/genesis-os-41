
import { create } from 'zustand';
import { SmartSuggestion, AutoLayoutOptions, CanvasShortcut, NodeTemplate } from '../types';

interface CanvasUIState {
  // Canvas Mode
  canvasMode: 'design' | 'simulate' | 'deploy' | 'debug';
  setCanvasMode: (mode: 'design' | 'simulate' | 'deploy' | 'debug') => void;
  
  // Smart Features
  smartSuggestions: SmartSuggestion[];
  autoLayoutEnabled: boolean;
  layoutOptions: AutoLayoutOptions;
  setSuggestions: (suggestions: SmartSuggestion[]) => void;
  setAutoLayoutEnabled: (enabled: boolean) => void;
  setLayoutOptions: (options: AutoLayoutOptions) => void;
  
  // Visual Settings
  showGrid: boolean;
  showMinimap: boolean;
  showNeuralNetwork: boolean;
  showParticles: boolean;
  particleIntensity: number;
  setShowGrid: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setShowNeuralNetwork: (show: boolean) => void;
  setShowParticles: (show: boolean) => void;
  setParticleIntensity: (intensity: number) => void;
  
  // Canvas Viewport
  viewport: { x: number; y: number; zoom: number };
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  centerCanvas: () => void;
  zoomToFit: () => void;
  
  // Node Templates
  nodeTemplates: NodeTemplate[];
  customTemplates: NodeTemplate[];
  addNodeTemplate: (template: NodeTemplate) => void;
  removeNodeTemplate: (templateId: string) => void;
  
  // Keyboard Shortcuts
  shortcuts: CanvasShortcut[];
  addShortcut: (shortcut: CanvasShortcut) => void;
  removeShortcut: (key: string) => void;
  
  // Canvas Themes
  currentTheme: string;
  themes: Record<string, any>;
  setTheme: (themeId: string) => void;
}

export const useCanvasUIStore = create<CanvasUIState>((set, get) => ({
  // Canvas Mode
  canvasMode: 'design',
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  
  // Smart Features
  smartSuggestions: [],
  autoLayoutEnabled: true,
  layoutOptions: {
    algorithm: 'dagre',
    direction: 'TB',
    spacing: { x: 250, y: 150 },
    animate: true,
  },
  setSuggestions: (suggestions) => set({ smartSuggestions: suggestions }),
  setAutoLayoutEnabled: (enabled) => set({ autoLayoutEnabled: enabled }),
  setLayoutOptions: (options) => set({ layoutOptions: options }),
  
  // Visual Settings
  showGrid: true,
  showMinimap: true,
  showNeuralNetwork: true,
  showParticles: true,
  particleIntensity: 0.4,
  setShowGrid: (show) => set({ showGrid: show }),
  setShowMinimap: (show) => set({ showMinimap: show }),
  setShowNeuralNetwork: (show) => set({ showNeuralNetwork: show }),
  setShowParticles: (show) => set({ showParticles: show }),
  setParticleIntensity: (intensity) => set({ particleIntensity: intensity }),
  
  // Canvas Viewport
  viewport: { x: 0, y: 0, zoom: 1 },
  setViewport: (viewport) => set({ viewport }),
  centerCanvas: () => {
    set({ viewport: { x: 0, y: 0, zoom: 1 } });
  },
  zoomToFit: () => {
    set({ viewport: { x: 0, y: 0, zoom: 0.8 } });
  },
  
  // Node Templates
  nodeTemplates: [
    {
      id: 'agent-template',
      type: 'agent',
      name: 'AI Agent',
      description: 'Intelligent digital worker',
      icon: () => null,
      color: 'from-purple-500 to-pink-500',
      category: 'Core',
      defaultData: { status: 'ready' },
      connectable: { input: true, output: true, multiple: true }
    },
  ],
  customTemplates: [],
  addNodeTemplate: (template) => {
    const { customTemplates } = get();
    set({ customTemplates: [...customTemplates, template] });
  },
  removeNodeTemplate: (templateId) => {
    const { customTemplates } = get();
    set({ 
      customTemplates: customTemplates.filter(t => t.id !== templateId) 
    });
  },
  
  // Keyboard Shortcuts
  shortcuts: [
    {
      key: 's',
      modifiers: ['ctrl'],
      action: 'save',
      description: 'Save canvas'
    },
    {
      key: 'z',
      modifiers: ['ctrl'],
      action: 'undo',
      description: 'Undo last action'
    },
    {
      key: 'z',
      modifiers: ['ctrl', 'shift'],
      action: 'redo',
      description: 'Redo last action'
    },
    {
      key: 'r',
      modifiers: ['ctrl', 'shift'],
      action: 'execute',
      description: 'Run workflow'
    },
  ],
  addShortcut: (shortcut) => {
    const { shortcuts } = get();
    set({ shortcuts: [...shortcuts, shortcut] });
  },
  removeShortcut: (key) => {
    const { shortcuts } = get();
    set({ shortcuts: shortcuts.filter(s => s.key !== key) });
  },
  
  // Canvas Themes
  currentTheme: 'quantum',
  themes: {
    quantum: {
      name: 'Quantum',
      colors: {
        background: 'from-slate-900 via-purple-900 to-slate-900',
        node: 'bg-white/10',
        edge: '#8b5cf6',
        selection: '#8b5cf6',
        grid: '#ffffff',
      },
      effects: {
        particles: true,
        neural_network: true,
        glow: true,
        shadows: true,
      }
    },
    minimal: {
      name: 'Minimal',
      colors: {
        background: 'from-gray-50 to-gray-100',
        node: 'bg-white',
        edge: '#6b7280',
        selection: '#3b82f6',
        grid: '#e5e7eb',
      },
      effects: {
        particles: false,
        neural_network: false,
        glow: false,
        shadows: true,
      }
    }
  },
  setTheme: (themeId) => set({ currentTheme: themeId }),
}));
