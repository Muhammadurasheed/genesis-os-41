import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  X, 
  MessageSquare, 
  Lightbulb, 
  TrendingUp, 
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Mic,
  Send
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { HolographicButton } from './HolographicButton';
import { Input } from './input';
import { ScrollArea } from './scroll-area';

interface AIAssistantProps {
  workflow: {
    nodes: any[];
    edges: any[];
  };
  onSuggestion: (suggestion: any) => void;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  onSuggestion,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'suggestions'>('chat');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock AI insights and suggestions
  const insights = [
    {
      type: 'performance',
      icon: <TrendingUp className="w-4 h-4 text-green-400" />,
      title: 'Optimal Performance',
      description: 'Your workflow is running efficiently with 96% success rate',
      details: 'Average execution time: 2.3s, Error rate: 0.4%'
    },
    {
      type: 'optimization',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      title: 'Optimization Opportunity',
      description: 'Consider parallel execution for nodes 3-5',
      details: 'Could reduce execution time by 35%'
    },
    {
      type: 'security',
      icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
      title: 'Security Alert',
      description: 'Add rate limiting to your webhook trigger',
      details: 'Protects against DDoS attacks'
    }
  ];

  const suggestions = [
    {
      id: 'parallel-execution',
      icon: <Zap className="w-4 h-4 text-blue-400" />,
      title: 'Enable Parallel Processing',
      description: 'Run compatible nodes simultaneously to improve performance',
      impact: 'High',
      effort: 'Medium',
      savings: '35% faster execution'
    },
    {
      id: 'error-handling',
      icon: <Target className="w-4 h-4 text-purple-400" />,
      title: 'Add Error Recovery',
      description: 'Implement retry logic and fallback mechanisms',
      impact: 'High',
      effort: 'Low',
      savings: '99.9% reliability'
    },
    {
      id: 'monitoring',
      icon: <CheckCircle className="w-4 h-4 text-green-400" />,
      title: 'Enhanced Monitoring',
      description: 'Add detailed logging and performance tracking',
      impact: 'Medium',
      effort: 'Low',
      savings: 'Better insights'
    }
  ];

  const [chatMessages] = useState([
    {
      type: 'ai',
      content: 'Hello! I\'m your AI workflow assistant. I\'ve analyzed your current workflow and found some interesting patterns. How can I help you optimize it?',
      timestamp: '2 minutes ago'
    },
    {
      type: 'user',
      content: 'Can you explain how the data flows through my workflow?',
      timestamp: '1 minute ago'
    },
    {
      type: 'ai',
      content: 'Absolutely! Your workflow follows a linear pattern: Webhook Trigger → Lead Qualification Agent → CRM Integration → Email Notification. The data transformation happens at each step, with validation and enrichment occurring in the AI agent.',
      timestamp: '30 seconds ago'
    }
  ]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      setMessage('');
    }, 2000);
  };

  const applySuggestion = (suggestion: any) => {
    onSuggestion(suggestion);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] mx-4"
      >
        <GlassCard variant="intense" className="p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Workflow Assistant</h2>
                <p className="text-white/60 text-sm">Powered by Genesis AI Engine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'chat', label: 'AI Chat', icon: MessageSquare },
              { id: 'insights', label: 'Insights', icon: Lightbulb },
              { id: 'suggestions', label: 'Suggestions', icon: Sparkles }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="h-96">
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-60 mt-1">{msg.timestamp}</p>
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="text-white/60 text-sm ml-2">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t border-white/10 p-4">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask about your workflow..."
                      className="flex-1 bg-white/5 border-white/20 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={isProcessing}
                    />
                    <HolographicButton
                      variant="outline"
                      size="sm"
                      className="p-2"
                      title="Voice Input"
                    >
                      <Mic className="w-4 h-4" />
                    </HolographicButton>
                    <HolographicButton
                      variant="primary"
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={isProcessing}
                      className="p-2"
                    >
                      <Send className="w-4 h-4" />
                    </HolographicButton>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <ScrollArea className="h-full p-6">
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{insight.icon}</div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm mb-1">{insight.title}</h4>
                          <p className="text-white/70 text-sm mb-2">{insight.description}</p>
                          <p className="text-white/50 text-xs">{insight.details}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {activeTab === 'suggestions' && (
              <ScrollArea className="h-full p-6">
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">{suggestion.icon}</div>
                          <div>
                            <h4 className="text-white font-medium text-sm mb-1">{suggestion.title}</h4>
                            <p className="text-white/70 text-sm mb-3">{suggestion.description}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-green-400">Impact: {suggestion.impact}</span>
                              <span className="text-blue-400">Effort: {suggestion.effort}</span>
                              <span className="text-purple-400">{suggestion.savings}</span>
                            </div>
                          </div>
                        </div>
                        <HolographicButton
                          variant="outline"
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="flex items-center gap-1 whitespace-nowrap"
                        >
                          Apply
                          <ArrowRight className="w-3 h-3" />
                        </HolographicButton>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};