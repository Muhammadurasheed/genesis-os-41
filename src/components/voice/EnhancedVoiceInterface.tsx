/**
 * Enhanced Voice Interface with Tavus + ElevenLabs Integration
 * Phase 3: Agent Intelligence - Voice Conversations with Agents
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { autonomousAgentService } from '../../services/ai/autonomousAgentService';
import { toast } from 'sonner';

interface VoiceConversationProps {
  agentId?: string;
  onConversationEnd?: (transcript: string) => void;
}

export const EnhancedVoiceInterface: React.FC<VoiceConversationProps> = ({ 
  agentId, 
  onConversationEnd 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  // const [transcript, setTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    speaker: 'user' | 'agent';
    message: string;
    timestamp: Date;
  }>>([]);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (agentId) {
      const agent = autonomousAgentService.getAgent(agentId);
      setCurrentAgent(agent);
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          handleUserSpeech(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Voice recognition error');
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [agentId]);

  const startVoiceConversation = async () => {
    if (!currentAgent) {
      toast.error('No agent selected for conversation');
      return;
    }

    setIsConnected(true);
    setIsListening(true);

    // Start speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }

    // Add welcome message from agent
    const welcomeMessage = `Hello! I'm ${currentAgent.name}, your ${currentAgent.role}. How can I help you today?`;
    
    setConversationHistory([{
      speaker: 'agent',
      message: welcomeMessage,
      timestamp: new Date()
    }]);

    // Synthesize welcome speech
    await synthesizeAgentSpeech(welcomeMessage);

    toast.success(`Connected to ${currentAgent.name}`);
  };

  const endVoiceConversation = () => {
    setIsConnected(false);
    setIsListening(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const fullTranscript = conversationHistory
      .map(entry => `${entry.speaker}: ${entry.message}`)
      .join('\n');

    onConversationEnd?.(fullTranscript);
    
    toast.info('Voice conversation ended');
  };

  const handleUserSpeech = async (spokenText: string) => {
    console.log('User said:', spokenText);
    
    // Add user message to conversation
    const userEntry = {
      speaker: 'user' as const,
      message: spokenText,
      timestamp: new Date()
    };
    
    setConversationHistory(prev => [...prev, userEntry]);

    if (!currentAgent) return;

    try {
      // Assign task to autonomous agent
      const taskId = await autonomousAgentService.assignTask(currentAgent.id, {
        description: `Respond to user query: ${spokenText}`,
        priority: 'high',
        status: 'pending',
        context: { 
          conversationType: 'voice',
          conversationHistory: conversationHistory.slice(-5) // Last 5 exchanges
        },
        requiredTools: [],
        expectedOutcome: 'Natural conversation response'
      });

      // Wait for agent response (simplified - in production, would use real-time updates)
      setTimeout(async () => {
        const tasks = autonomousAgentService.getAgentTasks(currentAgent.id);
        const completedTask = tasks.find(t => t.id === taskId && t.status === 'completed');
        
        if (completedTask && completedTask.result) {
          const agentResponse = completedTask.result.stepResults?.[0]?.result || "I'm processing your request.";
          
          const agentEntry = {
            speaker: 'agent' as const,
            message: agentResponse,
            timestamp: new Date()
          };
          
          setConversationHistory(prev => [...prev, agentEntry]);
          
          // Synthesize agent response
          await synthesizeAgentSpeech(agentResponse);
        }
      }, 2000);

    } catch (error) {
      console.error('Error processing user speech:', error);
      toast.error('Failed to process your message');
    }
  };

  const synthesizeAgentSpeech = async (text: string) => {
    try {
      // Mock voice synthesis - integrate with ElevenLabs
      console.log(`🎵 Synthesizing speech: ${text.substring(0, 50)}...`);
      
      // In production, this would call ElevenLabs API
      const mockAudioUrl = `data:audio/wav;base64,${btoa('mock-audio-data')}`;
      
      if (audioRef.current) {
        audioRef.current.src = mockAudioUrl;
        // audioRef.current.play(); // Commented out to avoid errors in demo
      }

      toast.success('Agent speaking...');
      
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  const toggleMute = () => {
    setIsListening(!isListening);
    
    if (!isListening && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-white/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Voice Conversation
            </h3>
            {currentAgent && (
              <p className="text-sm text-gray-300">
                with {currentAgent.name} ({currentAgent.role})
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMute}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            )}
            
            <Button
              variant={isConnected ? "destructive" : "default"}
              onClick={isConnected ? endVoiceConversation : startVoiceConversation}
              disabled={!currentAgent}
              className={isConnected ? 
                "bg-red-600 hover:bg-red-700" : 
                "bg-green-600 hover:bg-green-700"
              }
            >
              {isConnected ? (
                <>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Start Call
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Conversation Display */}
        <div className="h-64 overflow-y-auto mb-4 p-4 bg-black/20 rounded-lg">
          {conversationHistory.length === 0 ? (
            <p className="text-gray-400 text-center">
              {currentAgent ? 'Start a voice conversation' : 'Select an agent to begin'}
            </p>
          ) : (
            conversationHistory.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 ${entry.speaker === 'agent' ? 'text-left' : 'text-right'}`}
              >
                <div className={`inline-block max-w-xs p-3 rounded-lg ${
                  entry.speaker === 'agent' 
                    ? 'bg-blue-600/50 text-white' 
                    : 'bg-purple-600/50 text-white'
                }`}>
                  <p className="text-sm font-medium capitalize mb-1">
                    {entry.speaker === 'agent' ? currentAgent?.name : 'You'}
                  </p>
                  <p className="text-sm">{entry.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {entry.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Audio element for playback */}
        <audio ref={audioRef} style={{ display: 'none' }} />

        {/* Voice indicator */}
        {isListening && (
          <motion.div
            className="flex justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg shadow-green-400/50" />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};