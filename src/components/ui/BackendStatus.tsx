import React, { useEffect, useState } from 'react';
import { Badge } from './badge';
import { AlertCircle, CheckCircle, WifiOff } from 'lucide-react';
import { backendAPIService } from '../../services/backendAPIService';

interface BackendStatusProps {
  className?: string;
}

interface ServiceStatus {
  orchestrator: boolean;
  agentService: boolean;
  lastCheck: string;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ 
  className = '' 
}) => {
  const [status, setStatus] = useState<ServiceStatus>({
    orchestrator: false,
    agentService: false,
    lastCheck: ''
  });

  const checkServices = async () => {
    try {
      const [orchestratorHealth, agentHealth] = await Promise.all([
        backendAPIService.checkOrchestratorHealth(),
        backendAPIService.checkAgentServiceHealth()
      ]);

      setStatus({
        orchestrator: orchestratorHealth,
        agentService: agentHealth,
        lastCheck: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus(prev => ({
        ...prev,
        orchestrator: false,
        agentService: false,
        lastCheck: new Date().toLocaleTimeString()
      }));
    }
  };

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const isAllHealthy = status.orchestrator && status.agentService;
  const isPartiallyHealthy = status.orchestrator || status.agentService;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isAllHealthy ? (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Backend Online
        </Badge>
      ) : isPartiallyHealthy ? (
        <Badge variant="secondary" className="bg-yellow-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Partial Service
        </Badge>
      ) : (
        <Badge variant="destructive">
          <WifiOff className="w-3 h-3 mr-1" />
          Backend Offline
        </Badge>
      )}
    </div>
  );
};