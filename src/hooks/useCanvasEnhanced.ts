import { useCallback } from 'react';
import { useCanvas } from './useCanvas';
import { useCanvasStore } from '../stores/canvasStore';
import { canvasService } from '../services/canvasService';

/**
 * Enhanced canvas hook with Phase 2 features
 * Provides smart suggestions, real-time validation, and collaboration features
 */
export function useCanvasEnhanced() {
  const baseCanvas = useCanvas();
  const {
    smartConnectionsEnabled,
    userExperienceLevel,
    validationResults,
    setValidationResults,
    suggestions,
    setSuggestions,
  } = useCanvasStore();

  // Enhanced validation with comprehensive results
  const validateWorkflowEnhanced = useCallback(async () => {
    try {
      const results = await canvasService.validateWorkflow(baseCanvas.nodes, baseCanvas.edges);
      setValidationResults(results as any);
      return results;
    } catch (error) {
      console.error('Enhanced validation failed:', error);
      const fallbackResults = { isValid: false, errors: ['Validation service unavailable'], warnings: [], suggestions: [] };
      setValidationResults(fallbackResults);
      return fallbackResults;
    }
  }, [baseCanvas.nodes, baseCanvas.edges, setValidationResults]);

  // Smart suggestions generator
  const generateSmartSuggestions = useCallback(async () => {
    try {
      const newSuggestions = await canvasService.getSmartSuggestions(baseCanvas.nodes, {
        userExperience: userExperienceLevel,
        currentValidation: validationResults
      });
      setSuggestions(newSuggestions);
      return newSuggestions;
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }, [baseCanvas.nodes, userExperienceLevel, validationResults, setSuggestions]);

  // Enhanced connection suggestions
  const getSuggestedConnections = useCallback(async (sourceNodeId: string, targetPosition: { x: number; y: number }) => {
    try {
      return await canvasService.suggestConnections(sourceNodeId, targetPosition, baseCanvas.nodes);
    } catch (error) {
      console.error('Failed to get connection suggestions:', error);
      return [];
    }
  }, [baseCanvas.nodes]);

  // Auto-optimization with enhanced layout
  const optimizeLayoutEnhanced = useCallback(async () => {
    try {
      const result = await canvasService.optimizeLayout(baseCanvas.nodes, baseCanvas.edges);
      if (result && result.nodes && result.edges) {
        baseCanvas.setNodes(result.nodes);
        baseCanvas.setEdges(result.edges);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Enhanced layout optimization failed:', error);
      return null;
    }
  }, [baseCanvas.nodes, baseCanvas.edges, baseCanvas.setNodes, baseCanvas.setEdges]);

  return {
    // Base canvas functionality
    ...baseCanvas,
    
    // Enhanced Phase 2 features
    validateWorkflowEnhanced,
    generateSmartSuggestions,
    getSuggestedConnections,
    optimizeLayoutEnhanced,
    
    // State from canvas store
    smartConnectionsEnabled,
    userExperienceLevel,
    validationResults,
    suggestions,
  };
}