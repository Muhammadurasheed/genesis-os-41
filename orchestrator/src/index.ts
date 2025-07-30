import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import blueprintService from './services/blueprintService';
import agentService from './services/agentService';
import workflowService from './services/workflowService';
import memoryService from './services/memoryService';
import simulationService from './services/simulationService';
import deploymentService from './services/deploymentService';
import analyticsService from './services/analyticsService';
import voiceService from './services/voiceService';
import videoService from './services/videoService';
import communicationService from './services/communicationService';
import canvasOrchestrationService from './services/canvasOrchestrationService';
import workflowOrchestrationService from './services/workflowOrchestrationService';
import simulationOrchestrationService from './services/simulationOrchestrationService';
import intentUnderstandingEngine from './services/intentUnderstandingEngine';
import clarificationEngine from './services/clarificationEngine';
import KnowledgeOrchestrationService from './services/knowledgeOrchestrationService';
import AdvancedMemoryService from './services/advancedMemoryService';
import revolutionaryCanvasService from './services/revolutionaryCanvasService';

// Initialize Phase 2.2 Knowledge & Memory Services
const knowledgeOrchestrationService = new KnowledgeOrchestrationService();
const advancedMemoryService = new AdvancedMemoryService();

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

// Set up Knowledge & Memory System Event Monitoring
knowledgeOrchestrationService.on('indexCreated', (data) => {
  console.log(`📚 Knowledge Index Created: ${data.indexId} (${data.name}, type: ${data.type})`);
});

knowledgeOrchestrationService.on('indexingStarted', (data) => {
  console.log(`🔄 Knowledge Indexing Started: ${data.indexId}`);
});

knowledgeOrchestrationService.on('indexingCompleted', (data) => {
  console.log(`✅ Knowledge Indexing Completed: ${data.indexId} (${data.chunksCount} chunks)`);
});

knowledgeOrchestrationService.on('indexingError', (data) => {
  console.error(`❌ Knowledge Indexing Error: ${data.indexId} - ${data.error}`);
});

knowledgeOrchestrationService.on('taskCompleted', (data) => {
  console.log(`✅ Knowledge Task Completed: ${data.id}`);
});

knowledgeOrchestrationService.on('taskFailed', (data) => {
  console.error(`❌ Knowledge Task Failed: ${data.id} - ${data.error}`);
});

knowledgeOrchestrationService.on('memoryUpdated', (data) => {
  console.log(`🧠 Memory Context Updated: Agent ${data.agentId}, Type: ${data.type}, Added: ${data.chunksAdded}`);
});

knowledgeOrchestrationService.on('indexDeleted', (data) => {
  console.log(`🗑️ Knowledge Index Deleted: ${data.indexId}`);
});

knowledgeOrchestrationService.on('memoryCleared', (data) => {
  console.log(`🧹 Memory Context Cleared: Agent ${data.agentId}`);
});

// Advanced Memory Service Event Monitoring
advancedMemoryService.on('memoryStored', (data) => {
  console.log(`💾 Memory Stored: ${data.memoryId} (${data.type}, importance: ${data.importance})`);
});

advancedMemoryService.on('memoryRetrieved', (data) => {
  console.log(`🔍 Memory Retrieved: ${data.resultsCount} memories for agent ${data.agentId || 'unknown'} (type: ${data.queryType || 'any'})`);
});

advancedMemoryService.on('memoryUpdated', (data) => {
  console.log(`📝 Memory Updated: ${data.memoryId} (fields: ${data.updates.join(', ')})`);
});

advancedMemoryService.on('memoryDeleted', (data) => {
  console.log(`🗑️ Memory Deleted: ${data.memoryId} (type: ${data.type})`);
});

advancedMemoryService.on('consolidationRuleApplied', (data) => {
  console.log(`🔧 Memory Consolidation Rule Applied: ${data.ruleId} (${data.memoriesProcessed} memories processed)`);
});

advancedMemoryService.on('consolidationCompleted', (data) => {
  console.log(`✅ Memory Consolidation Completed: ${data.originalCount} → ${data.finalCount} memories (${data.duration}ms)`);
});

advancedMemoryService.on('agentMemoryCleared', (data) => {
  console.log(`🧹 Agent Memory Cleared: ${data.agentId} (${data.deletedCount} memories deleted)`);
});

// Define node structure interface
interface NodeData {
  label: string;
  [key: string]: any;
}

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
console.log(`🚀 GenesisOS Orchestrator starting up at port ${PORT}`);
console.log(`🤖 Agent Service URL: ${AGENT_SERVICE_URL}`);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
let supabase: SupabaseClient | undefined;

// Initialize Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: RedisClientType | undefined;

// Setup middleware
app.use(cors());
app.use(helmet()); // Adds security headers
app.use(express.json());
app.use(morgan('dev'));

// Apply rate limiting to API routes in production
if (NODE_ENV === 'production') {
  app.use('/api/', apiLimiter);
}

// Initialize clients
async function initializeClients() {
  // Initialize Supabase if URL and key are provided
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_supabase') && !supabaseKey.includes('your_supabase')) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.warn('⚠️ Supabase credentials not configured - using mock data');
  }

  // Initialize Redis if URL is provided
  if (redisUrl && !redisUrl.includes('your_redis') && !redisUrl.includes('localhost')) {
    try {
      redisClient = createRedisClient({ url: redisUrl });
      await redisClient.connect();
      console.log('✅ Redis client connected');
    } catch (error) {
      console.warn('⚠️ Redis connection failed - using in-memory cache instead');
      console.warn('⚠️ Using in-memory cache instead');
    }
  } else {
    console.log('ℹ️ Redis not configured for development - using in-memory cache');
  }
}

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "GenesisOS Orchestrator is running",
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  const gemini_key = process.env.GEMINI_API_KEY;
  const elevenlabs_key = process.env.ELEVENLABS_API_KEY;
  const pinecone_key = process.env.PINECONE_API_KEY;
  const redis_url = process.env.REDIS_URL;
  
  const gemini_configured = Boolean(gemini_key && !gemini_key.startsWith('your_'));
  const elevenlabs_configured = Boolean(elevenlabs_key && !elevenlabs_key.startsWith('your_'));
  const pinecone_configured = Boolean(pinecone_key && !pinecone_key.startsWith('your_'));
  const redis_configured = Boolean(redis_url && !redis_url.startsWith('your_'));

  res.status(200).json({
    status: "healthy",
    message: "GenesisOS Orchestrator is running",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    integrations: {
      gemini: gemini_configured ? "configured" : "not configured",
      elevenlabs: elevenlabs_configured ? "configured" : "not configured",
      pinecone: pinecone_configured ? "configured" : "not configured",
      redis: redis_configured ? "configured" : "not configured"
    },
    features: {
      memory: true,
      voice: elevenlabs_configured,
      blueprint_generation: gemini_configured,
      knowledge_orchestration: true,
      advanced_memory: true,
      intent_understanding: true,
      clarification_engine: true
    },
    phase_completion: {
      "Phase 1 - Architectural Fix": "100%",
      "Phase 2.1 - Intent Understanding": "85%", 
      "Phase 2.2 - Knowledge & Memory": "100%",
      "Overall Platform": "62%"
    }
  });
});

// API status endpoint
app.get('/status', async (req, res) => {
  try {
    // Check connection to agent service
    let agentServiceStatus = "unavailable";
    let agentServiceMessage = "Could not connect to agent service";
    
    try {
      const response = await axios.get(`${AGENT_SERVICE_URL}/`);
      agentServiceStatus = response.data.status || "unknown";
      agentServiceMessage = response.data.message || "Connected";
    } catch (error) {
      console.error('❌ Agent service health check failed:', error);
    }
    
    // Return comprehensive status
    res.json({
      orchestrator: {
        status: "healthy",
        message: "GenesisOS Orchestrator is running",
        version: process.env.npm_package_version || "1.0.0",
        uptime: process.uptime(),
        components: {
          knowledge_orchestration: "active",
          advanced_memory: "active", 
          intent_understanding: "active",
          clarification_engine: "active",
          simulation_orchestration: "active"
        }
      },
      agent_service: {
        status: agentServiceStatus,
        message: agentServiceMessage,
        url: AGENT_SERVICE_URL
      },
      database: {
        status: supabase ? "connected" : "not configured",
        type: "supabase"
      },
      cache: {
        status: redisClient ? "connected" : "not configured",
        type: "redis"
      },
      knowledge_system: {
        status: "active",
        engine: "v8-level-performance",
        features: ["semantic_search", "intelligent_chunking", "memory_context"]
      },
      memory_system: {
        status: "active", 
        engine: "ebbinghaus-curve-based",
        features: ["associative_memory", "automatic_consolidation", "forgetting_curve"]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: `Failed to get service status: ${error.message}`
    });
  }
});

// Canvas generation endpoint - NOW PROPERLY IN ORCHESTRATOR
app.post('/generateCanvas', async (req, res) => {
  try {
    console.log('🎨 Canvas generation request received - NOW IN ORCHESTRATOR');
    const { blueprint, options } = req.body;
    
    // Validate blueprint
    if (!blueprint) {
      return res.status(400).json({ 
        error: 'Missing blueprint',
        message: 'Blueprint data is required'
      });
    }
    
    if (!blueprint.suggested_structure) {
      return res.status(400).json({ 
        error: 'Invalid blueprint structure',
        message: 'Blueprint must include suggested_structure'
      });
    }

    // Use canvas orchestration service (moved from FastAPI)
    const canvasData = canvasOrchestrationService.generateCanvasFromBlueprint(blueprint, options);
  
    return res.status(200).json({ 
      success: true,
      ...canvasData,
      message: 'Canvas generated successfully'
    });
  } catch (error: any) {
    console.error('❌ Error generating canvas:', error);
    return res.status(500).json({ 
      error: 'Failed to generate canvas',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Enterprise Canvas generation endpoint - ENHANCED IN ORCHESTRATOR
app.post('/generateEnterpriseCanvas', async (req, res) => {
  try {
    console.log('🏢 Enterprise Canvas generation request received - IN ORCHESTRATOR');
    const { blueprint, options } = req.body;
    
    // Validate blueprint
    if (!blueprint) {
      return res.status(400).json({ 
        error: 'Missing blueprint',
        message: 'Blueprint data is required'
      });
    }
    
    if (!blueprint.suggested_structure) {
      return res.status(400).json({ 
        error: 'Invalid blueprint structure',
        message: 'Blueprint must include suggested_structure'
      });
    }

    // Use canvas orchestration service for enterprise features
    const canvasData = canvasOrchestrationService.generateEnterpriseCanvas(blueprint, options);
  
    return res.status(200).json({ 
      success: true,
      ...canvasData,
      message: 'Enterprise canvas generated successfully'
    });
  } catch (error: any) {
    console.error('❌ Error generating enterprise canvas:', error);
    return res.status(500).json({ 
      error: 'Failed to generate enterprise canvas',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Enterprise Workflow execution endpoint - ENHANCED IN ORCHESTRATOR
app.post('/executeEnterpriseFlow', async (req, res) => {
  try {
    console.log('🏢 Enterprise workflow execution request received - IN ORCHESTRATOR');
    const { flowId, nodes, edges, context = {}, enableMonitoring, enableAnalytics }: {
      flowId?: string;
      nodes: WorkflowNode[];
      edges: any[];
      context?: any;
      enableMonitoring?: boolean;
      enableAnalytics?: boolean;
    } = req.body;
    
    // Validate input
    if (!nodes || !nodes.length) {
      throw new Error('Workflow nodes are required');
    }

    const executionId = flowId || `enterprise-flow-${uuidv4()}`;
    
    // Use workflow orchestration service for enterprise execution
    const result = await workflowOrchestrationService.executeEnterpriseWorkflow(
      executionId,
      nodes,
      edges,
      context,
      enableMonitoring || true,
      enableAnalytics || true
    );
    
    console.log(`✅ Enterprise execution started: ${result.executionId}`);
    
    // Return execution details with monitoring URL
    return res.status(202).json({ 
      executionId: result.executionId,
      monitoringUrl: `${req.protocol}://${req.get('host')}/execution/${result.executionId}/metrics`,
      message: 'Enterprise workflow execution started',
      status: 'running',
      tier: 'enterprise',
      features: {
        monitoring: enableMonitoring || true,
        analytics: enableAnalytics || true,
        realtime_updates: true,
        sla_tracking: true
      }
    });
  } catch (error: any) {
    console.error('❌ Error executing enterprise workflow:', error);
    return res.status(500).json({ 
      error: 'Failed to execute enterprise workflow',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Enterprise workflow metrics endpoint - ENHANCED IN ORCHESTRATOR
app.get('/execution/:executionId/metrics', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    if (!executionId) {
      return res.status(400).json({ error: 'Execution ID is required' });
    }

    // Get execution status from orchestration service
    const executionStatus = workflowOrchestrationService.getExecutionStatus(executionId);
    
    if (!executionStatus) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${executionId}`
      });
    }
    
    // Get enterprise metrics if available
    const enterpriseMetrics = workflowOrchestrationService.getEnterpriseMetrics(executionId);
    
    const response = enterpriseMetrics ? {
      ...executionStatus,
      ...enterpriseMetrics
    } : executionStatus;
    
    res.json(response);
  } catch (error: any) {
    console.error('❌ Error getting execution metrics:', error);
    res.status(500).json({
      error: 'Failed to get execution metrics',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Phase 2: Revolutionary Canvas API Endpoints

// AI-Powered Layout Optimization - Surpasses n8n/Figma
app.post('/api/canvas/optimize-layout', async (req, res) => {
  try {
    console.log('🧠 AI Layout Optimization request received - REVOLUTIONARY FEATURE');
    const { canvasId, nodes, edges, algorithm = 'force_directed' } = req.body;
    
    if (!canvasId || !nodes || !Array.isArray(nodes)) {
      return res.status(400).json({ 
        error: 'Missing required data',
        message: 'canvasId and nodes array are required'
      });
    }
    
    // Revolutionary AI-powered layout optimization
    const optimization = await revolutionaryCanvasService.optimizeLayoutWithAI(
      canvasId,
      nodes,
      edges || [],
      algorithm
    );
    
    console.log(`✅ AI Layout Optimization completed: ${optimization.metrics.crossings_reduced} crossings reduced`);
    
    return res.status(200).json({ 
      success: true,
      optimization,
      message: 'Revolutionary AI layout optimization completed',
      algorithm_used: algorithm
    });
  } catch (error: any) {
    console.error('❌ Error in AI Layout Optimization:', error);
    return res.status(500).json({ 
      error: 'Failed to optimize layout',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Intelligent Connection Suggestions - Revolutionary AI
app.post('/api/canvas/suggest-connections', async (req, res) => {
  try {
    console.log('🔗 Intelligent Connection Suggestions request received - REVOLUTIONARY FEATURE');
    const { canvasId, nodes, sourceNodeId, targetPosition } = req.body;
    
    if (!canvasId || !nodes || !Array.isArray(nodes)) {
      return res.status(400).json({ 
        error: 'Missing required data',
        message: 'canvasId and nodes array are required'
      });
    }
    
    // Generate AI-powered connection suggestions
    const suggestions = await revolutionaryCanvasService.generateConnectionSuggestions(
      canvasId,
      nodes,
      sourceNodeId,
      targetPosition
    );
    
    console.log(`✅ Generated ${suggestions.length} intelligent connection suggestions`);
    
    return res.status(200).json({ 
      success: true,
      suggestions,
      message: 'AI-powered connection suggestions generated',
      features: ['semantic_analysis', 'workflow_logic', 'type_compatibility']
    });
  } catch (error: any) {
    console.error('❌ Error generating connection suggestions:', error);
    return res.status(500).json({ 
      error: 'Failed to generate connection suggestions',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Git-like Version Control - Create Snapshot
app.post('/api/canvas/create-snapshot', async (req, res) => {
  try {
    console.log('📸 Canvas Snapshot Creation request received - GIT-LIKE VERSION CONTROL');
    const { canvasId, nodes, edges, author, message, tags = [] } = req.body;
    
    if (!canvasId || !nodes || !author || !message) {
      return res.status(400).json({ 
        error: 'Missing required data',
        message: 'canvasId, nodes, author, and message are required'
      });
    }
    
    // Create Git-like snapshot
    const snapshot = await revolutionaryCanvasService.createSnapshot(
      canvasId,
      nodes,
      edges || [],
      author,
      message,
      tags
    );
    
    console.log(`✅ Canvas snapshot created: ${snapshot.id} (${snapshot.metadata.version})`);
    
    return res.status(200).json({ 
      success: true,
      snapshot: {
        id: snapshot.id,
        version: snapshot.metadata.version,
        timestamp: snapshot.timestamp,
        author: snapshot.author,
        message: snapshot.message,
        tags: snapshot.metadata.tags
      },
      message: 'Git-like canvas snapshot created successfully'
    });
  } catch (error: any) {
    console.error('❌ Error creating canvas snapshot:', error);
    return res.status(500).json({ 
      error: 'Failed to create canvas snapshot',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Git-like Version Control - Get Snapshots
app.get('/api/canvas/:canvasId/snapshots', async (req, res) => {
  try {
    console.log('📋 Canvas Snapshots request received - VERSION HISTORY');
    const { canvasId } = req.params;
    
    if (!canvasId) {
      return res.status(400).json({ 
        error: 'Missing canvas ID',
        message: 'Canvas ID is required'
      });
    }
    
    // Get version history
    const snapshots = revolutionaryCanvasService.getCanvasSnapshots(canvasId);
    
    // Return metadata only for list view
    const snapshotMetadata = snapshots.map(snapshot => ({
      id: snapshot.id,
      version: snapshot.metadata.version,
      timestamp: snapshot.timestamp,
      author: snapshot.author,
      message: snapshot.message,
      tags: snapshot.metadata.tags,
      parent_snapshot: snapshot.metadata.parent_snapshot
    }));
    
    console.log(`✅ Retrieved ${snapshots.length} canvas snapshots`);
    
    return res.status(200).json({ 
      success: true,
      snapshots: snapshotMetadata,
      total_count: snapshots.length,
      message: 'Canvas version history retrieved'
    });
  } catch (error: any) {
    console.error('❌ Error retrieving canvas snapshots:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve canvas snapshots',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Git-like Version Control - Restore Snapshot
app.post('/api/canvas/:canvasId/restore/:snapshotId', async (req, res) => {
  try {
    console.log('🔄 Canvas Snapshot Restoration request received - GIT-LIKE RESTORE');
    const { canvasId, snapshotId } = req.params;
    
    if (!canvasId || !snapshotId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Canvas ID and Snapshot ID are required'
      });
    }
    
    // Restore from snapshot
    const snapshot = await revolutionaryCanvasService.restoreSnapshot(canvasId, snapshotId);
    
    if (!snapshot) {
      return res.status(404).json({
        error: 'Snapshot not found',
        message: `No snapshot found with ID: ${snapshotId}`
      });
    }
    
    console.log(`✅ Canvas restored from snapshot: ${snapshot.metadata.version}`);
    
    return res.status(200).json({ 
      success: true,
      restored_canvas: {
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        version: snapshot.metadata.version,
        timestamp: snapshot.timestamp
      },
      message: 'Canvas successfully restored from snapshot'
    });
  } catch (error: any) {
    console.error('❌ Error restoring canvas snapshot:', error);
    return res.status(500).json({ 
      error: 'Failed to restore canvas snapshot',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Enterprise Real-time Collaboration
app.post('/api/canvas/collaboration-event', async (req, res) => {
  try {
    console.log('👥 Collaboration Event received - REAL-TIME COLLABORATION');
    const { canvasId, type, user_id, data } = req.body;
    
    if (!canvasId || !type || !user_id) {
      return res.status(400).json({ 
        error: 'Missing required data',
        message: 'canvasId, type, and user_id are required'
      });
    }
    
    // Handle collaboration event with conflict resolution
    await revolutionaryCanvasService.handleCollaborationEvent(canvasId, {
      type,
      user_id,
      data: data || {}
    });
    
    console.log(`✅ Collaboration event processed: ${type} by ${user_id}`);
    
    return res.status(200).json({ 
      success: true,
      message: 'Collaboration event processed successfully',
      features: ['conflict_resolution', 'real_time_sync', 'multi_user_support']
    });
  } catch (error: any) {
    console.error('❌ Error processing collaboration event:', error);
    return res.status(500).json({ 
      error: 'Failed to process collaboration event',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

app.post('/optimizeLayout', async (req, res) => {
  try {
    console.log('🎯 Canvas layout optimization request received');
    const { nodes, edges, algorithm, objectives } = req.body;
    
    if (!nodes || !edges) {
      return res.status(400).json({ 
        error: 'Missing canvas data',
        message: 'Nodes and edges are required'
      });
    }

    // Apply layout optimization
    const optimizedCanvas = blueprintService.optimizeCanvasLayout(nodes, edges, {
      algorithm: algorithm || 'force-directed',
      objectives: objectives || ['minimize-crossings', 'optimize-spacing']
    });
    
    console.log(`✅ Canvas layout optimized: ${optimizedCanvas.nodes.length} nodes repositioned`);
    
    return res.status(200).json(optimizedCanvas);
  } catch (error: any) {
    console.error('❌ Error optimizing canvas layout:', error);
    return res.status(500).json({ 
      error: 'Failed to optimize canvas layout',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Execute workflow endpoint
app.post('/executeFlow', async (req, res) => {
  try {
    console.log('🔄 Workflow execution request received');
    const { flowId, nodes, edges, context = {} }: {
      flowId?: string;
      nodes: WorkflowNode[];
      edges: any[];
      context?: any;
    } = req.body;
    
    // Validate input
    if (!nodes || !nodes.length) {
      throw new Error('Workflow nodes are required');
    }

    console.log(`🔄 Starting flow execution with ${nodes.length} nodes`);
    
    // Execute the workflow using the workflow service
    const result = await workflowService.executeWorkflow(
      flowId || `flow-${uuidv4()}`,
      nodes,
      edges,
      context
    );
    
    console.log(`✅ Execution started: ${result.executionId}`);
    
    // Return execution ID immediately for async processing
    return res.status(202).json({ 
      executionId: result.executionId,
      message: 'Workflow execution started',
      status: 'running'
    });
  } catch (error: any) {
    console.error('❌ Error executing workflow:', error);
    return res.status(500).json({ 
      error: 'Failed to execute workflow',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Agent dispatch endpoint (routes to agent_service)
app.post('/agentDispatch', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('🤖 Agent dispatch request received - routing to agent service');
    
    const { agent_id, input, context = {} } = req.body;
    
    if (!agent_id || !input) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'agent_id and input are required'
      });
    }

    console.log(`Routing agent ${agent_id} execution to agent service`);
    
    // Route to agent service
    const response = await axios.post(`${AGENT_SERVICE_URL}/agent/${agent_id}/execute`, {
      input,
      context: {
        ...context,
        request_id: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'orchestrator'
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Agent execution completed in ${duration}ms`);
    
    return res.json({
      ...response.data,
      execution_metadata: {
        duration_ms: duration,
        routed_through: 'orchestrator',
        agent_service_url: AGENT_SERVICE_URL
      }
    });
  } catch (error: any) {
    console.error('❌ Error dispatching to agent service:', error);
    
    // Handle agent service unavailable
    if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
      return res.status(503).json({
        error: 'Agent service unavailable',
        message: 'The agent execution service is currently unavailable',
        fallback: 'Please try again later'
      });
    }
    
    return res.status(error.response?.status || 500).json({
      error: 'Agent execution failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Real-time workflow execution endpoint
app.post('/realtime/workflow/execute', async (req, res) => {
  try {
    console.log('⚡ Real-time workflow execution request received');
    const { workflow_id, nodes, edges, context = {} } = req.body;
    
    if (!nodes || !nodes.length) {
      return res.status(400).json({
        error: 'Missing workflow data',
        message: 'Nodes are required for workflow execution'
      });
    }

    const executionId = workflow_id || `realtime-${uuidv4()}`;
    console.log(`⚡ Starting real-time workflow: ${executionId}`);
    
    // Enhanced real-time context
    const realtimeContext = {
      ...context,
      execution_mode: 'realtime',
      streaming_enabled: true,
      websocket_updates: true,
      low_latency: true,
      timestamp: new Date().toISOString()
    };
    
    // Execute with real-time optimization
    const result = await workflowService.executeWorkflow(
      executionId,
      nodes,
      edges,
      realtimeContext
    );
    
    console.log(`✅ Real-time execution started: ${result.executionId}`);
    
    return res.status(202).json({
      executionId: result.executionId,
      websocket_url: `ws://${req.get('host')}/ws/execution/${result.executionId}`,
      message: 'Real-time workflow execution started',
      status: 'streaming',
      features: {
        real_time_updates: true,
        streaming_logs: true,
        live_metrics: true
      }
    });
  } catch (error: any) {
    console.error('❌ Error executing real-time workflow:', error);
    return res.status(500).json({
      error: 'Failed to execute real-time workflow', 
      message: error.message
    });
  }
});

// Simulation orchestration endpoint (routes to agent_service)
app.post('/simulation/orchestrate', async (req, res) => {
  try {
    console.log('🔬 Simulation orchestration request - routing to agent service');
    const { guild_id, agents, duration_minutes, load_factor, error_injection, test_scenarios } = req.body;
    
    if (!guild_id || !agents) {
      return res.status(400).json({
        error: 'Missing simulation parameters',
        message: 'guild_id and agents are required'
      });
    }

    // Route to agent service for AI-heavy simulation logic
    const response = await axios.post(`${AGENT_SERVICE_URL}/simulation/run`, {
      guild_id,
      agents,
      duration_minutes: duration_minutes || 5,
      load_factor: load_factor || 1.0,
      error_injection: error_injection || false,
      test_scenarios: test_scenarios || []
    });
    
    console.log(`✅ Simulation orchestrated successfully for guild: ${guild_id}`);
    
    return res.json({
      ...response.data,
      orchestration_metadata: {
        routed_through: 'orchestrator',
        agent_service_url: AGENT_SERVICE_URL,
        simulation_type: 'ai_powered'
      }
    });
  } catch (error: any) {
    console.error('❌ Error orchestrating simulation:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Simulation service unavailable',
        message: 'The AI simulation service is currently unavailable'
      });
    }
    
    return res.status(error.response?.status || 500).json({
      error: 'Simulation orchestration failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Legacy agent dispatch for backward compatibility
app.post('/agentDispatchLegacy', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('🤖 Legacy agent dispatch request received');
    
    const { agent_id, input, context = {} } = req.body;
    
    if (!agent_id || !input) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'agent_id and input are required'
      });
    }

    console.log(`Legacy dispatching to agent ${agent_id} with input: ${input.substring(0, 50)}...`);
    
    // Add request metadata
    const enhancedContext = {
      ...context,
      request_id: uuidv4(),
      timestamp: new Date().toISOString(),
      source: 'orchestrator',
      client_info: {
        ip: req.ip,
        user_agent: req.get('user-agent')
      },
      ...context
    };

    try {
      // Execute the agent using the agent service
      const response = await agentService.executeAgent(agent_id, input, context);
      
      console.log('Agent response received');
      res.json(response);
    } catch (error: any) {
      console.error('❌ Error dispatching to agent:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
        console.log('⚠️ Agent service unreachable, using fallback response');
        return res.json({
          output: `I processed your request about "${input}" and have generated a response using my fallback capabilities. For optimal results, please ensure the agent service is running.`,
          chain_of_thought: "Using fallback response generator since agent service is unavailable.",
          metadata: {
            processing_time_ms: Date.now() - startTime,
            model: "fallback"
          },
          status: "completed_fallback"
        });
      }
      
      res.status(500).json({ 
        error: error.message || 'Failed to dispatch to agent',
        status: 'error'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in agent dispatch route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process agent dispatch request',
      status: 'error'
    });
  }
});

// Create a new router for agent endpoints
const agentRouter = express.Router();

// Voice synthesis endpoint
agentRouter.post('/voice/synthesize', async (req, res) => {
  try {
    const { text, voice_id, stability, similarity_boost, style } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const audio = await voiceService.synthesizeSpeech(text, voice_id, {
      stability,
      similarityBoost: similarity_boost,
      style
    });
    
    res.json({ 
      audio, 
      success: true, 
      format: 'audio/mpeg' 
    });
  } catch (error: any) {
    console.error('❌ Voice synthesis failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to synthesize speech',
      success: false
    });
  }
});

// List available voices
agentRouter.get('/voice/voices', async (req, res) => {
  try {
    const voices = await voiceService.listVoices();
    res.json({ voices, count: voices.length, success: true });
  } catch (error: any) {
    console.error('❌ Failed to list voices:', error);
    res.status(500).json({
      error: error.message || 'Failed to list voices',
      success: false
    });
  }
});

// Video generation endpoint
agentRouter.post('/video/generate', async (req, res) => {
  try {
    const { text, avatar_id, webhook_url, metadata } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const result = await videoService.generateVideo(text, {
      avatarId: avatar_id,
      webhookUrl: webhook_url,
      metadata
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ Video generation failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate video',
      success: false
    });
  }
});

// Get video status
agentRouter.get('/video/status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const status = await videoService.getVideoStatus(videoId);
    res.json(status);
  } catch (error: any) {
    console.error('❌ Failed to get video status:', error);
    res.status(500).json({
      error: error.message || 'Failed to get video status',
      success: false
    });
  }
});

// List available avatars
agentRouter.get('/video/avatars', async (req, res) => {
  try {
    const avatars = await videoService.listAvatars();
    res.json({ avatars, count: avatars.length, success: true });
  } catch (error: any) {
    console.error('❌ Failed to list avatars:', error);
    res.status(500).json({
      error: error.message || 'Failed to list avatars',
      success: false
    });
  }
});

// Health endpoints for agent services
agentRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "agent-service",
    timestamp: new Date().toISOString()
  });
});

agentRouter.get('/voice/health', (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "voice-service",
    timestamp: new Date().toISOString()
  });
});

agentRouter.get('/video/health', (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "video-service",
    timestamp: new Date().toISOString()
  });
});

// Wizard API endpoints
const wizardRouter = express.Router();

// Health endpoint for wizard services
wizardRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "wizard-service",
    timestamp: new Date().toISOString()
  });
});

// Generate blueprint endpoint for wizard
wizardRouter.post('/generate-blueprint', async (req, res) => {
  try {
    console.log('🧠 Wizard: Generating blueprint via orchestrator...');
    const { user_input, ai_model = 'gemini-pro' } = req.body;
    
    if (!user_input) {
      return res.status(400).json({ 
        error: 'user_input is required',
        details: 'Please provide user input to generate blueprint'
      });
    }

    // Forward to blueprint generation service
    const blueprint = await blueprintService.generateBlueprint(user_input);
    
    console.log('✅ Wizard: Blueprint generated successfully');
    res.json(blueprint);
  } catch (error: any) {
    console.error('❌ Wizard: Blueprint generation failed:', error);
    res.status(500).json({ 
      error: 'Blueprint generation failed',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Run simulation endpoint for wizard
wizardRouter.post('/run-simulation', async (req, res) => {
  try {
    console.log('🧪 Wizard: Running simulation via orchestrator...');
    const { blueprint_id, simulation_data } = req.body;
    
    if (!blueprint_id) {
      return res.status(400).json({ 
        error: 'blueprint_id is required',
        details: 'Please provide blueprint ID for simulation'
      });
    }

    // Forward to simulation service - create config object
    const config = {
      guild_id: blueprint_id,
      agents: simulation_data?.agents || [],
      duration_minutes: simulation_data?.duration_minutes || 5,
      load_factor: simulation_data?.load_factor || 1.0,
      error_injection: simulation_data?.error_injection || false,
      test_scenarios: simulation_data?.test_scenarios || []
    };
    const results = await simulationService.runSimulation(config);
    
    console.log('✅ Wizard: Simulation completed successfully');
    res.json(results);
  } catch (error: any) {
    console.error('❌ Wizard: Simulation failed:', error);
    res.status(500).json({ 
      error: 'Simulation failed',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Deploy guild endpoint for wizard
wizardRouter.post('/deploy-guild', async (req, res) => {
  try {
    console.log('🚀 Wizard: Deploying guild via orchestrator...');
    const { guild_data, agents_data } = req.body;
    
    if (!guild_data) {
      return res.status(400).json({ 
        error: 'guild_data is required',
        details: 'Please provide guild data for deployment'
      });
    }

    // Forward to deployment service with proper parameters
    const deployment = await deploymentService.deployGuild(
      guild_data, 
      {}, // simulationResults placeholder 
      {} // credentials placeholder
    );
    
    console.log('✅ Wizard: Guild deployed successfully');
    res.json(deployment);
  } catch (error: any) {
    console.error('❌ Wizard: Guild deployment failed:', error);
    res.status(500).json({ 
      error: 'Guild deployment failed',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Mount the routers
app.use('/api/wizard', wizardRouter);
app.use('/api/agent', agentRouter);

// Analytics endpoints
const analyticsRouter = express.Router();

// Get agent analysis
analyticsRouter.post('/agent-analysis', async (req, res) => {
  try {
    const { agent_id, time_period } = req.body;
    
    if (!agent_id) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }
    
    const analysis = await analyticsService.getAgentAnalysis(agent_id, time_period);
    res.json(analysis);
  } catch (error: any) {
    console.error('❌ Failed to get agent analysis:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze agent',
      success: false
    });
  }
});

// Get guild analytics
analyticsRouter.get('/guilds/:guildId/analytics', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { period } = req.query;
    
    const analytics = await analyticsService.getGuildAnalytics(
      guildId, 
      period as string || 'week'
    );
    
    res.json(analytics);
  } catch (error: any) {
    console.error('❌ Failed to get guild analytics:', error);
    res.status(500).json({
      error: error.message || 'Failed to get analytics',
      success: false
    });
  }
});

// Mount the analytics router
app.use('/api/analytics', analyticsRouter);

// Deployment endpoints
const deploymentRouter = express.Router();

// Deploy a guild
deploymentRouter.post('/guild', async (req, res) => {
  try {
    const { blueprint, simulation_results, credentials } = req.body;
    
    if (!blueprint) {
      return res.status(400).json({ error: 'Blueprint is required' });
    }
    
    const result = await deploymentService.deployGuild(
      blueprint,
      simulation_results,
      credentials || {}
    );
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ Guild deployment failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to deploy guild',
      success: false
    });
  }
});

// Get deployment status
deploymentRouter.get('/status/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const status = await deploymentService.getDeploymentStatus(deploymentId);
    res.json(status);
  } catch (error: any) {
    console.error('❌ Failed to get deployment status:', error);
    res.status(500).json({
      error: error.message || 'Failed to get deployment status',
      success: false
    });
  }
});

// Mount the deployment router
app.use('/api/deployments', deploymentRouter);

// Get execution status endpoint
app.get('/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    if (!executionId) {
      return res.status(400).json({ error: 'Execution ID is required' });
    }

    // Get the execution status from the workflow service
    const executionStatus = workflowService.getExecutionStatus(executionId);
    
    if (!executionStatus) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${executionId}`
      });
    }
    
    res.json(executionStatus);
  } catch (error: any) {
    handleApiError(res, error, 'Failed to get execution status');
  }
});

// Blueprint generation endpoint
app.post('/generateBlueprint', async (req, res) => {
  try {
    console.log('🧠 Blueprint generation request received');
    const { user_input } = req.body;
    
    if (!user_input) {
      return res.status(400).json({ 
        error: 'Missing user input',
        message: 'User input is required'
      });
    }
    
    console.log(`Generating blueprint for: ${user_input.substring(0, 50)}...`);
    
    try {
      // Generate blueprint
      const blueprint = await blueprintService.generateBlueprint(user_input);
      
      console.log(`✅ Blueprint generated: ${blueprint.id}`);
      
      // Return the blueprint
      return res.json(blueprint);
    } catch (error: any) {
      console.error('❌ Error generating blueprint:', error);
      return res.status(500).json({ 
        error: 'Failed to generate blueprint',
        message: error.message || 'An unexpected error occurred'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in blueprint generation route:', error);
    return res.status(500).json({ 
      error: 'Failed to process blueprint generation request',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Simulation routes - NOW PROPERLY IN ORCHESTRATOR
app.post('/simulation/run', async (req, res) => {
  try {
    console.log('🧪 Simulation request received - NOW IN ORCHESTRATOR');
    const config = req.body;
    
    if (!config.guild_id || !config.agents) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'guild_id and agents are required'
      });
    }

    // Use simulation orchestration service
    const results = await simulationOrchestrationService.runSimulation(config);
    
    return res.status(200).json({
      success: true,
      message: `Simulation completed for guild ${config.guild_id}`,
      results
    });
  } catch (error: any) {
    console.error('❌ Error running simulation:', error);
    return res.status(500).json({
      error: 'Simulation failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Advanced simulation endpoint
app.post('/simulation/advanced', async (req, res) => {
  try {
    console.log('🚀 Advanced simulation request received - IN ORCHESTRATOR');
    const config = req.body;
    
    if (!config.guild_id || !config.agents) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'guild_id and agents are required'
      });
    }

    // Use advanced simulation with mock services
    const results = await simulationOrchestrationService.runAdvancedSimulation(config);
    
    return res.status(200).json({
      success: true,
      message: `Advanced simulation completed for guild ${config.guild_id}`,
      results
    });
  } catch (error: any) {
    console.error('❌ Error running advanced simulation:', error);
    return res.status(500).json({
      error: 'Advanced simulation failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Get simulation results endpoint - UPDATED FOR ORCHESTRATOR
app.get('/simulation/:simulationId/results', async (req, res) => {
  try {
    const { simulationId } = req.params;
    
    if (!simulationId) {
      return res.status(400).json({ error: 'Simulation ID is required' });
    }

    // Get results from orchestration service
    const results = simulationOrchestrationService.getSimulationResults(simulationId);
    
    if (!results) {
      return res.status(404).json({
        error: 'Simulation not found',
        message: `No simulation found with ID: ${simulationId}`
      });
    }
    
    res.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('❌ Error getting simulation results:', error);
    res.status(500).json({
      error: 'Failed to get simulation results',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// =================== INTENT UNDERSTANDING ENDPOINTS ===================

// Analyze initial intent - PHASE 1 OF INTENT SYSTEM
app.post('/intent/analyze', async (req, res) => {
  try {
    console.log('🧠 Intent analysis request received - FAANG-LEVEL ENGINE');
    const { user_id, workspace_id, raw_description } = req.body;
    
    if (!user_id || !workspace_id || !raw_description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'user_id, workspace_id, and raw_description are required'
      });
    }

    // Use intent understanding engine for Socrates-level analysis
    const businessIntent = await intentUnderstandingEngine.analyzeInitialIntent(
      user_id,
      workspace_id,
      raw_description
    );
    
    return res.status(200).json({
      success: true,
      intent: businessIntent,
      message: `Intent analyzed with ${(businessIntent.confidence_score * 100).toFixed(1)}% confidence`
    });
  } catch (error: any) {
    console.error('❌ Error analyzing intent:', error);
    return res.status(500).json({
      error: 'Intent analysis failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Start clarification session - INTERACTIVE Q&A SYSTEM
app.post('/intent/:intentId/clarify', async (req, res) => {
  try {
    console.log('🤔 Clarification session start request received');
    const { intentId } = req.params;
    const { strategy } = req.body;
    
    if (!intentId) {
      return res.status(400).json({ error: 'Intent ID is required' });
    }

    // Get the intent
    const intent = intentUnderstandingEngine.getIntent(intentId);
    if (!intent) {
      return res.status(404).json({
        error: 'Intent not found',
        message: `No intent found with ID: ${intentId}`
      });
    }

    // Start clarification session
    const session = await clarificationEngine.startClarificationSession(intent, strategy);
    
    // Get first question
    const firstQuestion = clarificationEngine.getNextQuestion(session.id);
    
    return res.status(200).json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        completion_percentage: session.completion_percentage,
        estimated_remaining_time: session.estimated_remaining_time
      },
      current_question: firstQuestion,
      message: 'Clarification session started successfully'
    });
  } catch (error: any) {
    console.error('❌ Error starting clarification session:', error);
    return res.status(500).json({
      error: 'Failed to start clarification session',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Submit clarification response - ADAPTIVE QUESTIONING
app.post('/clarification/:sessionId/respond', async (req, res) => {
  try {
    console.log('💬 Clarification response received');
    const { sessionId } = req.params;
    const { question_id, answer, confidence } = req.body;
    
    if (!sessionId || !question_id || answer === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sessionId, question_id, and answer are required'
      });
    }

    // Process the response
    const result = await clarificationEngine.processResponse(
      sessionId,
      question_id,
      answer,
      confidence || 0.8
    );
    
    return res.status(200).json({
      success: true,
      ...result,
      message: result.next_question ? 'Response processed, next question ready' : 'Session completed'
    });
  } catch (error: any) {
    console.error('❌ Error processing clarification response:', error);
    return res.status(500).json({
      error: 'Failed to process response',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Get clarification session summary - COMPREHENSIVE ANALYSIS
app.get('/clarification/:sessionId/summary', async (req, res) => {
  try {
    console.log('📊 Clarification session summary requested');
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get comprehensive summary
    const summary = clarificationEngine.getSessionSummary(sessionId);
    
    if (!summary) {
      return res.status(404).json({
        error: 'Session not found',
        message: `No clarification session found with ID: ${sessionId}`
      });
    }
    
    return res.status(200).json({
      success: true,
      ...summary,
      message: 'Session summary generated successfully'
    });
  } catch (error: any) {
    console.error('❌ Error getting session summary:', error);
    return res.status(500).json({
      error: 'Failed to get session summary',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Finalize intent with clarification responses - INTENT REFINEMENT
app.post('/intent/:intentId/finalize', async (req, res) => {
  try {
    console.log('🎯 Intent finalization requested');
    const { intentId } = req.params;
    const { session_id, responses } = req.body;
    
    if (!intentId || !session_id || !responses) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'intentId, session_id, and responses are required'
      });
    }

    // Analyze responses and refine intent
    const refinedIntent = await intentUnderstandingEngine.analyzeResponses(intentId, responses);
    
    // Get updated intent
    const updatedIntent = intentUnderstandingEngine.getIntent(intentId);
    
    return res.status(200).json({
      success: true,
      intent: updatedIntent,
      refined_intent: refinedIntent,
      message: `Intent refined with ${(refinedIntent.final_confidence_score * 100).toFixed(1)}% confidence`
    });
  } catch (error: any) {
    console.error('❌ Error finalizing intent:', error);
    return res.status(500).json({
      error: 'Intent finalization failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Get intent details
app.get('/intent/:intentId', async (req, res) => {
  try {
    const { intentId } = req.params;
    
    if (!intentId) {
      return res.status(400).json({ error: 'Intent ID is required' });
    }

    const intent = intentUnderstandingEngine.getIntent(intentId);
    
    if (!intent) {
      return res.status(404).json({
        error: 'Intent not found',
        message: `No intent found with ID: ${intentId}`
      });
    }
    
    return res.status(200).json({
      success: true,
      intent,
      message: 'Intent retrieved successfully'
    });
  } catch (error: any) {
    console.error('❌ Error getting intent:', error);
    return res.status(500).json({
      error: 'Failed to get intent',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// List user intents
app.get('/user/:userId/intents', async (req, res) => {
  try {
    const { userId } = req.params;
    const { workspace_id } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get all intents and filter by user
    const allIntents = intentUnderstandingEngine.getAllIntents();
    const userIntents = allIntents.filter(intent => {
      const matchesUser = intent.user_id === userId;
      const matchesWorkspace = !workspace_id || intent.workspace_id === workspace_id;
      return matchesUser && matchesWorkspace;
    });
    
    return res.status(200).json({
      success: true,
      intents: userIntents,
      count: userIntents.length,
      message: `Found ${userIntents.length} intents for user`
    });
  } catch (error: any) {
    console.error('❌ Error getting user intents:', error);
    return res.status(500).json({
      error: 'Failed to get user intents',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// =================== KNOWLEDGE BASE & MEMORY SYSTEM ENDPOINTS ===================

// CREATE KNOWLEDGE INDEX
app.post('/knowledge/index', async (req, res) => {
  try {
    console.log('📚 Knowledge index creation request received - PHASE 2.2 ENGINE');
    const { name, type, data } = req.body;
    
    if (!name || !type || !data) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, type, and data are required'
      });
    }

    // Create knowledge index
    const indexId = await knowledgeOrchestrationService.createKnowledgeIndex(name, type, data);
    
    return res.status(201).json({
      success: true,
      index_id: indexId,
      message: `Knowledge index '${name}' created successfully`
    });
  } catch (error: any) {
    console.error('❌ Error creating knowledge index:', error);
    return res.status(500).json({
      error: 'Knowledge index creation failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// SEARCH KNOWLEDGE BASE
app.post('/knowledge/search', async (req, res) => {
  try {
    console.log('🔍 Knowledge search request received - V8-LEVEL PERFORMANCE');
    const { query, filters, limit, threshold } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing query',
        message: 'search query is required'
      });
    }

    // Perform semantic search
    const results = await knowledgeOrchestrationService.search({
      query,
      filters,
      limit: limit || 20,
      threshold: threshold || 0.3
    });
    
    return res.status(200).json({
      success: true,
      results,
      count: results.length,
      message: `Found ${results.length} relevant knowledge chunks`
    });
  } catch (error: any) {
    console.error('❌ Error searching knowledge base:', error);
    return res.status(500).json({
      error: 'Knowledge search failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET KNOWLEDGE STATS
app.get('/knowledge/stats', async (req, res) => {
  try {
    console.log('📊 Knowledge statistics requested');
    
    const stats = await knowledgeOrchestrationService.getKnowledgeStats();
    
    return res.status(200).json({
      success: true,
      stats,
      message: 'Knowledge base statistics retrieved'
    });
  } catch (error: any) {
    console.error('❌ Error getting knowledge stats:', error);
    return res.status(500).json({
      error: 'Failed to get knowledge statistics',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE KNOWLEDGE INDEX
app.delete('/knowledge/index/:indexId', async (req, res) => {
  try {
    const { indexId } = req.params;
    
    if (!indexId) {
      return res.status(400).json({ error: 'Index ID is required' });
    }

    await knowledgeOrchestrationService.deleteKnowledgeIndex(indexId);
    
    return res.status(200).json({
      success: true,
      message: `Knowledge index ${indexId} deleted successfully`
    });
  } catch (error: any) {
    console.error('❌ Error deleting knowledge index:', error);
    return res.status(500).json({
      error: 'Failed to delete knowledge index',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET MEMORY CONTEXT FOR AGENT
app.get('/memory/:agentId/context', async (req, res) => {
  try {
    console.log('🧠 Memory context request received - ADVANCED MEMORY ENGINE');
    const { agentId } = req.params;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    const memoryContext = await knowledgeOrchestrationService.getMemoryContext(agentId);
    
    return res.status(200).json({
      success: true,
      memory_context: memoryContext,
      message: `Memory context retrieved for agent ${agentId}`
    });
  } catch (error: any) {
    console.error('❌ Error getting memory context:', error);
    return res.status(500).json({
      error: 'Failed to get memory context',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// UPDATE MEMORY CONTEXT
app.post('/memory/:agentId/context/:type', async (req, res) => {
  try {
    console.log('💾 Memory context update request received');
    const { agentId, type } = req.params;
    const { chunks } = req.body;
    
    if (!agentId || !type || !chunks) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'agentId, type, and chunks are required'
      });
    }

    const validTypes = ['shortTerm', 'longTerm', 'workingMemory', 'episodic'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid memory type',
        message: `type must be one of: ${validTypes.join(', ')}`
      });
    }

    await knowledgeOrchestrationService.updateMemoryContext(agentId, chunks, type as any);
    
    return res.status(200).json({
      success: true,
      message: `${type} memory updated for agent ${agentId}`
    });
  } catch (error: any) {
    console.error('❌ Error updating memory context:', error);
    return res.status(500).json({
      error: 'Failed to update memory context',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// CLEAR MEMORY CONTEXT
app.delete('/memory/:agentId/context', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    await knowledgeOrchestrationService.clearMemoryContext(agentId);
    
    return res.status(200).json({
      success: true,
      message: `Memory context cleared for agent ${agentId}`
    });
  } catch (error: any) {
    console.error('❌ Error clearing memory context:', error);
    return res.status(500).json({
      error: 'Failed to clear memory context',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// =================== ADVANCED MEMORY SERVICE ENDPOINTS ===================

// STORE MEMORY
app.post('/memory/store', async (req, res) => {
  try {
    console.log('🧠 Memory storage request received - EBBINGHAUS CURVE ENGINE');
    const { content, type, context, importance } = req.body;
    
    if (!content || !type || !context) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'content, type, and context are required'
      });
    }

    const memoryId = await advancedMemoryService.storeMemory(
      content,
      type,
      context,
      importance || 0.5
    );
    
    return res.status(201).json({
      success: true,
      memory_id: memoryId,
      message: 'Memory stored successfully'
    });
  } catch (error: any) {
    console.error('❌ Error storing memory:', error);
    return res.status(500).json({
      error: 'Memory storage failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// RETRIEVE MEMORIES
app.post('/memory/retrieve', async (req, res) => {
  try {
    console.log('🔍 Memory retrieval request received - ASSOCIATIVE SEARCH');
    const { query, type, agentId, timeRange, importance, limit, includeAssociations } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing query',
        message: 'search query is required'
      });
    }

    const memories = await advancedMemoryService.retrieveMemories({
      query,
      type,
      agentId,
      timeRange,
      importance,
      limit: limit || 20,
      includeAssociations: includeAssociations || false
    });
    
    return res.status(200).json({
      success: true,
      memories,
      count: memories.length,
      message: `Retrieved ${memories.length} relevant memories`
    });
  } catch (error: any) {
    console.error('❌ Error retrieving memories:', error);
    return res.status(500).json({
      error: 'Memory retrieval failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// UPDATE MEMORY
app.put('/memory/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    const updates = req.body;
    
    if (!memoryId) {
      return res.status(400).json({ error: 'Memory ID is required' });
    }

    await advancedMemoryService.updateMemory(memoryId, updates);
    
    return res.status(200).json({
      success: true,
      message: `Memory ${memoryId} updated successfully`
    });
  } catch (error: any) {
    console.error('❌ Error updating memory:', error);
    return res.status(500).json({
      error: 'Memory update failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// DELETE MEMORY
app.delete('/memory/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    
    if (!memoryId) {
      return res.status(400).json({ error: 'Memory ID is required' });
    }

    await advancedMemoryService.deleteMemory(memoryId);
    
    return res.status(200).json({
      success: true,
      message: `Memory ${memoryId} deleted successfully`
    });
  } catch (error: any) {
    console.error('❌ Error deleting memory:', error);
    return res.status(500).json({
      error: 'Memory deletion failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// GET MEMORY STATISTICS
app.get('/memory/stats', async (req, res) => {
  try {
    console.log('📊 Memory statistics requested');
    
    const stats = await advancedMemoryService.getMemoryStats();
    
    return res.status(200).json({
      success: true,
      stats,
      message: 'Memory statistics retrieved'
    });
  } catch (error: any) {
    console.error('❌ Error getting memory stats:', error);
    return res.status(500).json({
      error: 'Failed to get memory statistics',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// CLEAR AGENT MEMORIES
app.delete('/memory/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    await advancedMemoryService.clearMemoriesForAgent(agentId);
    
    return res.status(200).json({
      success: true,
      message: `All memories cleared for agent ${agentId}`
    });
  } catch (error: any) {
    console.error('❌ Error clearing agent memories:', error);
    return res.status(500).json({
      error: 'Failed to clear agent memories',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Centralized error handling for API endpoints
function handleApiError(res: express.Response, error: any, defaultMessage: string) {
  console.error(`❌ API Error: ${error}`);
  
  let statusCode = 500;
  let errorMessage = error.message || defaultMessage;
  
  // Determine appropriate status code based on error type
  if (error.status === 404 || errorMessage.includes('not found')) {
    statusCode = 404;
  } else if (error.status === 400 || 
            errorMessage.includes('invalid') || 
            errorMessage.includes('required')) {
    statusCode = 400;
  } else if (error.status === 401 || errorMessage.includes('unauthorized')) {
    statusCode = 401;
  } else if (error.status === 403 || errorMessage.includes('forbidden')) {
    statusCode = 403;
  }
  
  res.status(statusCode).json({ 
    error: errorMessage,
    status: 'error',
    timestamp: new Date().toISOString()
  });
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { source, event, payload } = req.body;
    
    console.log(`📡 Webhook received from ${source || 'unknown source'}`);
    console.log(`📡 Event: ${event || 'unspecified event'}`);
    
    // Process webhook event
    // In a real implementation, this would trigger relevant workflows
    
    res.status(200).json({ 
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process webhook',
      status: 'error'
    });
  }
});

// Server startup is now handled by startServerWithRetry at the bottom of this file

process.on('SIGINT', async () => {
  console.log('🛑 Orchestrator shutting down...');
  
  // Close Redis client if it exists
  if (redisClient) {
    console.log('Closing Redis connection...');
    await redisClient.quit();
    console.log('✅ Redis client closed');
  }
  
  console.log('✅ GenesisOS Orchestrator shutdown complete');
  process.exit(0);
});

// ============================================================================
// PHASE 1 CRITICAL ORCHESTRATOR ENDPOINTS - EINSTEIN ENGINE INTEGRATION
// ============================================================================

// Enhanced Blueprint Generation with Phase 1 Engines  
app.post('/api/blueprint/enhanced-generate', async (req, res) => {
  try {
    const { prompt, usePhase1Engines = true } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    console.log('🧠 Enhanced blueprint generation with Phase 1 engines...');

    if (usePhase1Engines) {
      try {
        // Try to use Agent Service Phase 1 endpoints
        const einsteinResponse = await axios.post(`${AGENT_SERVICE_URL}/api/ai/einstein/analyze`, {
          user_input: prompt
        });

        if (einsteinResponse.data.success) {
          const analysis = einsteinResponse.data.data;
          
          // Generate blueprint from Einstein analysis
          const enhancedBlueprint = {
            id: `enhanced-${Date.now()}`,
            prompt,
            analysis,
            agents: analysis.suggested_agents || [],
            processes: analysis.identified_processes || [],
            integrations: analysis.required_integrations || [],
            cost_prediction: null,
            mcp_tools: null,
            created_at: new Date().toISOString(),
            enhanced: true
          };

          // Try to add cost prediction
          try {
            const costResponse = await axios.post(`${AGENT_SERVICE_URL}/api/ai/cost-prediction/predict`, {
              blueprint: enhancedBlueprint
            });
            if (costResponse.data.success) {
              enhancedBlueprint.cost_prediction = costResponse.data.data;
            }
          } catch (costError) {
            console.warn('Cost prediction failed, continuing without it');
          }

          // Try to add MCP tools
          try {
            const mcpResponse = await axios.post(`${AGENT_SERVICE_URL}/api/ai/mcp/discover`, {
              goals: analysis.extracted_goals || [prompt]
            });
            if (mcpResponse.data.success) {
              enhancedBlueprint.mcp_tools = mcpResponse.data.data;
            }
          } catch (mcpError) {
            console.warn('MCP discovery failed, continuing without it');
          }

          console.log('✅ Enhanced blueprint generated with Phase 1 intelligence');
          return res.json({
            success: true,
            data: { blueprint: enhancedBlueprint },
            source: 'phase1_engines'
          });
        }
      } catch (phase1Error) {
        console.warn('Phase 1 engines failed, falling back to legacy blueprint generation');
      }
    }

    // Fallback to legacy blueprint generation
    const blueprint = await blueprintService.generateBlueprint(prompt);
    
    res.json({
      success: true,
      data: { blueprint },
      source: 'legacy_fallback'
    });

  } catch (error: unknown) {
  let message = "An unknown error occurred";
  if (error instanceof Error) {
    message = error.message;
  }

  res.status(500).json({
    error: 'Guild deployment failed',
    details: message
  });
}
});

// Phase 1 Integration Health Check
app.get('/api/phase1/health', async (req, res) => {
  try {
    const healthChecks = {
      orchestrator: true,
      agent_service: false,
      einstein_engine: false,
      cost_prediction: false,
      mcp_integration: false
    };

    // Check Agent Service
    try {
      const agentResponse = await axios.get(`${AGENT_SERVICE_URL}/health`, { timeout: 5000 });
      healthChecks.agent_service = agentResponse.status === 200;
    } catch (error) {
      console.warn('Agent service health check failed');
    }

    // Check Phase 1 endpoints if agent service is healthy
    if (healthChecks.agent_service) {
      try {
        const einsteinCheck = await axios.get(`${AGENT_SERVICE_URL}/api/ai/einstein/health`, { timeout: 3000 });
        healthChecks.einstein_engine = einsteinCheck.status === 200;
      } catch (error) {
        console.warn('Einstein engine health check failed');
      }

      try {
        const costCheck = await axios.get(`${AGENT_SERVICE_URL}/api/ai/cost-prediction/health`, { timeout: 3000 });
        healthChecks.cost_prediction = costCheck.status === 200;
      } catch (error) {
        console.warn('Cost prediction health check failed');
      }

      try {
        const mcpCheck = await axios.get(`${AGENT_SERVICE_URL}/api/ai/mcp/health`, { timeout: 3000 });
        healthChecks.mcp_integration = mcpCheck.status === 200;
      } catch (error) {
        console.warn('MCP integration health check failed');
      }
    }

    const overallHealth = Object.values(healthChecks).every(status => status === true);

    res.json({
      success: true,
      data: {
        overall_healthy: overallHealth,
        services: healthChecks,
        phase1_complete: healthChecks.einstein_engine && healthChecks.cost_prediction && healthChecks.mcp_integration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Phase 1 health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Phase 1 health check failed'
    });
  }
});

// ============================================================================
// END PHASE 1 ORCHESTRATOR ENDPOINTS  
// ============================================================================

// Enhanced port cleanup and graceful startup
async function killPortProcesses(port: number): Promise<void> {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);

  try {
    if (process.platform === 'win32') {
      // Windows - more aggressive cleanup
      await execAsync(`taskkill /F /IM node.exe /T 2>nul || echo "No node processes found"`);
      await execAsync(`taskkill /F /IM ts-node.exe /T 2>nul || echo "No ts-node processes found"`);
      
      // Wait for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for any remaining processes on the port
      try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        if (stdout.trim()) {
          const lines = stdout.split('\n');
          const pids = new Set<string>();
          
          lines.forEach((line: string) => {
            const match = line.match(/\s+(\d+)$/);
            if (match && match[1] !== '0') pids.add(match[1]);
          });
          
          if (pids.size > 0) {
            console.log(`🔄 Found ${pids.size} processes still using port ${port}, killing...`);
            for (const pid of pids) {
              try {
                await execAsync(`taskkill /F /PID ${pid}`);
              } catch (e) {
                // Ignore individual failures
              }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (e) {
        // No processes found on port
      }
    } else {
      // Unix-like systems
      try {
        await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        // Ignore errors
      }
    }
  } catch (error) {
    console.log(`⚠️ Port cleanup warning: ${error}`);
  }
}

async function startServer() {
  let server: any = null;
  let retries = 3;
  
  while (retries > 0) {
    try {
      // Aggressive port cleanup
      console.log(`🧹 Cleaning up port ${PORT}...`);
      await killPortProcesses(Number(PORT));
      
      // Create server with retry logic
      server = app.listen(PORT, () => {
        console.log(`🚀 GenesisOS Orchestrator ready at http://localhost:${PORT}`);
        console.log(`🧠 Intent Understanding Engine: FAANG-LEVEL EXCELLENCE ACTIVE`);
        console.log(`🤔 Clarification Engine: SOCRATIC QUESTIONING READY`);
        
        // API Documentation
        console.log(`📋 API Endpoints available:\n`);
        console.log(`  🧠 INTENT UNDERSTANDING (NEW - PHASE 2):`);
        console.log(`  - POST /intent/analyze                    (Analyze user intent)`);
        console.log(`  - POST /intent/:intentId/clarify          (Start clarification session)`);
        console.log(`  - POST /clarification/:sessionId/respond  (Submit clarification response)`);
        console.log(`  - GET  /clarification/:sessionId/summary  (Get session summary)`);
        console.log(`  - POST /intent/:intentId/finalize         (Finalize intent)`);
        console.log(`  - GET  /intent/:intentId                  (Get intent details)`);
        console.log(`  - GET  /user/:userId/intents              (List user intents)\n`);
        
        console.log(`  🎨 CANVAS ORCHESTRATION:`);
        console.log(`  - POST /generateCanvas`);
        console.log(`  - POST /generateEnterpriseCanvas`);
        console.log(`  - POST /optimizeLayout\n`);
        
        console.log(`  🔄 WORKFLOW ORCHESTRATION:`);
        console.log(`  - POST /executeFlow`);
        console.log(`  - POST /executeEnterpriseFlow`);
        console.log(`  - GET  /execution/:executionId`);
        console.log(`  - GET  /execution/:executionId/metrics\n`);
        
        console.log(`  🧪 SIMULATION ORCHESTRATION:`);
        console.log(`  - POST /simulation/run`);
        console.log(`  - POST /simulation/advanced`);
        console.log(`  - GET  /simulation/:simulationId/results\n`);
        
        console.log(`  📊 ANALYTICS & MONITORING:`);
        console.log(`  - POST /api/analytics/agent-analysis`);
        console.log(`  - GET  /api/analytics/guilds/:guildId/analytics\n`);
        
        console.log(`  🤖 AGENT DISPATCH:`);
        console.log(`  - POST /agentDispatch`);
        console.log(`  - POST /agentDispatchLegacy\n`);
        
        console.log(`  🗣️ VOICE & VIDEO:`);
        console.log(`  - POST /api/agent/voice/synthesize`);
        console.log(`  - GET  /api/agent/voice/voices`);
        console.log(`  - POST /api/agent/video/generate`);
        console.log(`  - GET  /api/agent/video/status/:videoId\n`);
        
        console.log(`  🧠 BLUEPRINT GENERATION:`);
        console.log(`  - POST /generateBlueprint`);
        console.log(`  - POST /api/wizard/generate-blueprint\n`);
        
        console.log(`  🚀 DEPLOYMENT:`);
        console.log(`  - POST /api/deployments/guild`);
        console.log(`  - GET  /api/deployments/status/:deploymentId\n`);
      });

      // Enhanced error handling
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} still in use (attempt ${4 - retries}/3)`);
          if (retries > 1) {
            console.log(`🔄 Retrying in 3 seconds...`);
            retries--;
            server = null;
            setTimeout(() => startServer(), 3000);
            return;
          } else {
            console.error(`💀 Unable to start server after 3 attempts`);
            console.error(`🔧 Manual cleanup required:`);
            console.error(`   Windows: taskkill /F /IM node.exe && taskkill /F /IM ts-node.exe`);
            console.error(`   Unix: sudo lsof -ti:${PORT} | xargs kill -9`);
            process.exit(1);
          }
        }
        console.error('❌ Server error:', err);
        process.exit(1);
      });

      return server;
    } catch (error) {
      console.error(`❌ Server startup failed (attempt ${4 - retries}/3):`, error);
      retries--;
      if (retries === 0) {
        console.error('💀 All startup attempts failed');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

// Global server instance for graceful shutdown
let globalServer: any = null;

// Enhanced graceful shutdown
function setupGracefulShutdown() {
  const signals = ['SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2'];
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n🛑 Received ${signal}, gracefully shutting down orchestrator...`);
      
      if (globalServer) {
        try {
          // Stop accepting new connections
          globalServer.close(async () => {
            console.log('🔌 Server connections closed');
            
            // Close Redis connection
            if (redisClient && redisClient.isOpen) {
              try {
                await redisClient.quit();
                console.log('🗄️ Redis connection closed');
              } catch (err) {
                console.error('⚠️ Redis shutdown error:', err);
              }
            }
            
            console.log('✅ Orchestrator shutdown complete');
            process.exit(0);
          });
          
          // Force exit after 10 seconds
          setTimeout(() => {
            console.error('💀 Force exit after 10 seconds');
            process.exit(1);
          }, 10000);
          
        } catch (error) {
          console.error('❌ Shutdown error:', error);
          process.exit(1);
        }
      } else {
        console.log('⚠️ No server instance to close');
        process.exit(0);
      }
    });
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Setup graceful shutdown handlers
setupGracefulShutdown();

// =============================================================================
// SIMPLIFIED STARTUP WITH EXTERNAL MODULE
// =============================================================================

import { startServerWithRetry } from './startup';

// Start the server with enhanced error handling and client initialization
startServerWithRetry(app, Number(PORT), initializeClients)
  .then((server) => {
    if (server) {
      globalServer = server;
      console.log('✅ Server instance captured for graceful shutdown');
      
      // Keep the process alive
      process.stdin.resume();
    }
  })
  .catch((error) => {
    console.error('💀 Failed to start server:', error);
    process.exit(1);
  });