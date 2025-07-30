import React from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';
import { HolographicButton } from '../../ui/HolographicButton';

interface WorkflowNarratorProps {
  workflow: {
    nodes: any[];
    edges: any[];
  };
  onClose: () => void;
}

export const WorkflowNarrator: React.FC<WorkflowNarratorProps> = ({ workflow, onClose }) => {
  const generateExplanation = () => {
    const nodeCount = workflow.nodes.length;
    const edgeCount = workflow.edges.length;
    
    return {
      overview: `This workflow contains ${nodeCount} nodes connected by ${edgeCount} data flows, creating an intelligent automation pipeline.`,
      steps: [
        "Workflow begins when the trigger conditions are met",
        "Data flows through AI agents for processing and analysis", 
        "Integration nodes connect to external services",
        "Logic nodes make decisions based on conditions",
        "Final results are delivered to specified destinations"
      ]
    };
  };

  const explanation = generateExplanation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/80 backdrop-blur-lg rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Workflow Explanation</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Overview</h3>
            <p className="text-white/70">{explanation.overview}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-3">Step-by-Step Process</h3>
            <div className="space-y-3">
              {explanation.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-white/70 flex-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <HolographicButton onClick={onClose}>
            Close
          </HolographicButton>
        </div>
      </motion.div>
    </motion.div>
  );
};