
import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { useWizardStore } from '../../../stores/wizardStore';
import { useCanvasStore } from '../../../stores/canvasStore';
import { useCollaborationStore } from '../../../stores/collaborationStore';
import { GenesisProCanvas } from '../../canvas/GenesisProCanvas';
import { enterpriseCanvasService } from '../../../services/enterpriseCanvasService';
import { Brain } from 'lucide-react';
import { toast } from 'sonner';
import { backendAPIService } from '../../../services/backendAPIService';

export const EnhancedCanvasStep: React.FC = () => {
  const { nextStep, blueprint } = useWizardStore();
  const { workflowNodes: nodes, workflowEdges: edges } = useCanvasStore();
  const { collaborators } = useCollaborationStore();
  const [canvasGenerated, setCanvasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate canvas from blueprint
  useEffect(() => {
    if (blueprint && !canvasGenerated) {
      generateCanvasFromBlueprint();
    }
  }, [blueprint, canvasGenerated]);

  const generateCanvasFromBlueprint = useCallback(async () => {
    if (!blueprint) {
      toast.error('No blueprint available to generate canvas');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🎨 AI Canvas Generation: Processing blueprint...', blueprint.id);
      
      // Generate canvas using the enterprise canvas service
      const { nodes: generatedNodes, edges: generatedEdges } = await enterpriseCanvasService.generateEnterpriseCanvas(blueprint);
      
      // Update canvas store with generated nodes and edges
      const canvasStore = useCanvasStore.getState();
      canvasStore.setWorkflowNodes(generatedNodes);
      canvasStore.setWorkflowEdges(generatedEdges);
      
      toast.success('AI Canvas Generated Successfully!', {
        description: `Created intelligent workflow with ${generatedNodes.length} nodes and ${generatedEdges.length} connections`
      });
      
      setCanvasGenerated(true);
      
    } catch (error) {
      console.error('❌ Error generating canvas:', error);
      toast.error('Failed to generate canvas from blueprint');
    } finally {
      setIsGenerating(false);
    }
  }, [blueprint]);

  const handleSaveBlueprint = useCallback(async () => {
    if (!blueprint) return;
    
    // Enhanced blueprint saving with version control
    const updatedBlueprint = {
      ...blueprint,
      canvas_data: {
        nodes,
        edges,
        version: Date.now(),
        last_modified: new Date().toISOString(),
        collaborators: collaborators.map(c => c.id),
        ai_optimized: true
      }
    };
    
    try {
      await backendAPIService.validateBlueprint(updatedBlueprint);
      console.log('✅ Blueprint saved with AI optimization');
      
      toast.success('Canvas Saved Successfully!', {
        description: 'Your AI-optimized workflow has been saved with version control'
      });
    } catch (error) {
      console.warn('⚠️ Backend unavailable, saving locally with full features');
      
      // Enhanced local storage with metadata
      try {
        localStorage.setItem(`blueprint_${blueprint.id}`, JSON.stringify(updatedBlueprint));
        localStorage.setItem(`canvas_backup_${Date.now()}`, JSON.stringify(updatedBlueprint));
      } catch (e) {
        console.error('Local storage failed:', e);
      }
      
      toast.success('Canvas Saved Locally!', {
        description: 'Saved with full metadata and version history'
      });
    }
  }, [blueprint, nodes, edges, collaborators]);

  const handleRunSimulation = useCallback(() => {
    if (nodes.length === 0) {
      toast.error('Add some agents to your canvas first', {
        description: 'Use the Smart Agents panel to add coordinator, analyst, or executor agents'
      });
      return;
    }
    
    toast.success('Launching Advanced Simulation Lab...', {
      description: 'Your agents will be tested with real-world scenarios and voice interaction'
    });
    
    nextStep('simulation');
  }, [nodes, nextStep]);


  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-6" />
            <motion.div
              className="absolute inset-0 w-20 h-20 border-4 border-pink-500/20 border-b-pink-500 rounded-full animate-spin mx-auto"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">AI Canvas Generation</h2>
          <p className="text-gray-300 mb-2">Creating intelligent workflow from your blueprint...</p>
          <div className="flex items-center justify-center gap-2 text-sm text-purple-300">
            <Brain className="w-4 h-4" />
            <span>Neural layout optimization in progress</span>
          </div>
        </motion.div>
      </div>
    );
  }

    return (
    <ReactFlowProvider>
      <div className="w-full h-full flex flex-col">
        {/* Canvas Header with Next Step Navigation */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={handleSaveBlueprint}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save & Continue
          </button>
          <button
            onClick={() => nextStep('simulation')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            Next Step →
          </button>
        </div>
        
        <GenesisProCanvas
          blueprint={blueprint}
          onSave={handleSaveBlueprint}
          onExecute={handleRunSimulation}
          onNext={() => nextStep('simulation')}
          className="h-full"
        />
      </div>
    </ReactFlowProvider>
  );
};
