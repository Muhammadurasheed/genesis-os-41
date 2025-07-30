
import { create } from 'zustand';
import { CollaborationUser } from '../types';

interface CollaborationState {
  // Collaboration
  isCollaborative: boolean;
  collaborators: CollaborationUser[];
  setIsCollaborative: (enabled: boolean) => void;
  addCollaborator: (user: CollaborationUser) => void;
  updateCollaborator: (userId: string, updates: Partial<CollaborationUser>) => void;
  removeCollaborator: (userId: string) => void;
  
  // Real-time cursor tracking
  cursors: Record<string, { x: number; y: number; color: string }>;
  updateCursor: (userId: string, position: { x: number; y: number }, color: string) => void;
  removeCursor: (userId: string) => void;
  
  // Active selections
  activeSelections: Record<string, { nodeIds: string[]; edgeIds: string[] }>;
  updateUserSelection: (userId: string, nodeIds: string[], edgeIds: string[]) => void;
  clearUserSelection: (userId: string) => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  // Collaboration
  isCollaborative: false,
  collaborators: [],
  setIsCollaborative: (enabled) => set({ isCollaborative: enabled }),
  addCollaborator: (user) => {
    const { collaborators } = get();
    set({ collaborators: [...collaborators, user] });
  },
  updateCollaborator: (userId, updates) => {
    const { collaborators } = get();
    set({
      collaborators: collaborators.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      )
    });
  },
  removeCollaborator: (userId) => {
    const { collaborators, cursors, activeSelections } = get();
    const newCursors = { ...cursors };
    delete newCursors[userId];
    
    const newSelections = { ...activeSelections };
    delete newSelections[userId];
    
    set({ 
      collaborators: collaborators.filter(user => user.id !== userId),
      cursors: newCursors,
      activeSelections: newSelections
    });
  },
  
  // Real-time cursor tracking
  cursors: {},
  updateCursor: (userId, position, color) => {
    const { cursors } = get();
    set({
      cursors: {
        ...cursors,
        [userId]: { ...position, color }
      }
    });
  },
  removeCursor: (userId) => {
    const { cursors } = get();
    const newCursors = { ...cursors };
    delete newCursors[userId];
    set({ cursors: newCursors });
  },
  
  // Active selections
  activeSelections: {},
  updateUserSelection: (userId, nodeIds, edgeIds) => {
    const { activeSelections } = get();
    set({
      activeSelections: {
        ...activeSelections,
        [userId]: { nodeIds, edgeIds }
      }
    });
  },
  clearUserSelection: (userId) => {
    const { activeSelections } = get();
    const newSelections = { ...activeSelections };
    delete newSelections[userId];
    set({ activeSelections: newSelections });
  },
}));
