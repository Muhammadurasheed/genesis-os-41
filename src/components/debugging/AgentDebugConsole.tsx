
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bug, 
  Info,
  Terminal,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
}

export const AgentDebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    // Mock log entries (replace with your actual log source)
    const mockLogs: LogEntry[] = [
      { id: '1', timestamp: '10:00:05', level: 'info', message: 'Agent started' },
      { id: '2', timestamp: '10:00:10', level: 'debug', message: 'Received input: "Hello"' },
      { id: '3', timestamp: '10:00:15', level: 'warning', message: 'Rate limit exceeded' },
      { id: '4', timestamp: '10:00:20', level: 'error', message: 'Failed to connect to API' },
      { id: '5', timestamp: '10:00:25', level: 'info', message: 'Generated response: "Hi there!"' },
    ];
    setLogs(mockLogs);

    // Simulate new logs being added every few seconds
    const intervalId = setInterval(() => {
      const levels: ('info' | 'warning' | 'error' | 'debug')[] = ['info', 'warning', 'error', 'debug'];
      const newLog: LogEntry = {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString(),
        level: levels[Math.floor(Math.random() * 4)],
        message: `Simulated log entry ${Date.now()}`
      };
      setLogs(prevLogs => [...prevLogs, newLog]);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  return (
    <GlassCard variant="medium" className="w-full h-[400px] p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Agent Debug Console</h3>
        <div className="flex items-center space-x-2">
          <HolographicButton onClick={clearLogs} variant="secondary" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </HolographicButton>
          <HolographicButton onClick={toggleMute} variant="secondary" size="sm">
            {muted ? (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                Unmute
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Mute
              </>
            )}
          </HolographicButton>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-80px)]">
        {logs.map((log) => (
          <div key={log.id} className="mb-2 p-3 rounded-lg bg-white/5 last:mb-0">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <span className="mr-2">{log.timestamp}</span>
              {log.level === 'info' && <><Info className="w-3 h-3 mr-1 text-blue-300" /> Info</>}
              {log.level === 'warning' && <><AlertTriangle className="w-3 h-3 mr-1 text-yellow-300" /> Warning</>}
              {log.level === 'error' && <><Bug className="w-3 h-3 mr-1 text-red-300" /> Error</>}
              {log.level === 'debug' && <><Terminal className="w-3 h-3 mr-1 text-gray-300" /> Debug</>}
            </div>
            <p className="text-sm text-white">{log.message}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
