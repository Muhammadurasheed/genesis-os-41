import { useState, useEffect, useCallback } from 'react';

interface BackendStatus {
  fastApiStatus: 'connected' | 'disconnected' | 'error';
  expressStatus: 'connected' | 'disconnected' | 'error';
  executionMetrics: {
    activeWorkflows: number;
    totalExecutions: number;
    avgResponseTime: number;
    errorRate: number;
    systemLoad: number;
  };
  lastSync: Date | null;
}

interface ExecutionEvent {
  workflowId: string;
  nodeId: string;
  status: 'started' | 'completed' | 'error';
  timestamp: Date;
  data?: any;
}

export const useBackendSync = () => {
  const [status, setStatus] = useState<BackendStatus>({
    fastApiStatus: 'disconnected',
    expressStatus: 'disconnected',
    executionMetrics: {
      activeWorkflows: 0,
      totalExecutions: 0,
      avgResponseTime: 0,
      errorRate: 0,
      systemLoad: 0
    },
    lastSync: null
  });

  const [executionEvents, setExecutionEvents] = useState<ExecutionEvent[]>([]);
  const [wsConnections, setWsConnections] = useState<{
    fastApi?: WebSocket;
    express?: WebSocket;
  }>({});

  // Initialize WebSocket connections
  useEffect(() => {
    initializeConnections();
    return () => {
      // Cleanup connections
      Object.values(wsConnections).forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    };
  }, []);

  const initializeConnections = useCallback(async () => {
    try {
      // Connect to FastAPI WebSocket
      const fastApiWs = new WebSocket('ws://localhost:8000/ws/canvas');
      
      fastApiWs.onopen = () => {
        console.log('🔗 Connected to FastAPI backend');
        setStatus(prev => ({ 
          ...prev, 
          fastApiStatus: 'connected',
          lastSync: new Date()
        }));
      };

      fastApiWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleFastApiMessage(data);
        } catch (error) {
          console.error('❌ Error parsing FastAPI message:', error);
        }
      };

      fastApiWs.onerror = () => {
        setStatus(prev => ({ ...prev, fastApiStatus: 'error' }));
      };

      fastApiWs.onclose = () => {
        setStatus(prev => ({ ...prev, fastApiStatus: 'disconnected' }));
        // Attempt reconnection
        setTimeout(initializeConnections, 5000);
      };

      // Connect to Express WebSocket
      const expressWs = new WebSocket('ws://localhost:3002/ws/orchestrator');
      
      expressWs.onopen = () => {
        console.log('🔗 Connected to Express orchestrator');
        setStatus(prev => ({ 
          ...prev, 
          expressStatus: 'connected',
          lastSync: new Date()
        }));
      };

      expressWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleExpressMessage(data);
        } catch (error) {
          console.error('❌ Error parsing Express message:', error);
        }
      };

      expressWs.onerror = () => {
        setStatus(prev => ({ ...prev, expressStatus: 'error' }));
      };

      expressWs.onclose = () => {
        setStatus(prev => ({ ...prev, expressStatus: 'disconnected' }));
        // Attempt reconnection
        setTimeout(initializeConnections, 5000);
      };

      setWsConnections({ fastApi: fastApiWs, express: expressWs });

    } catch (error) {
      console.error('❌ Error initializing backend connections:', error);
      // Fallback to HTTP polling
      initializeHttpPolling();
    }
  }, []);

  const handleFastApiMessage = (data: any) => {
    switch (data.type) {
      case 'execution_update':
        setExecutionEvents(prev => [...prev.slice(-99), {
          workflowId: data.workflowId,
          nodeId: data.nodeId,
          status: data.status,
          timestamp: new Date(data.timestamp),
          data: data.payload
        }]);
        break;

      case 'metrics_update':
        setStatus(prev => ({
          ...prev,
          executionMetrics: {
            ...prev.executionMetrics,
            ...data.metrics
          },
          lastSync: new Date()
        }));
        break;

      case 'agent_status':
        // Handle agent status updates
        console.log('🤖 Agent status update:', data);
        break;

      default:
        console.log('📨 FastAPI message:', data);
    }
  };

  const handleExpressMessage = (data: any) => {
    switch (data.type) {
      case 'workflow_execution':
        setExecutionEvents(prev => [...prev.slice(-99), {
          workflowId: data.workflowId,
          nodeId: data.nodeId,
          status: data.status,
          timestamp: new Date(data.timestamp),
          data: data.payload
        }]);
        break;

      case 'system_metrics':
        setStatus(prev => ({
          ...prev,
          executionMetrics: {
            ...prev.executionMetrics,
            systemLoad: data.cpuUsage,
            activeWorkflows: data.activeWorkflows
          },
          lastSync: new Date()
        }));
        break;

      case 'orchestrator_status':
        console.log('🎼 Orchestrator status:', data);
        break;

      default:
        console.log('📨 Express message:', data);
    }
  };

  const initializeHttpPolling = () => {
    const pollBackends = async () => {
      try {
        // Poll FastAPI
        const fastApiResponse = await fetch('http://localhost:8000/health');
        setStatus(prev => ({
          ...prev,
          fastApiStatus: fastApiResponse.ok ? 'connected' : 'error'
        }));

        // Poll Express
        const expressResponse = await fetch('http://localhost:3002/health');
        setStatus(prev => ({
          ...prev,
          expressStatus: expressResponse.ok ? 'connected' : 'error',
          lastSync: new Date()
        }));

        // Get metrics
        const metricsResponse = await fetch('http://localhost:3002/api/metrics');
        if (metricsResponse.ok) {
          const metrics = await metricsResponse.json();
          setStatus(prev => ({
            ...prev,
            executionMetrics: {
              ...prev.executionMetrics,
              ...metrics
            }
          }));
        }

      } catch (error) {
        console.error('❌ HTTP polling error:', error);
        setStatus(prev => ({
          ...prev,
          fastApiStatus: 'error',
          expressStatus: 'error'
        }));
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollBackends, 5000);
    pollBackends(); // Initial poll

    return () => clearInterval(interval);
  };

  const sendMessage = useCallback((backend: 'fastApi' | 'express', message: any) => {
    const ws = wsConnections[backend];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`⚠️ ${backend} WebSocket not connected`);
    }
  }, [wsConnections]);

  const executeWorkflow = useCallback(async (workflowId: string, nodes: any[], edges: any[]) => {
    try {
      const payload = {
        type: 'execute_workflow',
        workflowId,
        nodes,
        edges,
        timestamp: new Date().toISOString()
      };

      // Send to both backends
      sendMessage('fastApi', payload);
      sendMessage('express', payload);

      // Also send HTTP request as fallback
      const response = await fetch('http://localhost:3002/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error executing workflow:', error);
      throw error;
    }
  }, [sendMessage]);

  const pauseWorkflow = useCallback((workflowId: string) => {
    sendMessage('express', {
      type: 'pause_workflow',
      workflowId,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  const resumeWorkflow = useCallback((workflowId: string) => {
    sendMessage('express', {
      type: 'resume_workflow',
      workflowId,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  const stopWorkflow = useCallback((workflowId: string) => {
    sendMessage('express', {
      type: 'stop_workflow',
      workflowId,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  return {
    ...status,
    executionEvents,
    executeWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    stopWorkflow,
    sendMessage,
    isConnected: status.fastApiStatus === 'connected' && status.expressStatus === 'connected'
  };
};