import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square,
  Settings
} from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface VoiceInterfaceProps {
  onTranscriptUpdate?: (transcript: string) => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onTranscriptUpdate
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [testText, setTestText] = useState('Hello, this is a test of the voice synthesis system.');
  
  const {
    voices,
    selectedVoice,
    isPlaying,
    isLoading,
    error,
    loadVoices,
    selectVoice,
    speak,
    stop
  } = useVoice();

  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  const handleStartListening = async () => {
    setIsListening(true);
    // Basic speech recognition would go here
    // For now, we'll simulate it
    setTimeout(() => {
      const mockTranscript = "This is a simulated voice input.";
      setTranscript(mockTranscript);
      onTranscriptUpdate?.(mockTranscript);
      setIsListening(false);
    }, 3000);
  };

  const handleStopListening = () => {
    setIsListening(false);
  };

  const handleSpeak = async () => {
    if (testText.trim()) {
      try {
        await speak(testText);
      } catch (error) {
        console.error('Speech synthesis failed:', error);
      }
    }
  };

  const handleStop = () => {
    stop();
    setIsListening(false);
  };

  return (
    <GlassCard variant="medium" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Voice Interface</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm text-gray-300">
            {isListening ? 'Listening...' : 'Ready'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Voice Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">
          Select Voice
        </label>
        <select
          value={selectedVoice?.voice_id || ''}
          onChange={(e) => {
            const voice = voices.find(v => v.voice_id === e.target.value);
            if (voice) selectVoice(voice);
          }}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          disabled={isLoading}
        >
          <option value="">Select a voice...</option>
          {voices.map((voice) => (
            <option key={voice.voice_id} value={voice.voice_id}>
              {voice.name} ({voice.category})
            </option>
          ))}
        </select>
      </div>

      {/* Test Text Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2">
          Test Text
        </label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white resize-none"
          rows={3}
          placeholder="Enter text to synthesize..."
        />
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Voice Input Transcript
          </label>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-gray-300">{transcript}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HolographicButton
            variant={isListening ? "secondary" : "primary"}
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={isLoading}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Listening
              </>
            )}
          </HolographicButton>

          <HolographicButton
            variant="secondary"
            onClick={handleSpeak}
            disabled={isLoading || !selectedVoice || !testText.trim()}
          >
            {isPlaying ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Playing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Speak Text
              </>
            )}
          </HolographicButton>
        </div>

        <div className="flex items-center space-x-2">
          {(isPlaying || isListening) && (
            <HolographicButton
              variant="secondary"
              onClick={handleStop}
              size="sm"
            >
              <Square className="w-4 h-4" />
            </HolographicButton>
          )}
          
          <HolographicButton
            variant="secondary"
            size="sm"
          >
            <Settings className="w-4 h-4" />
          </HolographicButton>
        </div>
      </div>
    </GlassCard>
  );
};