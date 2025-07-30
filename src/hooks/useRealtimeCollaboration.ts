import { useState, useCallback } from 'react';

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number };
  isActive: boolean;
}

export const useRealtimeCollaboration = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: 'user-1',
      name: 'Sarah Chen',
      color: '#10b981',
      cursor: { x: 0, y: 0 },
      isActive: true
    },
    {
      id: 'user-2',
      name: 'Alex Rivera',
      color: '#6366f1',
      cursor: { x: 0, y: 0 },
      isActive: false
    }
  ]);

  const [cursorPositions, setCursorPositions] = useState<Record<string, { x: number; y: number }>>({});

  const updateCursorPosition = useCallback((userId: string, x: number, y: number) => {
    setCursorPositions(prev => ({
      ...prev,
      [userId]: { x, y }
    }));
  }, []);

  const addCollaborator = useCallback((collaborator: Collaborator) => {
    setCollaborators(prev => [...prev, collaborator]);
  }, []);

  const removeCollaborator = useCallback((userId: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== userId));
    setCursorPositions(prev => {
      const { [userId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    collaborators,
    cursorPositions,
    updateCursorPosition,
    addCollaborator,
    removeCollaborator,
    isCollaborating: collaborators.length > 1
  };
};