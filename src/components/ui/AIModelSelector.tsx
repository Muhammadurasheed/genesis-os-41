
import React, { useState } from 'react';
import { ChevronDown, Brain, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
}

interface AIModelSelectorProps {
  selectedModel?: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const models: AIModel[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      description: 'Most capable model for complex tasks',
      capabilities: ['reasoning', 'code', 'analysis']
    },
    {
      id: 'claude-3',
      name: 'Claude 3',
      provider: 'Anthropic',
      description: 'Excellent for analysis and creative tasks',
      capabilities: ['analysis', 'writing', 'reasoning']
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      description: 'Fast and efficient for most tasks',
      capabilities: ['speed', 'multimodal', 'code']
    }
  ];

  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white flex items-center justify-between hover:bg-white/20 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span>{currentModel.name}</span>
        </div>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-white/20 rounded-lg p-2 z-50">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
              className="w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-white">{model.name}</span>
                <span className="text-xs text-white/60">{model.provider}</span>
              </div>
              <p className="text-sm text-white/80 mb-2">{model.description}</p>
              <div className="flex space-x-2">
                {model.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-xs px-2 py-1 bg-white/10 rounded text-white/70"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
